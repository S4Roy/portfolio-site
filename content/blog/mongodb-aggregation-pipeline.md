---
title: MongoDB Aggregation Pipeline: Real Report Examples with $group, $lookup and $facet (Benchmarked)
description: Practical MongoDB aggregation pipeline examples for business reports, benchmarked on 200,000 orders: $group, $lookup, $unwind, $facet, index use, and a timezone bug that breaks monthly totals.
date: 2026-11-26
tags: MongoDB, Node.js, Backend
keyword: mongodb aggregation pipeline
draft: false
---

Every business application eventually needs reports: revenue per month, top products, customers with their order counts, a paginated admin table with a total. In MongoDB, these are aggregation pipelines. They're easy to write and easy to make slow, or quietly wrong.

This guide builds real report pipelines on an `orders` collection with **200,000 orders** (each with 1–4 line items) and a `customers` collection with **20,000 customers**, on **MongoDB 8.0**. Timings are medians of three runs after a warm-up, from a throwaway database deleted afterwards.

> For indexes, `explain()` and the ESR rule, read [MongoDB Query Optimization](/blog/mongodb-query-optimization) first. Everything there applies to the `$match` and `$sort` stages here.

## How a pipeline works

A pipeline is a list of stages. Each stage transforms the documents and passes them to the next:

```js
db.orders.aggregate([
  { $match: { status: 'paid' } },                                    // filter
  { $group: { _id: '$customerId', spent: { $sum: '$total' } } },     // aggregate
  { $sort: { spent: -1 } },                                          // order
  { $limit: 10 },                                                    // top 10
]);
```

The performance rule is simple: **reduce documents as early as possible, and let the first stages use an index.** Only a `$match` or `$sort` at the start of the pipeline (or one the optimizer can move there) can use an index.

## Report 1: monthly revenue

Paid orders in Q2, grouped by month:

```js
db.orders.aggregate([
  { $match: { status: 'paid', createdAt: { $gte: start, $lt: end } } },
  { $group: {
      _id: { $dateToString: { format: '%Y-%m', date: '$createdAt', timezone: 'Asia/Kolkata' } },
      revenue: { $sum: '$total' },
      orders: { $sum: 1 },
  } },
  { $sort: { _id: 1 } },
]);
```

```text
no index (COLLSCAN)                        53 ms
index { status: 1, createdAt: 1 }          14 ms
index { status, createdAt, total }         12 ms   (covered: 0 documents examined)
```

The compound index lets `$match` read only matching orders. Adding `total` to the index made the query **covered**: with a `$project` of only `createdAt` and `total`, MongoDB answered from the index without reading a single document (`totalDocsExamined: 0`). For reports that run constantly, such as dashboards, covered pipelines are worth designing for.

### The timezone bug

The first version of this report returned this for Q2:

```text
2025-04: 4,287 orders | 2025-05: 4,464 | 2025-06: 4,320 | 2025-07: 33
```

**A July row in a Q2 report**, and April short by 33 orders. The `$match` used UTC boundaries (`2025-04-01T00:00:00Z`), but `$group` bucketed months in India time. Orders placed between 00:00 and 05:30 IST on 1 April were excluded, and orders from the evening of 30 June UTC (already 1 July in IST) appeared as July.

The fix is to use the **same timezone in both places**:

```js
const start = new Date('2025-04-01T00:00:00+05:30');
const end = new Date('2025-07-01T00:00:00+05:30');
```

```text
2025-04: 4,320 orders | 2025-05: 4,464 | 2025-06: 4,320
```

MongoDB stores dates in UTC. Business reports are expected in the business's timezone. Always pass `timezone` to date operators (`$dateToString`, `$dateTrunc`, `$month`), and build `$match` boundaries in the same timezone. This bug produces plausible-looking numbers, so it often goes unnoticed until finance reconciles the totals.

Also note: filter on the stored `createdAt` as a range, not on a computed month. A computed value can't use an index; in the query optimization post, the computed version was 17× slower.

## Report 2: latest orders with customer names ($lookup)

`$lookup` joins another collection. Where you put it matters enormously:

```js
// slow: joins every paid order, then keeps 20
[{ $match: { status: 'paid' } },
 { $lookup: { from: 'customers', localField: 'customerId', foreignField: '_id', as: 'customer' } },
 { $sort: { createdAt: -1 } }, { $limit: 20 }]

// fast: keeps 20, then joins 20
[{ $match: { status: 'paid' } }, { $sort: { createdAt: -1 } }, { $limit: 20 },
 { $lookup: { from: 'customers', localField: 'customerId', foreignField: '_id', as: 'customer' } },
 { $unwind: '$customer' },
 { $project: { total: 1, createdAt: 1, 'customer.name': 1 } }]
```

