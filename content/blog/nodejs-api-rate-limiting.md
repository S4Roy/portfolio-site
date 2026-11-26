---
title: API Rate Limiting in Node.js: Algorithms, Express Setup and Common Mistakes
description: Rate limiting for Node.js APIs, tested: fixed window vs sliding window vs token bucket, express-rate-limit setup, and the proxy and cluster mistakes that quietly break limits.
date: 2026-11-26
tags: Node.js, Express, Security
keyword: node js rate limiting
draft: false
---

Rate limiting protects an API from brute-force logins, scraping, runaway scripts and accidental retry loops. Adding a middleware takes five minutes, but two configuration mistakes can quietly turn the limit into nothing, or into an outage for every user at once.

This guide compares the main rate limiting algorithms in a simulation, then tests a real Express setup with **express-rate-limit 7.5**, **Express 5.3** and **Node.js 22**. Every result below was produced by running the code.

## The algorithms

All four were given the same rule: **100 requests per 60 seconds per client**.

| Algorithm | How it works | Memory per client |
| --- | --- | --- |
| **Fixed window** | Count requests per calendar minute; reset at :00 | 2 numbers |
| **Sliding log** | Store each request timestamp; count those in the last 60 s | Up to 100 timestamps |
| **Sliding window counter** | Weight the previous window's count by how much of it overlaps the last 60 s | 3 numbers |
| **Token bucket** | A bucket of 100 tokens refills steadily; each request takes one | 2 numbers |

### Test 1: a burst at the window boundary

A client sends 100 requests at 59.9 seconds, then 100 more at 60.1 seconds:

```text
fixed window     allowed 200 of 200 within ~0.3 s
sliding log      allowed 100 of 200
sliding counter  allowed 101 of 200
token bucket     allowed 100 of 200
```

The fixed window allowed **double the limit** in a fraction of a second, because the counter reset at the 60-second mark. That's the main weakness of fixed windows: a client that times its requests can get up to twice the limit at each boundary.

### Test 2: repeated boundary bursts

Bursts of 150 requests around every minute boundary for 10 minutes. The worst 60-second period for each algorithm:

```text
fixed window     max in any 60 s: 150 (limit 100)
sliding log      max in any 60 s: 100
sliding counter  max in any 60 s: 101
token bucket     max in any 60 s: 100
```

