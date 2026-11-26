---
title: Node.js Event Loop Explained with Real Examples and Output Questions
description: How the Node.js event loop really works: phases, process.nextTick vs promises, setTimeout vs setImmediate, the libuv thread pool and tricky output questions.
date: 2026-11-26
tags: Node.js, JavaScript, Interview
keyword: node js event loop explained
draft: false
---

"Node.js is single-threaded, so how does it handle thousands of requests?" is one of the most common Node.js interview questions, and one of the most misunderstood. The answer is the **event loop**, together with **libuv** and the operating system doing the waiting on your behalf.

This guide explains the event loop the way it actually behaves, with small programs you can run yourself. Every output shown here was verified on **Node.js 22**. Where the order is *not* guaranteed, the article says so, because that detail is exactly what interviewers check.

## The short version

Your JavaScript runs on **one main thread**. When it starts slow work (reading a file, querying a database, calling an API), Node hands that work off and keeps running other code. When the work finishes, its callback is placed in a queue. The event loop's job is to pick callbacks from those queues, in a specific order, whenever the main thread is free.

Two consequences follow, and they explain almost every event-loop bug:

1. Callbacks only run **when the call stack is empty**. A long synchronous loop delays everything.
2. Different kinds of callbacks have **different priorities**, which is why the output order can look surprising.

## The phases of the event loop

Each turn of the loop (a "tick") moves through phases. Each phase has its own queue of callbacks:

| Phase | What runs there |
| --- | --- |
| **timers** | Callbacks from `setTimeout` and `setInterval` whose time has elapsed |
| **pending callbacks** | Some system-level callbacks deferred from the previous turn (for example certain TCP errors) |
| **idle, prepare** | Internal use only |
| **poll** | Retrieves new I/O events and runs I/O callbacks (file, network); may wait here for I/O |
| **check** | Callbacks from `setImmediate` |
| **close callbacks** | `close` events, such as `socket.on("close")` |

Two more queues sit **outside** these phases and have higher priority than all of them:

- the **`process.nextTick` queue**
- the **microtask queue** (resolved promises, `await` continuations, `queueMicrotask`)

Node drains both of these **after the main script finishes and after every individual callback**, before moving on. The `nextTick` queue is drained first, then microtasks.

> Since Node.js 11, microtasks run between *each* timer or immediate callback, not only between phases. This matches browser behaviour, and older articles that say otherwise are out of date.

## Example 1: the classic ordering question

```js
console.log("A");
setTimeout(() => console.log("B: setTimeout"), 0);
setImmediate(() => console.log("C: setImmediate"));
Promise.resolve().then(() => console.log("D: promise"));
process.nextTick(() => console.log("E: nextTick"));
console.log("F");
```

Output:

```text
A
F
E: nextTick
D: promise
B: setTimeout      <- these two lines
C: setImmediate    <- can appear in either order
```

Why:

1. `A` and `F` are synchronous, so they print first.
2. The script has finished, so Node drains the **nextTick** queue (`E`), then the **microtask** queue (`D`).
3. Then the loop starts. Whether the timer or the immediate runs first is **not deterministic** in the main module. A `0` ms timeout is really at least `1` ms, and whether that millisecond has passed when the loop checks the timers phase depends on how fast the process started. In 40 runs on my machine, `setImmediate` won 28 times and `setTimeout` 12 times.

If an interviewer says "B always comes before C", the correct answer is: *not in the main module*.

## Example 2: when setImmediate always wins

Move the same two calls inside an I/O callback:

```js
const fs = require("node:fs");

fs.readFile(__filename, () => {
  setTimeout(() => console.log("timeout"), 0);
  setImmediate(() => console.log("immediate"));
});
```

Output, every time:

```text
immediate
timeout
```

The `readFile` callback runs in the **poll** phase. The next phase is **check**, where `setImmediate` callbacks run. Timers only come around on the *next* turn of the loop. That makes the order deterministic: 20 out of 20 runs printed `immediate` first.

