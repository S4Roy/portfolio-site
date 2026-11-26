---
title: Node.js Error Handling and Graceful Shutdown in Express (Tested)
description: Production error handling for Node.js and Express 5: async errors, a central error middleware, unhandled rejections, and graceful shutdown that loses zero requests, with measured results.
date: 2026-11-26
tags: Node.js, Express, Production
keyword: node js error handling best practices
draft: false
---

Two things decide whether a Node.js API behaves well on a bad day: what happens when **something throws**, and what happens when the **process is stopped**. Get them wrong and you see crashes from a single bad request, error responses that leak stack traces, and failed requests every time you deploy.

This guide tests both with small Express apps on **Node.js 22**, **Express 5.3** and, for comparison, **Express 4.22**. Every result below was produced by running the code.

## 1. Async errors: Express 4 vs Express 5

The same route in both versions:

```js
app.get('/orders/:id', async (req, res) => {
  const order = await db.findOrder(req.params.id); // throws: connection lost
  res.json(order);
});

app.use((err, req, res, next) => res.status(500).json({ error: 'handled' }));
```

```text
Express 5.3:  500 {"error":{"code":"INTERNAL_ERROR","message":"Something went wrong"}}
Express 4.22: process crashed: Error: db connection lost (unhandled rejection)
```

**Express 4 does not catch rejected promises.** The error never reached the error middleware. It became an unhandled rejection, and Node 22 terminated the whole process, taking every other in-flight request with it. **Express 5 passes rejected promises to `next(err)` automatically**, so the error middleware handled it.

On Express 4, wrap async handlers (or use `express-async-errors`):

```js
const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

app.get('/orders/:id', asyncHandler(async (req, res) => { ... }));
```

If you are still on Express 4, this alone is a strong reason to upgrade.

## 2. One central error middleware

Handle errors in one place, so every endpoint returns the same shape and nothing leaks internal details:

```js
class AppError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

// in a route or service
if (!order) throw new AppError(404, 'ORDER_NOT_FOUND', 'Order not found');

// last middleware
app.use((err, req, res, next) => {
  const status = err.status ?? 500;
  if (status >= 500) logger.error({ err, path: req.path }, 'request failed');

  res.status(status).json({
    error: {
      code: err.code ?? 'INTERNAL_ERROR',
      message: status >= 500 ? 'Something went wrong' : err.message,
    },
  });
});
```

```text
GET /async-throw  -> 500 {"error":{"code":"INTERNAL_ERROR","message":"Something went wrong"}}
GET /not-found    -> 404 {"error":{"code":"ORDER_NOT_FOUND","message":"Order not found"}}
```

The distinction that matters:

- **Expected (operational) errors**: not found, validation failed, permission denied, payment declined. Return a clear 4xx with a stable `code` the frontend can act on.
- **Unexpected errors**: bugs, a lost database connection, a null reference. Log everything (stack, request ID, user), and return a generic 500. Never send `err.message` or the stack to the client: they can expose table names, file paths and library versions.

A stable error `code` (`ORDER_NOT_FOUND`, `TOKEN_EXPIRED`) is more useful to clients than the message text. The frontend can show a translated message or refresh a token (see [JWT Access and Refresh Tokens](/blog/jwt-access-refresh-token-nodejs)) without parsing English strings.

## 3. Errors Express can't catch

Express only sees errors thrown in the request's own chain, synchronously or in the returned promise. Two common patterns escape it:

```js
// a promise nobody awaits
app.get('/floating', (req, res) => {
  sendWelcomeEmail(req.user); // returns a promise that rejects
  res.json({ ok: true });
});

// a throw inside a callback or timer
app.get('/callback', (req, res) => {
  setTimeout(() => { throw new Error('thrown in a timer'); }, 5);
});
```

```text
/floating  -> 200 {"ok":true}, then the process exited with code 1
/callback  -> request failed (socket closed), process exited with code 1
```

The `/floating` request even succeeded, and then the unhandled rejection crashed the process a moment later. Since Node 15, an unhandled rejection terminates the process by default. That's the right default, because the alternative is silently ignoring errors.

**Fixes:**

- `await` every promise, or attach a `.catch()` when you deliberately don't wait:
  ```js
  sendWelcomeEmail(req.user).catch((err) => logger.error({ err }, 'welcome email failed'));
  ```
- Use promise-based APIs (`await setTimeout()` from `node:timers/promises`, `fs/promises`) instead of callbacks, so errors flow back into `async` functions.
- Better still, move side work like emails into a job queue with its own retries.

### Last-resort handlers

```js
process.on('unhandledRejection', (reason) => {
  logger.fatal({ err: reason }, 'unhandled rejection');
  shutdown(1); // graceful, see below
});

process.on('uncaughtException', (err) => {
  logger.fatal({ err }, 'uncaught exception');
  shutdown(1);
});
```

These handlers are for **logging and exiting cleanly**, not for continuing. After an uncaught exception, the process may be in an inconsistent state: half-written data, locks held, connections broken. Log, stop accepting traffic, and let PM2, systemd or your orchestrator start a fresh process.

## 4. Graceful shutdown: the deploy problem

Every deploy, restart and scale-down sends your process a `SIGTERM`. By default, Node exits immediately, and any request in progress fails.

Test: a server with a 500 ms endpoint, 20 requests in flight, then `SIGTERM`:

```text
no handler     completed  0/20, failed 20 | exited after 23 ms
```

Every user mid-request got a connection error. On a busy API, every deploy causes a burst of failures.

### Step 1: stop accepting, finish in-flight requests

```js
const server = app.listen(PORT);

process.on('SIGTERM', () => {
  server.close(() => process.exit(0)); // stop accepting; exit when connections finish
  setTimeout(() => process.exit(1), 10_000).unref(); // safety timeout
});
```