The sliding counter is an approximation (it assumes the previous window's requests were spread evenly), so it can be off by about one request here. It's very close to exact while storing only three numbers, which is why many production limiters use it.

### Test 3: a steady abuser

A script sending 10 requests per second for 5 minutes (3,000 requests; 5 minutes × 100 = 500 is the "ideal" allowance):

```text
fixed window     allowed 500
sliding log      allowed 500
sliding counter  allowed 500
token bucket     allowed 599
```

The token bucket allowed 99 more, and that's by design. It starts full, so a client can spend a **burst** of 100 immediately, then continues at the refill rate. Token buckets suit APIs where short bursts are normal (a page load that fires ten requests), as long as the average rate stays limited.

### Which algorithm should you use?

- **Fixed window:** simplest, and fine for generous limits where a 2× burst doesn't matter.
- **Sliding window counter:** the best default. Nearly exact, constant memory, easy to implement in Redis.
- **Sliding log:** exact, but stores every timestamp. Use it only for small limits (for example, 5 login attempts).
- **Token bucket:** when you want to allow bursts but cap the sustained rate.

## Setting up express-rate-limit

```js
const express = require('express');
const { rateLimit } = require('express-rate-limit');

const app = express();
app.set('trust proxy', 1); // see the next section

const apiLimiter = rateLimit({
  windowMs: 60_000,
  limit: 100,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: { code: 'RATE_LIMITED', message: 'Too many requests' } },
});

app.use('/api', apiLimiter);
```

Clients get standard headers telling them their budget, and a clear 429 when they exceed it:

```text
RateLimit-Policy: "10-in-1min"; q=10; w=60
RateLimit:        "10-in-1min"; r=9; t=60

HTTP 429 {"error":{"code":"RATE_LIMITED","message":"Too many requests"}}
Retry-After: 60
```

Well-behaved clients (and your own frontend) can read `Retry-After` and back off instead of hammering the API. Use the same JSON error shape as the rest of your API (see [Node.js Error Handling](/blog/nodejs-error-handling-graceful-shutdown)).

## Mistake 1: not trusting the proxy

In production, Node usually runs behind Nginx, Apache, a load balancer or Cloudflare. Every request then reaches Express from the **proxy's** IP address, and the real client IP is in the `X-Forwarded-For` header.

Test: two different users behind the same proxy, with a limit of 10 per minute. User A sends 10 requests, then user B sends 5:

```text
trust proxy off:  user A: 10 allowed | user B: 0 allowed, 5 blocked
trust proxy on:   user A: 10 allowed | user B: 5 allowed
```

**Without `trust proxy`, user B was blocked by user A's requests.** Express saw every request coming from the proxy, so all users shared one counter. In production, one busy user, or one attacker, would lock out everyone. express-rate-limit detects this and logs `ERR_ERL_UNEXPECTED_X_FORWARDED_FOR`, so check your logs for it.

Set `trust proxy` to the **number of proxies** in front of the app (`1` for a single Nginx or Apache), not `true`. With `true`, Express trusts any `X-Forwarded-For` value, and a client can send a fake header to get a fresh limit on every request. For the Apache setup this site uses, see [Deploying Node.js on AWS EC2 with PM2, Apache and SSL](/blog/deploy-nodejs-aws-ec2-pm2-apache-ssl).

## Mistake 2: in-memory limits with multiple processes

The default store keeps counters in process memory. With PM2 cluster mode or several containers, **each process has its own counters**:

```text
limit 10/min, 1 worker,  100 requests from one client: 10 allowed, 90 blocked
limit 10/min, 4 workers, 100 requests from one client: 40 allowed, 60 blocked
```

With four workers, the client got **four times the limit**, because requests were spread across processes that each allowed 10. With more instances or autoscaling, the real limit keeps growing.

The fix is a **shared store**, usually Redis, so every process reads and updates the same counters:

```js
const { RedisStore } = require('rate-limit-redis');
const { createClient } = require('redis');

const client = createClient({ url: process.env.REDIS_URL });
await client.connect();

const apiLimiter = rateLimit({
  windowMs: 60_000,
  limit: 100,
  store: new RedisStore({ sendCommand: (...args) => client.sendCommand(args) }),
});
```

Redis operations like `INCR` with an expiry are atomic, so concurrent requests from different processes are counted correctly. The same per-process problem applies to in-memory caches and sessions; see [Worker Threads vs Cluster](/blog/nodejs-worker-threads-vs-cluster).

## Different limits for different endpoints

One global limit is rarely right. Limit by **cost and risk**:

```js
// strict: brute-force protection, keyed by account as well as IP
const loginLimiter = rateLimit({
  windowMs: 15 * 60_000,
  limit: 5,
  skipSuccessfulRequests: true, // only failed attempts count
  keyGenerator: (req) => `${req.ip}:${req.body?.email ?? ''}`,
});

// expensive: report generation, exports, AI calls
const heavyLimiter = rateLimit({ windowMs: 60_000, limit: 5 });

app.post('/auth/login', loginLimiter, login);
app.post('/auth/forgot-password', loginLimiter, forgotPassword);
app.get('/api/reports/:id/export', heavyLimiter, exportReport);
app.use('/api', apiLimiter);
```

- **Login, OTP and password reset:** strict limits, counting failed attempts. Key by account as well as IP, because attackers rotate IPs. If you build your own `keyGenerator` from an IP address, group IPv6 addresses by their network prefix (for example /64), because one user can rotate through many addresses in their range.
- **Authenticated APIs:** key by **user ID or API key** rather than IP. Many users can share one office or mobile carrier IP.
- **Expensive endpoints:** lower limits, or a queue. Rate limiting decides who may call; it doesn't make slow work cheaper.
- **Health checks and webhooks:** usually excluded (`skip: (req) => req.path === '/health'`).

## Rate limiting is one layer

- **At the edge:** Nginx `limit_req`, Cloudflare or an API gateway can drop abusive traffic before it reaches Node, which is cheaper and protects against floods the app can't absorb.
- **In the app:** per-user and per-endpoint rules that need application knowledge (user ID, plan tier, failed logins).
- **Elsewhere:** request body size limits (`express.json({ limit: '100kb' })`), timeouts, pagination limits, and [idempotency keys](/blog/prevent-duplicate-payments-nodejs) for retried writes.

## Checklist

| Check | Fix |
| --- | --- |
| Behind a proxy or load balancer | `app.set('trust proxy', <number of proxies>)` |
| More than one process or instance | Shared store (Redis) |
| Login / OTP / password reset | Strict limit, failed attempts only, key by account + IP |
| Authenticated API | Key by user ID or API key |
| Clients don't know when to retry | `standardHeaders`, `Retry-After`, a JSON 429 |
| Boundary bursts matter | Sliding window or token bucket instead of a fixed window |
| Large floods | Edge rate limiting (Nginx, Cloudflare, gateway) |

## Interview questions: quick answers

**What is rate limiting?**
Restricting how many requests a client can make in a time period, to protect the service from abuse, brute force and overload. Exceeding the limit returns HTTP 429 Too Many Requests.

**Fixed window vs sliding window?**
A fixed window counts requests per calendar interval and resets at the boundary, so a client can send up to twice the limit around a reset. A sliding window counts requests in the last N seconds at any moment, which avoids that burst.

**How does a token bucket work?**
A bucket holds up to N tokens and refills at a steady rate. Each request uses one token; with no tokens left, requests are rejected. It allows short bursts up to the bucket size while limiting the average rate.

**Why is req.ip wrong behind a reverse proxy?**
Express sees the proxy's address. Set `trust proxy` to the number of trusted proxies so Express reads the client IP from `X-Forwarded-For`.

**Why use Redis for rate limiting?**
With several processes or servers, in-memory counters are separate, so each instance allows the full limit. Redis gives all instances one shared, atomic counter.

**Which status code and headers should a rate limiter return?**
429 Too Many Requests with a `Retry-After` header, plus `RateLimit` / `RateLimit-Policy` headers so clients can see their remaining budget.

## Summary

Tested with Node.js 22 and express-rate-limit 7.5:

- A **fixed window allowed 200 requests** in 0.3 s against a limit of 100; sliding windows and token buckets allowed about 100.
- A **token bucket allowed bursts** (599 vs 500 over 5 minutes) by design.
- **Without `trust proxy`**, one user's requests blocked a different user.
- **Four cluster workers** with in-memory counters allowed **4× the limit**.

Pick a sliding window or token bucket, identify clients correctly behind your proxy, and share counters across processes.

If you are hiring for [Node.js](/expertise/nodejs) or full stack roles, [get in touch](/#contact).
