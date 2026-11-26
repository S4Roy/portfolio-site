---
title: Node.js Memory Leaks: How to Find and Fix Them (with Heap Snapshots)
description: Find and fix memory leaks in Node.js, with measured examples: unbounded caches, event listeners, timers, closures and Map vs WeakMap, plus a heap snapshot diff workflow.
date: 2026-11-26
tags: Node.js, Performance, Debugging
keyword: node js memory leak
draft: false
---

A memory leak in Node.js rarely crashes anything on day one. Memory climbs slowly. After a few days the process is restarted by PM2 for exceeding `max_memory_restart`, or it dies with `JavaScript heap out of memory`, usually during peak traffic. Restarts hide the problem, so it can survive for months.

This guide shows the leaks I see most often in Node.js services, how much memory each one actually holds, and a repeatable way to find a leak with heap snapshots. Everything was measured on **Node.js 22**, running with `--expose-gc` and forcing garbage collection before each reading, so the numbers show memory that is truly retained, not garbage waiting to be collected.

## What a leak is in a garbage-collected language

JavaScript frees memory automatically, but only for objects nothing references anymore. A leak is memory that is still **reachable** but no longer **needed**: an entry in a global map, a listener on a long-lived emitter, a timer that was never cleared. The garbage collector can't free it, because as far as it can tell, your code might still use it.

So every leak comes down to one question: **what long-lived object is holding a reference to short-lived data?**

## 1. Unbounded caches

The most common leak is a cache with no limit:

```js
const cache = new Map();

app.get('/report/:id', async (req, res) => {
  if (!cache.has(req.params.id)) cache.set(req.params.id, await buildReport(req.params.id));
  res.json(cache.get(req.params.id));
});
```

Every distinct key adds an entry, forever. I stored a small 1 KB object per request:

```text
unbounded Map     25k: 35.7 MB | 50k: 68.0 MB | 75k: 101.2 MB | 100k: 132.7 MB
LRU (max 1,000)   25k:  4.7 MB | 50k:  4.7 MB | 75k:   4.7 MB | 100k:   4.7 MB
```

Memory grew in a straight line, about 1.3 MB per 1,000 requests. With a size limit, it stayed flat. A minimal LRU only needs a `Map`, because a `Map` keeps insertion order:

```js
const MAX = 1000;
const cache = new Map();

function cacheSet(key, value) {
  cache.delete(key); // move to the end (most recently used)
  cache.set(key, value);
  if (cache.size > MAX) cache.delete(cache.keys().next().value); // evict the oldest
}
```

In production, use a library such as `lru-cache` (size limits and TTLs), or move the cache to Redis so it is shared across [cluster workers](/blog/nodejs-worker-threads-vs-cluster) and survives restarts. **Every cache needs a maximum size or an expiry.** This includes memoization helpers, per-user maps and "temporary" arrays that collect data for later.

## 2. Event listeners added per request

```js
app.use((req, res, next) => {
  config.on('changed', () => applyConfig(req.user)); // a new listener on every request
  next();
});
```

The emitter lives forever, and every listener holds its closure, including `req.user`. After 20,000 requests:

```text
listeners: 20000 | heap 3.4 -> 30.0 MB
MaxListenersExceededWarning: Possible EventEmitter memory leak detected.
11 config-changed listeners added to [EventEmitter]. MaxListeners is 10.
```

Node warned at the 11th listener. That warning is a real leak detector, and the worst response is to silence it with `setMaxListeners(0)` without understanding why it fired.

The fix is to remove the listener when the request ends:

```js
app.use((req, res, next) => {
  const onChange = () => applyConfig(req.user);
  config.on('changed', onChange);
  res.on('close', () => config.off('changed', onChange));
  next();
});
```

Or don't subscribe per request at all: read the current config when you need it. The same applies to `process.on(...)`, database client events, socket events and anything else that outlives the request.

## 3. Timers that are never cleared

```js
io.on('connection', (socket) => {
  const ctx = loadContext(socket);
  setInterval(() => sendHeartbeat(socket, ctx), 30_000); // never cleared
});
```