**Practical rule:** use `setImmediate` when you want to run something right after the current I/O work completes. Use `setTimeout` when you need an actual delay.

## Example 3: microtasks run between timers

```js
setTimeout(() => {
  console.log("t1");
  Promise.resolve().then(() => console.log("p1"));
  process.nextTick(() => console.log("n1"));
}, 0);
setTimeout(() => console.log("t2"), 0);
```

Output:

```text
t1
n1
p1
t2
```

Both timers are ready in the same timers phase, but after `t1` finishes, Node drains `nextTick` (`n1`) and then microtasks (`p1`) **before** running `t2`. On Node.js 10 and older, the output was `t1 t2 n1 p1`. This is a good detail to mention in interviews because it shows you know the modern behaviour.

## Example 4: async/await is just promises

```js
async function task() {
  console.log("1");
  await null;
  console.log("2");
}

console.log("start");
task();
Promise.resolve().then(() => console.log("3"));
console.log("end");
```

Output:

```text
start
1
end
2
3
```

The body of an `async` function runs **synchronously until the first `await`**. That is why `1` prints before `end`. Everything after `await` becomes a microtask. It was queued before the `.then()` callback, so `2` prints before `3`.

## Example 5: nextTick inside a promise

```js
Promise.resolve().then(() => {
  console.log("p1");
  process.nextTick(() => console.log("tick"));
});
Promise.resolve().then(() => console.log("p2"));
```

Output:

```text
p1
p2
tick
```

`nextTick` normally beats promises, but here we are already **draining the microtask queue**. Node finishes that queue (`p2`) and then checks the `nextTick` queue again. "nextTick always runs before promises" is only true when both are queued from the same synchronous code.

## Example 6: the full interview question

```js
console.log("script start");

setTimeout(() => console.log("setTimeout"), 0);
setImmediate(() => console.log("setImmediate"));

new Promise((resolve) => {
  console.log("promise executor");
  resolve();
})
  .then(() => console.log("then 1"))
  .then(() => console.log("then 2"));

queueMicrotask(() => console.log("queueMicrotask"));
process.nextTick(() => console.log("nextTick"));

console.log("script end");
```

Output:

```text
script start
promise executor
script end
nextTick
then 1
queueMicrotask
then 2
setImmediate      <- order of these two
setTimeout        <- is not guaranteed
```

Key points:

- The **promise executor runs synchronously**. Only `.then` callbacks are asynchronous.
- `then 2` is only queued once `then 1` has finished, so `queueMicrotask` (queued earlier) runs between them.
- As in Example 1, `setImmediate` and `setTimeout` can swap in the main module.

## Blocking the event loop

Because callbacks only run when the stack is empty, **synchronous CPU work delays everything**, including timers and incoming HTTP requests:

```js
const start = Date.now();
setTimeout(() => console.log(`timer fired after ${Date.now() - start} ms`), 10);
while (Date.now() - start < 200) {} // ~200 ms of synchronous work
```

Output:

```text
timer fired after 200 ms
```

The timer asked for 10 ms and got 200. In a web server, the same thing happens to every request that arrives during that loop. Common causes in real APIs:

- `JSON.parse` / `JSON.stringify` on very large payloads
- Synchronous APIs such as `fs.readFileSync` or `crypto.pbkdf2Sync` inside request handlers
- Heavy loops over large arrays (sorting, transforming, building reports in memory)
- Inefficient regular expressions on user input

Fixes, in order of preference:

1. **Do less on the main thread.** Paginate, stream, and let the database filter and aggregate.
2. **Use the async version** of the API (`fs.promises`, `crypto.pbkdf2`).
3. **Split long work into chunks** with `setImmediate`, so other callbacks can run between chunks.
4. **Move CPU-heavy work to `worker_threads`** or a separate job queue.

## Starving the loop with process.nextTick

`nextTick` callbacks run before the loop is allowed to continue. If they keep scheduling more `nextTick` callbacks, nothing else runs:

```js
let n = 0;
function spin() {
  if (++n < 1e5) process.nextTick(spin);
}
setTimeout(() => console.log("timer ran after", n, "ticks"), 0);
spin();
```

Output:

```text
timer ran after 100000 ticks
```

The timer had to wait for all 100,000 recursive ticks. With an unbounded recursion, it would never run. Recursive `setImmediate` does **not** have this problem, because immediates scheduled during the check phase run on the next turn of the loop.

## The libuv thread pool

"Single-threaded" describes your JavaScript, not Node as a whole. Some operations cannot be done asynchronously by the operating system, so libuv runs them on a **thread pool** with **4 threads by default**:

- most `fs` operations
- `dns.lookup`
- CPU-heavy `crypto` functions such as `pbkdf2`, `scrypt` and `randomBytes`
- `zlib` compression

Network I/O (HTTP, TCP, database sockets) does **not** use the pool. It uses the operating system's own async mechanisms (epoll, kqueue, IOCP).

You can see the pool size directly:

```js
const crypto = require("node:crypto");
const start = Date.now();

for (let i = 1; i <= 6; i++) {
  crypto.pbkdf2("secret", "salt", 200000, 64, "sha512", () =>
    console.log(`hash ${i}: ${Date.now() - start} ms`),
  );
}
```

Output on an 8-core machine:

```text
hash 3: 53 ms
hash 4: 54 ms
hash 1: 54 ms
hash 2: 54 ms
hash 5: 101 ms
hash 6: 101 ms
```

Four hashes finish together, then the remaining two take another round. The first four can complete in any order. If your app does a lot of file or crypto work at once, the pool can become a bottleneck. You can raise it with the `UV_THREADPOOL_SIZE` environment variable, which must be set before the pool is first used, typically when the process starts:

```bash
UV_THREADPOOL_SIZE=8 node server.js
```

## Interview questions: quick answers

**Is Node.js single-threaded?**
Your JavaScript runs on one main thread. Node itself uses additional threads: the libuv thread pool for file system, DNS lookup, crypto and zlib work, plus V8's internal threads. You can create more with `worker_threads`.

**What is the difference between `process.nextTick` and `setImmediate`?**
`nextTick` runs immediately after the current operation, before the event loop continues and before promise callbacks. `setImmediate` runs in the check phase of the next loop iteration. The names are famously backwards.

**`setTimeout(fn, 0)` or `setImmediate(fn)`: which runs first?**
In the main module, either. Inside an I/O callback, `setImmediate` always runs first.

**Do promises run before `setTimeout(fn, 0)`?**
Yes. Promise callbacks are microtasks and run as soon as the current callback finishes, before any timer.

**What happens if you call `process.nextTick` recursively?**
It starves the event loop. Timers, I/O and immediates never get a chance to run.

**How do you find out if the event loop is blocked?**
Measure event loop delay with `perf_hooks.monitorEventLoopDelay()`, profile with `node --cpu-prof` or Chrome DevTools, and look for synchronous APIs and large loops in hot paths.

**How do you run CPU-heavy code without blocking?**
Use `worker_threads` for parallel CPU work, a job queue for long background tasks, or split work into chunks scheduled with `setImmediate`.

## Summary

- One main thread runs your JavaScript. libuv and the operating system handle the waiting.
- Loop phases: **timers → pending → poll → check → close**.
- After the main script and **after every callback**: drain **`nextTick`**, then **microtasks**.
- `setTimeout(0)` vs `setImmediate` is **unpredictable** in the main module and **`setImmediate` first** inside I/O callbacks.
- Blocking code delays everything. Keep heavy work off the main thread.
- The **thread pool has 4 threads by default** and handles fs, DNS lookup, crypto and zlib, but not network sockets.

Understanding these rules is what makes the difference between guessing at concurrency bugs and reasoning about them. For a practical application of the same ideas, see [how to prevent duplicate payments in Node.js](/blog/prevent-duplicate-payments-nodejs). If you are hiring for [Node.js](/expertise/nodejs) or full stack roles, [get in touch](/#contact).
