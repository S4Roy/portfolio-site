---
title: Node.js Worker Threads vs Cluster: When to Use Which (with Benchmarks)
description: Worker threads vs the cluster module in Node.js, with measured benchmarks: CPU offloading, scaling HTTP across cores, memory cost, shared memory and worker pools.
date: 2026-11-26
tags: Node.js, Performance, Interview
keyword: node js worker threads vs cluster
draft: false
---

Node.js runs your JavaScript on a single main thread. That is fine for I/O-heavy APIs, but it leaves two problems you eventually hit in production:

1. **One slow CPU task blocks every request**, because nothing else can run on the main thread while it computes.
2. **One process only uses one CPU core**, so an 8-core server sits mostly idle.

Node gives you two tools for these problems, and they are often confused: **worker threads** and the **cluster module**. They solve different problems. This article shows the difference with small programs and real measurements, all run on **Node.js 22** on an 8-core machine.

> New to the event loop? Read [Node.js Event Loop Explained](/blog/nodejs-event-loop-explained) first. The blocking problem below follows directly from it.

## The short answer

| | Worker threads | Cluster |
| --- | --- | --- |
| What it creates | Threads **inside one process** | Separate **processes** |
| Main purpose | Offload **CPU-heavy work** | Scale an **HTTP server across cores** |
| Memory | Separate V8 heap per thread, can **share memory** | Fully separate memory |
| Communication | `postMessage`, `SharedArrayBuffer` | IPC messages (`process.send`) |
| Crash isolation | A crash can affect the whole process | One worker crash does not take down others |
| Typical use | Image processing, PDF generation, hashing, parsing large files | Running N copies of your API behind one port |

**Rule of thumb:** use **cluster** (or PM2 cluster mode) to use all your cores for requests. Use **worker threads** to keep the main thread free while doing heavy computation. Many production apps use both.

## The problem: CPU work blocks everything

Here is a server with a CPU-heavy endpoint and a health check:

```js
const http = require("node:http");
const fib = (n) => (n < 2 ? n : fib(n - 1) + fib(n - 2));

http
  .createServer((req, res) => {
    if (req.url === "/fib") return res.end(String(fib(40)));
    res.end("ok");
  })
  .listen(4100);
```

I started a `/fib` request, waited 50 ms, then called `/health`:

```text
/health took 911 ms while /fib took 972 ms
```

A health check that should take a couple of milliseconds waited almost a second, because the main thread was busy computing. In a real API, every user request arriving during that time waits too. A load balancer might even mark the instance unhealthy.

## Worker threads: move CPU work off the main thread

A worker thread runs JavaScript in parallel, with its own event loop and V8 heap, inside the same process. Move the computation into a worker:

```js
// fib-worker.js
const { parentPort, workerData } = require("node:worker_threads");
const fib = (n) => (n < 2 ? n : fib(n - 1) + fib(n - 2));
parentPort.postMessage(fib(workerData));
```

```js
// server.js
const http = require("node:http");
const { Worker } = require("node:worker_threads");

function runFib(n) {
  return new Promise((resolve, reject) => {
    const worker = new Worker(__dirname + "/fib-worker.js", { workerData: n });
    worker.once("message", resolve);
    worker.once("error", reject);
  });
}

http
  .createServer(async (req, res) => {
    if (req.url === "/fib") return res.end(String(await runFib(40)));
    res.end("ok");
  })
  .listen(4101);
```

Same test:

```text
/health took 4 ms while /fib took 1103 ms
```

The `/fib` request still takes about a second, because the computation is the same. But the **main thread stays free**, so the health check, and every other request, answers immediately.

### Do not create a worker per task

Starting a worker costs time and memory. I measured about **15 ms and 9 MB** per worker thread. For long jobs that is negligible, but for many small tasks it dominates:

```text
new worker per task: 200 tasks in 2978 ms
reused worker:       200 tasks in 31 ms
```

Creating a new worker for each of 200 small tasks was nearly **100× slower** than reusing one. In production, use a **worker pool**: create a fixed number of workers once, and send them tasks. A minimal version:

