---
title: MongoDB Transactions in Node.js with Mongoose: When You Need Them (Tested)
description: MongoDB transactions in Node.js and Mongoose, tested: partial writes, overselling under concurrency, write conflicts and retries, the session pitfall, and when an atomic update is better.
date: 2026-11-26
tags: MongoDB, Node.js, Backend
keyword: mongodb transactions nodejs
draft: false
---

MongoDB has supported multi-document ACID transactions since version 4.0, but many Node.js codebases either never use them, and corrupt data under load, or wrap everything in them, and pay for it with retries and complexity. The right answer is in between.

This guide tests both sides with **MongoDB 8.0** (a single-node replica set), **Mongoose 8.24** and **Node.js 22**. The database was a throwaway instance, deleted afterwards, and every result below was produced by running the code.

> Transactions need a **replica set** or a sharded cluster. A standalone `mongod` rejects them. MongoDB Atlas is always a replica set. Locally, start `mongod --replSet rs0` and run `rs.initiate()` once.

## Problem 1: partial writes

Transfer 500 from account A to B. The process crashes (or the second query fails) after the debit:

```js
await Account.updateOne({ name: 'A' }, { $inc: { balance: -500 } });
// crash here
await Account.updateOne({ name: 'B' }, { $inc: { balance: 500 } });
```

```text
without transaction:  A=500  B=1000    <- 500 disappeared
with transaction:     A=1000 B=1000    <- rolled back
```

Each `updateOne` is atomic by itself, but two of them together are not. A transaction makes the group all-or-nothing:

```js
await mongoose.connection.transaction(async (session) => {
  await Account.updateOne({ name: 'A' }, { $inc: { balance: -500 } }, { session });
  await Account.updateOne({ name: 'B' }, { $inc: { balance: 500 } }, { session });
});
```

If the callback throws, every write in it is undone. If it completes, all writes become visible at once, so other readers never see the in-between state.

## The session pitfall

Every operation inside a transaction must receive the `session`. Forget it on one query and that query runs **outside** the transaction:

```js
await mongoose.connection.transaction(async (session) => {
  await Account.updateOne({ name: 'A' }, { $inc: { balance: -100 } }, { session });

  await Account.findOne({ name: 'A' }).session(session); // balance 900
  await Account.findOne({ name: 'A' });                  // balance 1000 (!)
});
```

```text
inside tx: with session balance=900, without session balance=1000
```

The query without the session read the old committed value and could not see the transaction's own write. The same mistake with a write is worse: it commits immediately and is **not** rolled back if the transaction aborts.

Practical rules:

- Pass `{ session }` to every query, update, `create` and `save` in the callback. `Model.create` needs an array when you pass options: `Order.create([doc], { session })`.
- Pass the session down explicitly to services and repositories called from the transaction.
- Don't run unrelated slow work (HTTP calls, emails, file uploads) inside the callback. It keeps the transaction open longer and may be **run more than once** on retry.

## Problem 2: overselling under concurrency

The second classic bug is a race condition. A product has **10** units in stock, and **50 customers** order at the same moment. The common "read, check, write" code:

```js
const product = await Product.findOne({ sku });
if (product.stock >= 1) {
  await Order.create({ sku, qty: 1 });
  product.stock -= 1;
  await product.save();
}
```

I ran four versions with 50 concurrent requests:

```text
read-check-write (no transaction)    orders 50 | stock  9 |  65 ms
read-check-write in transaction      orders 10 | stock  0 | 253 ms | 399 attempts for 50 buyers
atomic conditional $inc (no tx)      orders 10 | stock  0 |  17 ms
atomic $inc + order in transaction   orders 10 | stock  0 |  97 ms | 295 attempts
```

**Without protection, 50 orders were created for 10 units**, and the stock ended at 9. All 50 requests read `stock: 10` before any of them saved, so each wrote `9`. No error was raised. This is exactly the kind of bug that appears only in production, during a sale.

Every other version sold exactly 10. But look at how differently they got there.

### Transactions retry on write conflicts

When two transactions modify the same document, MongoDB aborts one of them with a **WriteConflict** (a `TransientTransactionError`). Mongoose's `connection.transaction()` and the driver's `session.withTransaction()` catch that and **re-run the whole callback**.

The "read-check-write in transaction" version needed **399 attempts** to complete 50 purchases. It was correct, but hot documents (a popular product, a shared counter) turn into retry storms under load. That's also why the callback must be safe to run several times: no emails, no external API calls, no side effects outside the session.

### Often you don't need a transaction at all

The fastest correct version used **no transaction**:

```js
const result = await Product.updateOne(
  { sku, stock: { $gte: 1 } }, // condition
  { $inc: { stock: -1 } },     // update
);
if (result.modifiedCount === 1) {
  await Order.create({ sku, qty: 1 });
} else {
  throw new AppError(409, 'OUT_OF_STOCK', 'Out of stock');
}
```

**17 ms, exactly 10 orders.** A single-document update is always atomic in MongoDB. Putting the check (`stock >= 1`) into the filter means the check and the decrement happen as one operation. When stock reaches 0, the filter stops matching and `modifiedCount` is 0.

This pattern (conditional atomic updates, `$inc`, `findOneAndUpdate` with a filter) solves most concurrency problems on a single document, and it's the first tool to reach for.