An active `setInterval` keeps its callback, and everything that callback references, alive. With 5,000 connections:

```text
5,000 intervals: heap 3.5 -> 10.9 MB | after clearInterval: 4.4 MB
```

Keep the handle and clear it when the owner goes away:

```js
io.on('connection', (socket) => {
  const timer = setInterval(() => sendHeartbeat(socket), 30_000);
  socket.on('disconnect', () => clearInterval(timer));
});
```

Also watch for retry loops with `setTimeout` that keep rescheduling after the work is no longer needed, and pending promises that never settle (for example, a `fetch` without a timeout), which keep their callbacks alive too.

## 4. Closures that capture more than they need

A closure keeps every variable it references alive for as long as the closure exists:

```js
const handlers = [];
for (const file of files) {
  const rows = parseHugeCsv(file);      // large array
  handlers.push(() => rows.length);     // keeps the whole array alive
}
```

```text
closure captures the array:       3.5 -> 79.9 MB
closure captures only the length: 3.5 ->  4.0 MB
```

Same logic: 76 MB retained versus half a megabyte. Copy the small value you need into its own variable and reference that:

```js
const count = rows.length;
handlers.push(() => count);
```

This matters for callbacks that live a long time: event listeners, cached functions, and handlers stored in arrays or maps.

## 5. Map vs WeakMap for per-object data

Attaching metadata to objects you don't own (requests, sockets, DOM-like objects) with a `Map` keeps those objects alive:

```js
const meta = new Map();
meta.set(req, { start: Date.now() }); // req can never be garbage collected
```

50,000 short-lived objects, each with metadata:

```text
Map      heap 3.2 -> 37.7 MB
WeakMap  heap 3.2 ->  3.4 MB
```

A `WeakMap` holds its keys weakly. When nothing else references the key object, both the key and its value are collected. Use `WeakMap` (or `WeakSet`) whenever the key is an object and the data should live exactly as long as that object. The trade-off: you can't iterate a `WeakMap` or check its size, and keys must be objects.

## Finding a leak: the heap snapshot workflow

Knowing the patterns helps, but in a real codebase you need evidence. Here is the workflow I used on a small HTTP server that leaked a listener per request.

### Step 1: confirm the trend

Measure memory under steady load. One spike means nothing. A line that keeps rising after garbage collection is a leak:

```text
leaky server   1k: 9.9 MB | 6k: 13.9 MB | 11k: 17.2 MB | 16k: 19.3 MB | 21k: 22.2 MB
fixed server   1k: 9.3 MB | 6k: 10.4 MB | 11k: 10.7 MB | 16k: 10.0 MB | 21k:  9.8 MB
```