```js
const { Worker } = require("node:worker_threads");
const os = require("node:os");

class WorkerPool {
  constructor(file, size = os.availableParallelism() - 1) {
    this.queue = [];
    this.idle = [];
    for (let i = 0; i < size; i++) this.idle.push(new Worker(file));
  }

  run(data) {
    return new Promise((resolve, reject) => {
      this.queue.push({ data, resolve, reject });
      this.#next();
    });
  }

  #next() {
    if (!this.queue.length || !this.idle.length) return;
    const worker = this.idle.pop();
    const { data, resolve, reject } = this.queue.shift();
    const done = (fn, value) => {
      worker.off("message", onMessage);
      worker.off("error", onError);
      this.idle.push(worker);
      fn(value);
      this.#next();
    };
    const onMessage = (v) => done(resolve, v);
    const onError = (e) => done(reject, e);
    worker.once("message", onMessage);
    worker.once("error", onError);
    worker.postMessage(data);
  }
}
```

The worker file listens for repeated messages instead of exiting:

```js
const { parentPort } = require("node:worker_threads");
parentPort.on("message", (n) => parentPort.postMessage(fib(n)));
```

A production pool also needs to replace a worker that crashes and to apply timeouts. Libraries such as **Piscina** handle this for you. The important design decision is the same either way: **create workers once, reuse them**.

### Sharing memory between threads

Messages between threads are copied (structured clone), which is costly for large data. Worker threads can avoid copying in two ways:

- **Transfer** an `ArrayBuffer`: ownership moves to the other thread with no copy.
- **Share** a `SharedArrayBuffer`: all threads see the same memory.

Shared memory brings back the classic threading problem: race conditions. Four threads each incrementing a shared counter one million times, with a plain `c[0]++`:

```text
counter = 1069520
counter = 1043455
counter = 1047493
```

The correct answer is 4,000,000. Increments were lost because `c[0]++` is a read, an add and a write, and threads interleave between them. With `Atomics`:

```js
const c = new Int32Array(sharedBuffer);
for (let i = 0; i < 1e6; i++) Atomics.add(c, 0, 1);
```

```text
counter = 4000000
```

If you share memory between threads, use `Atomics` for every concurrent update.

## Cluster: use every CPU core for requests

The `cluster` module forks several **processes** running the same server. The primary process accepts connections on one port and distributes them to workers (round-robin by default on every platform except Windows).

```js
const cluster = require("node:cluster");
const http = require("node:http");
const os = require("node:os");

if (cluster.isPrimary) {
  for (let i = 0; i < os.availableParallelism(); i++) cluster.fork();

  cluster.on("exit", (worker, code) => {
    console.log(`worker ${worker.process.pid} exited (code ${code}), forking a replacement`);
    cluster.fork();
  });
} else {
  http.createServer((req, res) => res.end(`handled by ${process.pid}`)).listen(3000);
}
```

I sent 64 CPU-heavy requests (8 at a time) to the same server with different numbers of workers:

| Workers | Time | Throughput |
| --- | --- | --- |
| 1 | 5.53 s | 11.6 req/s |
| 4 | 1.52 s | 42.0 req/s |
| 8 | 1.11 s | 57.6 req/s |

Four processes gave about **3.6×** the throughput of one. Eight gave about 5×, not 8×, because the load generator, the operating system and other processes share the same cores. Scaling is real but rarely perfectly linear.

### Crash isolation

Because workers are separate processes, one crash does not take down the others. In the test above, I made one of two workers exit. The primary logged the exit and forked a replacement, and requests kept being served:

```text
worker 16604 exited (code 1), forking a replacement
16603
16607
16603
16607
```

Process `16603` kept serving while `16607` replaced the crashed worker. With worker threads, an uncaught error in a worker emits an `error` event you must handle, but a fatal crash such as running out of memory takes down the whole process.

### The cost of processes

Each cluster worker is a complete Node.js process. I measured about **39 MB of memory and 27 ms to start** for each child process, compared with about **9 MB and 15 ms** for a worker thread. On a small 1–2 GB server, eight processes of a real application (often 100–300 MB each) add up quickly.

