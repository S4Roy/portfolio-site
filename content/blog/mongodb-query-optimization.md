---
title: MongoDB Query Optimization: A Practical Guide with explain() Benchmarks
description: Speed up MongoDB queries with the right compound indexes, the ESR rule, covered queries, range pagination and smarter aggregations, measured on 500,000 documents.
date: 2026-11-26
tags: MongoDB, Performance, Node.js
keyword: mongodb query optimization
draft: false
---

Most slow MongoDB queries are not slow because MongoDB is slow. They are slow because the database reads far more data than the query needs. The good news: once you know how to read `explain()`, the fix is usually one well-designed index or a small change to how the query is written.

This guide walks through the optimizations that matter most in real applications, using an `orders` collection with **500,000 documents (184 MB)** on **MongoDB 8.0**. Every number below comes from `explain("executionStats")` on that dataset, so you can see exactly what each change does.

## The one metric to watch

Run any query with `explain`:

```js
db.orders.find({ customerId: 4242, status: "paid" })
  .sort({ createdAt: -1 })
  .limit(20)
  .explain("executionStats");
```

From the output, compare three numbers:

| Field | Meaning |
| --- | --- |
| `nReturned` | Documents the query actually returned |
| `totalKeysExamined` | Index entries scanned |
| `totalDocsExamined` | Documents read from disk or cache |

**The goal is for keys and docs examined to be close to `nReturned`.** If a query returns 20 documents but examines 500,000, it is doing 25,000× more work than necessary, and that gap gets worse as the collection grows.

Also look at the stages in the winning plan:

- `COLLSCAN`: reads every document. Almost always a problem on large collections.
- `IXSCAN`: uses an index. Good, but check how many keys it examined.
- `SORT`: sorts in memory. Expensive on large result sets, and spills to disk (even slower) once it exceeds the 100 MB memory limit.
- `FETCH`: reads full documents after an index scan.

## 1. Start with the right index

With no index, the query above reads the entire collection:

```text
no index                     103 ms | keys 0      | docs 500,000 | returned 7 | SORT <- COLLSCAN
index { customerId: 1 }        0 ms | keys 25     | docs 25      | returned 7 | SORT <- FETCH <- IXSCAN
```

A single-field index on `customerId` drops the work from 500,000 documents to 25. That is the biggest single improvement you will usually see. But the plan still has a `SORT` stage, and it reads 25 documents to return 7. A **compound index** can do better.

## 2. Order compound index fields with the ESR rule

The order of fields in a compound index matters a lot. The **ESR rule** is the standard guideline:

1. **E**quality fields first (`status: "paid"`, `city: "Kolkata"`)
2. **S**ort fields next (`createdAt: -1`)
3. **R**ange fields last (`total: { $gte, $lte }`)

Query: paid orders from Kolkata, newest 20 (14,285 documents match):

```js
db.orders.find({ status: "paid", city: "Kolkata" }).sort({ createdAt: -1 }).limit(20);
```

```text
{ status, createdAt }          keys 162 | docs 162 | returned 20
{ status, createdAt, city }    keys 162 | docs  20 | returned 20
{ status, city, createdAt }    keys  20 | docs  20 | returned 20   <- ESR
```

With both equality fields before the sort field, MongoDB jumps straight to "paid, Kolkata" in the index, where entries are already ordered by `createdAt`. It reads exactly 20 keys and stops.

Ranges are where the rule surprises people. Paid orders with a total between 1,000 and 2,000, newest 20:

```text
{ status, total, createdAt }   keys 2,282 | FETCH <- SORT <- IXSCAN    (in-memory sort)
{ status, createdAt, total }   keys 1,224 | LIMIT <- FETCH <- IXSCAN   (ESR, no sort)
```

Putting the range field (`total`) before the sort field breaks the index order, so MongoDB must collect every matching entry and sort them in memory. Putting the **sort before the range** lets it walk the index in order and stop after 20 matches.