```text
server.close   completed 20/20, failed 0 | drained in 3,428 ms
```

No requests lost. New connections after `SIGTERM` were refused (`ECONNREFUSED`), so a load balancer or PM2 sends them elsewhere. But it took **3.4 seconds** for requests that finish in 0.5 seconds.

### Step 2: close keep-alive connections

The delay comes from **keep-alive**. After answering, each client connection stays open, idle, waiting for its next request. `server.close()` waits for every connection to close, so it waits until those idle sockets time out. Fix it by telling clients to close the connection on the final response, and closing idle sockets as they appear:

```js
let shuttingDown = false;

app.use((req, res, next) => {
  if (shuttingDown) res.set('Connection', 'close');
  next();
});

function shutdown(code = 0) {
  if (shuttingDown) return;
  shuttingDown = true;

  server.close(async () => {
    await mongoose.connection.close(); // then close DB, Redis, queues
    process.exit(code);
  });

  server.closeIdleConnections();
  setInterval(() => server.closeIdleConnections(), 100).unref();
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on('SIGTERM', () => shutdown(0));
process.on('SIGINT', () => shutdown(0));
```

```text
no handler           completed  0/20 | exited after    23 ms
server.close         completed 20/20 | drained in   3,428 ms
+ close keep-alive   completed 20/20 | drained in     423 ms
```

All 20 requests completed, and the process exited as soon as the last one finished.

**Order matters:** stop accepting HTTP traffic first, let in-flight requests finish, then close the database, cache and queue connections they use. Closing the database first fails the requests you're trying to save.

### Make it work with your process manager

- **PM2** waits `kill_timeout` (default 1,600 ms) after `SIGINT` before force-killing. If your requests can take longer, raise it in `ecosystem.config.js` (`kill_timeout: 10000`). With cluster mode, `pm2 reload` restarts workers one at a time, so the app stays available. See [deploying Node.js with PM2](/blog/deploy-nodejs-aws-ec2-pm2-apache-ssl).
- **Docker / Kubernetes** send `SIGTERM`, then `SIGKILL` after a grace period (10 s in Docker, 30 s in Kubernetes by default). Run Node as PID 1 directly (`CMD ["node", "server.js"]`), not through `npm start`, which may not forward signals.
- **Load balancers:** after `SIGTERM`, make the health check fail first, so the balancer stops routing new traffic before connections close.
- Keep the **safety timeout** shorter than the platform's kill timeout, so you exit on your terms and log it.

## 5. Small habits that pay off

- **Validate input at the edge** (zod, Joi, express-validator) and turn validation failures into a 400 with field details, before they become confusing 500s deeper in the code.
- **Add a request ID** to every log line and error response, so a user's report can be matched to the exact log entry.
- **Set timeouts on outgoing calls** (`AbortSignal.timeout(5000)` with `fetch`) so a slow dependency becomes a handled error instead of a hanging request.
- **Don't swallow errors.** `catch (e) {}` hides bugs. Handle the error, or rethrow it with context: `throw new Error('failed to load invoice', { cause: err })`.
- **Return 404 for unknown routes** with the same JSON shape, by adding a catch-all before the error middleware.

## Checklist

| Problem | Fix |
| --- | --- |
| Async errors crash Express 4 | Upgrade to Express 5, or wrap handlers |
| Inconsistent error responses, leaked stack traces | One error middleware, `AppError` with status and code |
| Un-awaited promises crash the process | `await` or `.catch()`, job queue for side work |
| Errors in timers and callbacks | Promise-based APIs |
| Unknown failures | `unhandledRejection` / `uncaughtException`: log, then shut down |
| Requests fail on every deploy | `SIGTERM` → `server.close()` |
| Shutdown slow because of keep-alive | `Connection: close` + `closeIdleConnections()` |
| Force-killed before draining | Safety timeout below PM2 `kill_timeout` / container grace period |

## Interview questions: quick answers

**How does Express 5 handle async errors?**
If an async route handler or middleware returns a rejected promise, Express 5 calls `next(err)` automatically, so the error middleware handles it. Express 4 does not, and the rejection becomes unhandled.

**What happens on an unhandled promise rejection in Node.js?**
Since Node 15, the process prints the error and exits with code 1 (`--unhandled-rejections=throw` is the default).

**Should you keep the process running after an uncaughtException?**
No. The application may be in an inconsistent state. Log the error, shut down gracefully, and let a process manager restart it.

**What is graceful shutdown?**
On `SIGTERM`, the server stops accepting new connections, finishes in-flight requests, closes database and other connections, then exits. No request in progress is lost.

**Why can server.close() take a long time?**
It waits for all open connections to close, including idle keep-alive connections. Send `Connection: close` during shutdown and call `server.closeIdleConnections()`.

**What is the difference between operational errors and programmer errors?**
Operational errors are expected runtime conditions (invalid input, not found, a dependency timing out) that you handle and report. Programmer errors are bugs (undefined is not a function), which you fix. The safe response to an unknown bug is to log it and restart.

## Summary

Tested on Node.js 22:

- An async throw **crashed Express 4.22**, and was **handled by Express 5.3** with a clean 500.
- An un-awaited rejected promise **returned 200, then crashed the process**.
- `SIGTERM` with no handler **failed 20 of 20** in-flight requests.
- `server.close()` saved all 20 but took **3.4 s** because of keep-alive; closing idle connections cut it to **423 ms**.

Handle errors in one place, let the process die cleanly when it must, and never drop a request on deploy.

If you are hiring for [Node.js](/expertise/nodejs) or full stack roles, [get in touch](/#contact).