```text
$lookup before $sort/$limit (50,000 lookups)   560 ms
$lookup after  $sort/$limit (20 lookups)         3 ms
```

**187× faster** for the same result. The first version performed a join for all 50,000 paid orders, and threw away 49,980 of them. **Always `$sort` and `$limit` before `$lookup`** when the join doesn't affect which documents you keep.

## Report 3: customers with order counts (index the foreign field)

Here the join goes the other way: for each of 200 gold customers, find their orders by `orders.customerId`:

```js
db.customers.aggregate([
  { $match: { tier: 'gold' } },
  { $limit: 200 },
  { $lookup: { from: 'orders', localField: '_id', foreignField: 'customerId', as: 'orders' } },
  { $project: { name: 1, orderCount: { $size: '$orders' } } },
]);
```

```text
orders.customerId NOT indexed   6,013 ms
orders.customerId indexed           6 ms
```

**Six seconds versus six milliseconds.** Without an index on the foreign field, every one of the 200 lookups scanned all 200,000 orders. Report 2 was fast because it joined on `customers._id`, which is always indexed. **Every `foreignField` you join on needs an index**, and it's the most common reason a `$lookup` is slow.

A related limit: `$lookup` puts all matching documents into an array inside each result document, and a document can't exceed **16 MB**. For a customer with tens of thousands of orders, use a `pipeline` in the `$lookup` to return only what you need:

```js
{ $lookup: {
    from: 'orders', localField: '_id', foreignField: 'customerId',
    pipeline: [{ $count: 'n' }],   // or $match / $sort / $limit / $project
    as: 'stats',
} }
```

In my test this was slightly slower (10 ms vs 6 ms), because the customers have only about ten orders each. Its value is safety and memory for large one-to-many joins, not speed for small ones.

## Report 4: top products ($unwind)

Line items are arrays inside orders. `$unwind` produces one document per item, so you can group by SKU:

```js
db.orders.aggregate([
  { $match: { status: 'paid', createdAt: { $gte: start, $lt: end } } }, // filter first!
  { $unwind: '$items' },
  { $group: {
      _id: '$items.sku',
      revenue: { $sum: { $multiply: ['$items.qty', '$items.price'] } },
      units: { $sum: '$items.qty' },
  } },
  { $sort: { revenue: -1 } },
  { $limit: 5 },
]);
```

Over all 200,000 orders (about 500,000 line items after `$unwind`), this took **260 ms**. `$unwind` multiplies documents, so filter with `$match` **before** it. If a report like this runs often, precompute it instead (see below).

## Pagination with a total: is $facet faster?

A common admin-table pattern returns one page and the total count in a single aggregation with `$facet`:

```js
db.orders.aggregate([
  { $match: { status: 'paid' } },
  { $facet: {
      items: [{ $sort: { createdAt: -1 } }, { $limit: 20 }],
      total: [{ $count: 'n' }],
  } },
]);
```

```text
two queries (find + countDocuments)   9 ms
$facet { items, total }              37 ms
```

**The single `$facet` query was 4× slower.** The initial `$match` used the index, but inside `$facet`, the sub-pipelines can't use indexes. MongoDB passed all 50,000 matching documents into the facet, sorted them in memory for the `items` branch, and counted them for `total`. The two separate queries each used the index efficiently: one read 20 index entries, the other counted index keys.

`$facet` is convenient for computing several summaries over a **small, already-filtered** set (filter counts for a search sidebar, for example). For paginating large collections, run two queries in parallel with `Promise.all`, and consider whether you need an exact total at all. For deep pages, use range pagination (covered in the query optimization post).

## Memory: the 100 MB limit

Blocking stages like `$group` and `$sort` have a **100 MB** memory limit per stage. Above it, they must spill to disk, which is much slower. Since **MongoDB 6.0**, `allowDiskUseByDefault` is `true`, so pipelines spill automatically instead of failing. I confirmed the setting on this 8.0 server, and a `$group` that pushed every whole order into per-customer arrays completed in 148 ms without errors.

Don't rely on spilling. If a report spills, it's usually doing too much: `$push`-ing whole documents instead of the fields you need, or grouping before filtering. On older versions, or with `allowDiskUseByDefault` disabled, the same pipeline fails with `QueryExceededMemoryLimitNoDiskUseAllowed`.

## Precompute heavy reports