The remaining gap: if the process crashes between the `$inc` and `Order.create`, a unit of stock is reserved with no order. The fourth version closes that gap by wrapping both in a transaction, which is correct and still much faster than read-check-write inside a transaction (**97 ms** vs 253 ms), because it holds the conflicting document for less time.

## Do transactions slow everything down?

Not necessarily. I timed 1,000 sequential "place order" operations (decrement stock + insert order):

```text
without transaction  11,817–12,492 ms
with transaction      6,667–6,874 ms
```

The transaction version was **faster**. On this replica set, every write waits for a durable, majority-acknowledged commit (about 6 ms each locally). Without a transaction, that's two commits per order. With one, both writes share a single commit. I confirmed it separately: 500 single inserts took 2,905 ms with the default write concern and 124 ms with `w: 1, j: false`.

Your numbers will depend on your hardware and replica set, so measure your own. The general lessons:

- Transactions cost **extra round trips** and **retries under contention**, not a fixed slowdown.
- The bigger risks are long transactions, which hold locks and conflict more, and hot documents.
- MongoDB aborts transactions that run longer than **60 seconds** by default (`transactionLifetimeLimitSeconds`). Keep them to milliseconds.

## When to use a transaction

| Situation | Use |
| --- | --- |
| Update one document safely (stock, counter, status) | **Atomic update** with a conditional filter, `$inc`, `findOneAndUpdate` |
| Related data that belongs together | **Embed it in one document.** Single-document writes are atomic |
| Several documents or collections must change together (transfer, order + stock + payment record) | **Transaction** |
| Reading a consistent snapshot across collections | Transaction (snapshot reads) |
| Long batch jobs, imports, migrations | Not one big transaction. Process in small, idempotent batches |
| Calling external services (payment gateway, email) | Outside the transaction; use idempotency keys and status fields |

MongoDB's schema design favours embedding data that changes together. An order with its line items in one document needs no transaction at all.

## A production-ready pattern

```js
async function placeOrder({ userId, sku, qty }) {
  return mongoose.connection.transaction(async (session) => {
    const stock = await Product.updateOne(
      { sku, stock: { $gte: qty } },
      { $inc: { stock: -qty } },
      { session },
    );
    if (stock.modifiedCount !== 1) throw new AppError(409, 'OUT_OF_STOCK', 'Not enough stock');

    const [order] = await Order.create([{ userId, sku, qty, status: 'pending_payment' }], { session });
    await Ledger.create([{ orderId: order._id, type: 'reserve', qty }], { session });
    return order;
  });
}
// after commit: start payment, send email, publish events
```

Why it holds up:

- **Atomic conditional update** inside the transaction: short lock time, no read-then-write race.
- **Throwing aborts everything**, and the error maps to a 409 through your [error middleware](/blog/nodejs-error-handling-graceful-shutdown).
- **Side effects happen after commit**, so a retry never charges a card or sends an email twice.
- **Status fields** (`pending_payment`) let a background job clean up orders whose payment never completed. For the payment side, see [How to Prevent Duplicate Payments in Node.js](/blog/prevent-duplicate-payments-nodejs).

If you use the driver directly, `session.withTransaction(fn)` gives the same automatic retry. If you write `startTransaction()` / `commitTransaction()` by hand, you must implement retries for `TransientTransactionError` and `UnknownTransactionCommitResult` yourself.

## Interview questions: quick answers

**Does MongoDB support ACID transactions?**
Yes. Single-document operations have always been atomic. Multi-document transactions are supported since 4.0 on replica sets and since 4.2 on sharded clusters.

**Why does my transaction fail with "Transaction numbers are only allowed on a replica set member or mongos"?**
You're connected to a standalone `mongod`. Run it as a replica set (even a single node) or use Atlas.

**How do you prevent overselling stock in MongoDB?**
Use an atomic conditional update: `updateOne({ sku, stock: { $gte: qty } }, { $inc: { stock: -qty } })` and check `modifiedCount`. Wrap it in a transaction when other documents (orders, ledger entries) must be created atomically with it.

**What is a WriteConflict in MongoDB?**
An error raised when two concurrent transactions modify the same document. One is aborted with a `TransientTransactionError` label, and the transaction should be retried. `withTransaction` does this automatically.

**What happens if you forget to pass the session?**
That operation runs outside the transaction. A read won't see the transaction's uncommitted writes, and a write is committed immediately and not rolled back on abort.

**Should you call external APIs inside a transaction?**
No. The callback may run several times on retry, and the transaction stays open while you wait. Commit first, then perform side effects, using idempotency keys.

## Summary

Tested on MongoDB 8.0 with Mongoose 8.24:

- A crash between two writes **lost 500**; a transaction rolled it back.
- A query without `session` **read stale data** inside the transaction.
- Read-check-write **sold 50 units of a 10-unit product**.
- Read-check-write in a transaction was correct, but needed **399 attempts** for 50 buyers.
- An **atomic conditional `$inc`** was correct in **17 ms**, with no transaction.
- Sequential transactions were **faster** here, because two writes shared one durable commit.

Reach for an atomic single-document update first, embed data that changes together, and use transactions when several documents truly must change as one.

If you are hiring for [Node.js](/expertise/nodejs), [MEAN](/expertise/mean-stack) or [MERN](/expertise/mern-stack) roles, [get in touch](/#contact).