**Practical tip:** design indexes around your most frequent queries, not around individual fields. One compound index that follows ESR is often better than several single-field indexes.

## 3. Use covered queries for list views

If every field you filter, sort and return is in the index, MongoDB can answer from the index alone, without reading documents at all:

```js
db.orders.find(
  { customerId: 4242, status: "paid" },
  { _id: 0, status: 1, createdAt: 1 },
).sort({ createdAt: -1 });
```

```text
keys 7 | docs 0 | returned 7 | LIMIT <- PROJECTION_COVERED <- IXSCAN
```

`docs 0` and `PROJECTION_COVERED` confirm it. Note `_id: 0`: `_id` is returned by default, and including it breaks coverage unless it is in the index. Even when full coverage is not possible, **projecting only the fields you need** reduces network transfer and memory, especially with large documents.

## 4. Replace skip() with range pagination

`skip(n)` looks cheap, but MongoDB still walks past every skipped entry:

```text
skip(0).limit(20)         0 ms | keys      20
skip(100000).limit(20)   20 ms | keys 100,020
skip(250000).limit(20)   51 ms | keys 250,020
skip(450000).limit(20)   92 ms | keys 450,020
range (createdAt < last)  0 ms | keys      20
```

The cost grows linearly with the page number. Range-based (keyset or cursor) pagination stays constant: remember the last value from the current page and ask for values after it.

```js
// first page
const page = await Order.find({ status: "delivered" })
  .sort({ createdAt: -1, _id: -1 })
  .limit(20);

// next page: continue after the last item
const last = page.at(-1);
const next = await Order.find({
  status: "delivered",
  $or: [
    { createdAt: { $lt: last.createdAt } },
    { createdAt: last.createdAt, _id: { $lt: last._id } },
  ],
})
  .sort({ createdAt: -1, _id: -1 })
  .limit(20);
```

Adding `_id` as a tie-breaker matters when several documents share the same `createdAt`. Without it, items can repeat or go missing between pages. Index `{ status: 1, createdAt: -1, _id: -1 }` to support it.

The trade-off: range pagination supports "next" and "previous", not "jump to page 9,000". For admin tables and infinite scroll, that is usually fine, and far better than queries that get slower every page.

## 5. Write regex queries that can use an index

Regular expressions behave very differently depending on how they are written:

```text
/^ORD00123/    (anchored prefix)      0 ms | keys    101
/00123/        (unanchored)         183 ms | keys 500,000
/^ord00123/i   (case-insensitive)   184 ms | keys 500,000
```

Only a **case-sensitive prefix** regex (`^...`) can use the index efficiently. An unanchored pattern or the `i` flag scans every index key. Options for search features:

- Store a normalized lowercase copy of the field and query it with an anchored prefix.
- Use a **collation** index for case-insensitive equality matches.
- Use a text index or a dedicated search engine for real full-text search.

## 6. Count the right way

```text
countDocuments({})                   89 ms
estimatedDocumentCount()              2 ms
countDocuments({ status }) indexed    9 ms
```

`countDocuments({})` actually counts documents. `estimatedDocumentCount()` reads collection metadata and returns almost instantly. Use it for dashboards and "about N results" labels where an exact number is not critical. For filtered counts, make sure the filter is indexed.

## 7. Aggregations: filter on stored values, not computed ones

A common tip is "always put `$match` first". It is good practice, but modern MongoDB already helps. The optimizer moves a `$match` ahead of stages like `$addFields` and `$unwind` when the filter does not depend on them. In my tests, every one of these pipelines used an index:

```text
A: $match -> $group                          40 ms | IXSCAN
B: $addFields -> $match -> $group            72 ms | IXSCAN (optimizer moved $match)
C: $unwind -> $match -> $group               68 ms | IXSCAN (optimizer moved $match)
```

Version B was still slower than A, because it computed a field nobody needed for every matching document. So keep `$match` early and avoid unnecessary stages, but the bigger win is elsewhere:

```text
E: $match on a computed field ($month == 6)  121 ms
F: same filter as a date range                 7 ms
```

```js
// slow: the index cannot be used for a value computed per document
[
  { $addFields: { month: { $month: "$createdAt" } } },
  { $match: { status: "paid", month: 6 } },
  { $group: { _id: "$city", revenue: { $sum: "$total" } } },
];

// fast: the same question expressed as a range on the stored field
[
  { $match: { status: "paid", createdAt: { $gte: new Date("2025-06-01"), $lt: new Date("2025-07-01") } } },
  { $group: { _id: "$city", revenue: { $sum: "$total" } } },
];
```

**Filtering on a computed value cannot use an index for that condition.** Rewriting the filter as a range on the stored field made the report **17× faster**. The same applies to `$expr`, `$where` and string manipulation inside filters.

## 8. Indexes are not free

Every index speeds up some reads and slows down every write, because each insert and update must also update the index. They also consume memory. In this test collection:

```text
_id_                                 12.5 MB
customerId_1                          3.0 MB
customerId_1_status_1_createdAt_-1    7.7 MB
status_1_createdAt_-1                 5.6 MB
```

Keep your **working set** (frequently used data plus indexes) within RAM. Guidelines:

- Remove indexes that are covered by another index's prefix. An index on `{ customerId, status, createdAt }` already serves queries on `customerId` alone, so `{ customerId: 1 }` becomes redundant.
- Check usage with `db.orders.aggregate([{ $indexStats: {} }])` and drop indexes that are never used.
- Build indexes for real query patterns, verified with `explain()`, not "just in case".

## A Mongoose checklist

Most Node.js applications talk to MongoDB through Mongoose. A few habits that prevent common performance problems:

```js
// define compound indexes on the schema, following ESR
orderSchema.index({ customerId: 1, status: 1, createdAt: -1 });

// read-only list endpoints: skip hydration into full Mongoose documents
const orders = await Order.find(filter)
  .select("orderNo status total createdAt") // project only what the UI needs
  .sort({ createdAt: -1 })
  .limit(20)
  .lean();

// log slow queries during development
mongoose.set("debug", process.env.NODE_ENV !== "production");
```

- Use `.lean()` for read-only queries: it returns plain objects instead of full Mongoose documents.
- Avoid N+1 queries: fetch related data with `$in` or a single `$lookup`, not one query per item in a loop.
- Set `autoIndex: false` in production and create indexes deliberately during deployment, so large index builds do not start unexpectedly.
- Turn on the database profiler or Atlas Query Insights to find slow queries in real traffic, then fix them with `explain()`.

## Summary

| Problem | Fix | Measured effect |
| --- | --- | --- |
| `COLLSCAN` on filtered queries | Add an index for the query | 500,000 → 25 docs examined |
| Extra keys or in-memory `SORT` | Compound index in **ESR** order | 162 → 20 keys; no in-memory sort |
| Reading documents for list views | Covered query / projection | 0 documents read |
| Slow deep pages | Range pagination instead of `skip()` | 92 ms → 0 ms at offset 450,000 |
| Slow search | Anchored, case-sensitive prefix regex | 184 ms → 0 ms |
| Slow total counts | `estimatedDocumentCount()` | 89 ms → 2 ms |
| Slow reports | Filter stored fields as ranges | 121 ms → 7 ms |

The workflow is always the same: run `explain("executionStats")`, compare **examined vs returned**, fix the index or the query shape, and measure again.

For the Node.js side of performance, read [Node.js Worker Threads vs Cluster](/blog/nodejs-worker-threads-vs-cluster) and [Node.js Event Loop Explained](/blog/nodejs-event-loop-explained). If you are hiring for [MEAN](/expertise/mean-stack), [MERN](/expertise/mern-stack) or [Node.js](/expertise/nodejs) roles, [get in touch](/#contact).