If a dashboard runs the same heavy aggregation on every page load, compute it once and store the result. `$merge` writes pipeline output into a collection, updating existing rows:

```js
db.orders.aggregate([
  { $match: { status: 'paid', createdAt: { $gte: startOfToday } } },
  { $group: {
      _id: { day: { $dateTrunc: { date: '$createdAt', unit: 'day', timezone: 'Asia/Kolkata' } } },
      revenue: { $sum: '$total' },
      orders: { $sum: 1 },
  } },
  { $merge: { into: 'daily_revenue', whenMatched: 'replace', whenNotMatched: 'insert' } },
]);
```

Run it on a schedule (every few minutes, or nightly), and the dashboard reads a few small documents from `daily_revenue` instead of aggregating 200,000 orders. This is how most reporting screens should work at scale. Recompute only recent periods; closed months don't change.

## Using pipelines from Node.js

```js
const rows = await Order.aggregate([
  { $match: { status: 'paid', createdAt: { $gte: start, $lt: end } } },
  { $group: { _id: '$customerId', spent: { $sum: '$total' } } },
  { $sort: { spent: -1 } },
  { $limit: 10 },
]);
```

- **Mongoose doesn't cast aggregation input.** In `find()`, a string ID is converted to an `ObjectId` for you; in `aggregate()`, it isn't. Convert explicitly: `new mongoose.Types.ObjectId(id)`. Otherwise `$match` silently matches nothing.
- Results are plain objects, not Mongoose documents. There are no getters, virtuals or `save()`.
- Never build pipeline stages from raw user input. Whitelist sortable fields and validate filters, so users can't inject operators.
- Check slow pipelines with `Model.aggregate(pipeline).explain('executionStats')`.

## Checklist

| Problem | Fix | Measured |
| --- | --- | --- |
| `$match` scans the collection | Compound index on filter fields | 53 → 14 ms |
| Dashboard aggregation reads documents | Covered index + `$project` | 0 documents examined |
| Month totals off at the edges | Same `timezone` in `$match` and date operators | July row removed |
| `$lookup` runs for discarded documents | `$sort` + `$limit` before `$lookup` | 560 → 3 ms |
| `$lookup` on a non-`_id` field is slow | Index the `foreignField` | 6,013 → 6 ms |
| `$unwind` on everything | `$match` first | — |
| Page + total with `$facet` is slow | Two indexed queries in parallel | 37 → 9 ms |
| Same heavy report on every request | Precompute with `$merge` on a schedule | — |

## Interview questions: quick answers

**What is the MongoDB aggregation pipeline?**
A sequence of stages (`$match`, `$group`, `$sort`, `$lookup`, `$project` and others) that process documents in order, each stage transforming the output of the previous one. It's used for reports, analytics and data transformation.

**What is the difference between $match and $project?**
`$match` filters documents (like SQL `WHERE`); `$project` shapes each document's fields (like SQL `SELECT`).

**How does $lookup work, and how do you make it fast?**
It performs a left outer join with another collection, adding matching documents as an array. Index the `foreignField`, and reduce documents with `$match`, `$sort` and `$limit` before the `$lookup`.

**Which stages can use an index?**
A `$match` or `$sort` at the beginning of the pipeline, or one the optimizer can move there, plus `$lookup` lookups on an indexed foreign field. Stages after `$group`, `$unwind` or `$project` operate on in-memory results.

**What does $unwind do?**
It outputs one document per element of an array field. An order with three items becomes three documents, each with one item.

**What is $facet used for, and when is it slow?**
It runs several sub-pipelines over the same input in one query. Sub-pipelines can't use indexes, so on large inputs it can be slower than separate indexed queries.

**What is the 100 MB limit in aggregation?**
Blocking stages like `$sort` and `$group` can use up to 100 MB of memory each. Above that, they spill to disk; since MongoDB 6.0 this is allowed by default.

## Summary

Measured on MongoDB 8.0 with 200,000 orders:

- An index made the monthly report **4× faster**, and a covered index read **zero documents**.
- Mismatched timezones put **33 orders in the wrong quarter**.
- Moving `$lookup` after `$limit` made it **187× faster** (560 ms → 3 ms).
- Indexing the `$lookup` foreign field took a report from **6 seconds to 6 ms**.
- `$facet` pagination was **4× slower** than two indexed queries.

Filter early, join late, index what you join on, and be explicit about timezones.

If you are hiring for [Node.js](/expertise/nodejs), [MEAN](/expertise/mean-stack) or [MERN](/expertise/mern-stack) roles, [get in touch](/#contact).