### Cluster gotchas

- **No shared in-memory state.** Each process has its own memory, so in-memory caches, rate limiters and sessions are per process. A user can hit a different worker on the next request. Move shared state to the database or an external store.
- **WebSockets and long-polling need sticky sessions,** so a client keeps reaching the same worker.
- **Scheduled jobs run once per worker.** A cron task started in every worker runs N times. Run it only in the primary process or in a separate service.

## PM2 cluster mode

In practice, you rarely write cluster code by hand. **PM2** runs your unmodified app in cluster mode and adds restarts, zero-downtime reloads and log management:

```js
// ecosystem.config.js
module.exports = {
  apps: [
    {
      name: "api",
      script: "dist/server.js",
      exec_mode: "cluster",
      instances: "max", // one per CPU core, or a number
      max_memory_restart: "300M",
    },
  ],
};
```

```bash
pm2 start ecosystem.config.js
pm2 reload api   # restart workers one by one, no downtime
```

On a shared or small server, set `instances` to a specific number instead of `"max"` so the app leaves capacity for the database and other services. For the full server setup, see [deploying Node.js on AWS EC2 with PM2, Apache and SSL](/blog/deploy-nodejs-aws-ec2-pm2-apache-ssl).

## Which one should you use?

| Situation | Use |
| --- | --- |
| API is I/O-bound (database, HTTP calls) and you want more throughput | **Cluster / PM2 cluster mode** |
| One endpoint does heavy computation (PDF, image, report, hashing) | **Worker threads** (with a pool) |
| Both: high traffic *and* CPU-heavy endpoints | **Cluster for scale + worker pool in each process** |
| Long background jobs (exports, emails, batch imports) | A **job queue** with separate worker processes |
| Async I/O is slow (slow queries, slow APIs) | **Neither.** Fix the query, add indexes, cache or paginate |

The last row matters most. Worker threads do not make database queries or HTTP calls faster. Those are already asynchronous and do not block the event loop. Adding threads only helps when the main thread is **busy computing**.

## Interview questions: quick answers

**What is the difference between worker threads and cluster?**
Worker threads are threads inside one process, with separate V8 heaps that can share memory, used to run CPU-heavy JavaScript in parallel. Cluster forks separate processes that share a server port, used to scale request handling across CPU cores.

**Does cluster make a CPU-heavy request faster?**
No. Each request still runs on one core. Cluster increases how many requests run *at the same time*. To speed up or isolate a single heavy computation, use worker threads.

**Do worker threads help with slow database queries?**
No. Database calls are asynchronous and already off the main thread. Worker threads help only with CPU-bound JavaScript.

**How do worker threads communicate?**
With `postMessage` (data is copied using structured clone), by transferring `ArrayBuffer` ownership, or through a `SharedArrayBuffer` coordinated with `Atomics`.

**How is the worker thread pool different from the libuv thread pool?**
The libuv thread pool (4 threads by default) runs Node's internal operations such as file system, DNS lookup, crypto and zlib. Worker threads run *your* JavaScript, and you create and manage them yourself.

**What happens to in-memory sessions in cluster mode?**
Each worker has its own memory, so sessions stored in memory are not shared. Requests from the same user can hit different workers. Store sessions externally, or use sticky sessions.

**How many cluster workers should you run?**
Usually one per CPU core (`os.availableParallelism()`), fewer if the same server also runs a database or other services.

## Summary

- **Cluster** = more **processes** → more requests in parallel, crash isolation, higher memory use.
- **Worker threads** = more **threads** in one process → heavy computation without blocking the event loop.
- Measured: a blocked health check went from **911 ms to 4 ms** with a worker thread, and throughput rose from **11.6 to 42 req/s** with four cluster workers.
- **Reuse workers.** A pool was nearly 100× faster than a new worker per task.
- **Share memory carefully.** Use `Atomics`, or lose updates to race conditions.
- Neither helps with slow I/O. Fix the query first.

If you are hiring for [Node.js](/expertise/nodejs) or full stack roles, [get in touch](/#contact).