In production, track `heapUsed` and RSS over time (PM2's `pm2 monit`, your APM, or a metrics endpoint that reports `process.memoryUsage()`). A sawtooth pattern is normal. Peaks that keep getting higher are not.

### Step 2: take two snapshots, with load in between

```js
const v8 = require('node:v8');
v8.writeHeapSnapshot(); // writes a .heapsnapshot file in the working directory
```

Or start Node with `--heapsnapshot-signal=SIGUSR2` and run `kill -USR2 <pid>` on a running process. You can also attach Chrome DevTools with `node --inspect` and use the **Memory** tab. Take one snapshot after warm-up, send traffic, then take another.

Heap snapshots are big (the two here were **12.6 MB and 38.3 MB**). Writing one pauses the process and can temporarily need about as much memory again as the heap itself, so take them on a staging copy, or on a single instance taken out of the load balancer.

### Step 3: compare

Load both files in Chrome DevTools (Memory tab → Load), select the second, and switch to the **Comparison** view. Sort by size delta. My diff, after 20,000 more requests to the leaky server:

```text
(concatenated string)  +239,995 objects  +7.3 MB
onConfigChanged        + 20,000 objects  +1.2 MB
system / Context       + 19,951 objects  +0.8 MB
Object                 + 19,902 objects  +0.8 MB
```

The second line gives it away: exactly **20,000 new `onConfigChanged` closures** for 20,000 requests. Something creates one per request and never releases it. The strings and contexts above and below are the data those closures hold.

### Step 4: follow the retainers

Click the suspicious object and read the **Retainers** panel. It shows the chain of references keeping it alive. Here, it ended at the `EventEmitter`'s listener array. That chain is your bug: the long-lived object at the top is what needs fixing.

**Name your functions.** In an earlier run, the listener was an anonymous arrow function, and the snapshot listed it with an empty name. Named functions make heap snapshots far easier to read.

## Leak or just high memory?

Not every memory problem is a leak:

- **The heap is too small for the work.** Loading a 500 MB file into memory isn't a leak. Stream it instead. You can raise the limit with `--max-old-space-size`, but that only delays a real leak.
- **Large queries.** Loading 100,000 documents to send 20 is a query problem. See [MongoDB Query Optimization](/blog/mongodb-query-optimization).
- **Buffers and native memory** appear in RSS and `external`, not `heapUsed`. If RSS grows while the heap stays flat, look at buffers, native addons and streams that are never consumed.
- **Lazy garbage collection.** V8 doesn't collect immediately. Memory that drops after load stops is fine.

## Prevention checklist

| Pattern | Rule |
| --- | --- |
| Caches, memoization, per-user maps | Always a maximum size or TTL (`lru-cache`, Redis) |
| Event listeners | Remove with `off()` when the owner ends; never silence `MaxListenersExceededWarning` blindly |
| `setInterval` / retry loops | Keep the handle; clear it on disconnect or shutdown |
| Long-lived closures | Capture small values, not large objects |
| Metadata keyed by objects | `WeakMap` / `WeakSet` |
| Outgoing requests | Always set timeouts (`AbortSignal.timeout(5000)`) |
| Large data | Stream it, paginate it, or process it in [worker threads](/blog/nodejs-worker-threads-vs-cluster) |
| Production | Monitor `heapUsed` over time; set PM2 `max_memory_restart` as a safety net, not a fix |

## Interview questions: quick answers

**What causes memory leaks in Node.js?**
References from long-lived objects to data that is no longer needed: unbounded caches, event listeners that are never removed, timers that are never cleared, closures that capture large objects, and global variables.

**How do you detect a memory leak in Node.js?**
Watch `heapUsed` under steady load. If it keeps rising after garbage collection, take two heap snapshots with load in between, compare them in Chrome DevTools, and follow the retainers of the objects that grew.

**What does MaxListenersExceededWarning mean?**
More than 10 listeners (the default) were added for one event on one emitter. It often means listeners are being added repeatedly, for example per request, without being removed.

**What is the difference between Map and WeakMap?**
A `Map` holds strong references to its keys, so they can't be collected. A `WeakMap` holds object keys weakly: when nothing else references the key, the entry is collected. `WeakMap` can't be iterated.

**What is the difference between heapUsed and RSS?**
`heapUsed` is memory used by JavaScript objects in the V8 heap. RSS (resident set size) is the total memory the process holds, including the heap, buffers, native code and the stack.

**Does increasing --max-old-space-size fix a leak?**
No. It gives the process more room before it crashes. A leak keeps growing until it hits any limit.

## Summary

Measured on Node.js 22:

- An **unbounded cache** grew to **132.7 MB** after 100,000 requests; a 1,000-entry LRU stayed at **4.7 MB**.
- **20,000 per-request listeners** added 26.6 MB and triggered `MaxListenersExceededWarning`.
- A **closure** capturing an array held **79.9 MB**; capturing only its length, **4.0 MB**.
- **WeakMap** kept memory at 3.4 MB where a `Map` grew to 37.7 MB.
- A **heap snapshot diff** pointed straight at the bug: 20,000 new `onConfigChanged` closures for 20,000 requests.

Find the long-lived object holding short-lived data, and give that data a way to be released.

If you are hiring for [Node.js](/expertise/nodejs) or full stack roles, [get in touch](/#contact).
