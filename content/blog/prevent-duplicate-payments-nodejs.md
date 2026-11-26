---
title: How to Prevent Duplicate Payments and Orders in Node.js
description: A practical guide to idempotent checkout in Node.js and MongoDB: idempotency keys, unique indexes, atomic state transitions and safe payment webhooks.
date: 2026-11-26
tags: Node.js, MongoDB, Payments, E-commerce
keyword: prevent duplicate payments node js
draft: true
---

A customer taps **Pay** twice on a slow connection. The payment gateway retries a webhook because your server took too long to answer. The browser callback and the webhook arrive within milliseconds of each other. Each of these is ordinary in production, and each can turn one purchase into two orders, two stock deductions or two confirmation emails.

This article walks through the patterns I use to make checkout **idempotent**: the same request, delivered any number of times, has the same effect as delivering it once. The examples use Express.js and Mongoose, but the ideas apply to any stack.

## Why duplicates happen

Duplicate orders are rarely caused by a single bug. They come from normal distributed-system behaviour:

- **User retries**: double clicks, refreshes, or the back button after a timeout.
- **Client retries**: mobile apps and HTTP clients retry on network errors, even when the server already processed the request.
- **Gateway retries**: payment providers resend webhooks until they get a `2xx` response.
- **Two confirmation paths**: the browser redirect (callback) and the server-to-server webhook both report the same payment.

The fix is not to try to stop retries. It is to make every step safe to repeat.

## Step 1: Give every checkout an idempotency key

Generate a unique key on the client when the checkout starts, and send it with every attempt of that checkout.

```js
// client: one key per checkout attempt, reused on retries
const idempotencyKey = crypto.randomUUID();

await fetch("/api/orders", {
  method: "POST",
  headers: { "Content-Type": "application/json", "Idempotency-Key": idempotencyKey },
  body: JSON.stringify({ cartId }),
});
```

On the server, store the key with the order and enforce uniqueness in the database, not in application code:

```js
const orderSchema = new mongoose.Schema({
  idempotencyKey: { type: String, required: true },
  userId: { type: mongoose.Types.ObjectId, required: true },
  status: { type: String, enum: ["pending", "paid", "failed", "cancelled"], default: "pending" },
  gatewayOrderId: String,
  gatewayPaymentId: String,
  amount: Number,
});

orderSchema.index({ userId: 1, idempotencyKey: 1 }, { unique: true });
orderSchema.index({ gatewayPaymentId: 1 }, { unique: true, sparse: true });
```

A check like "find an order with this key, and create one if none exists" is not enough. Two concurrent requests can both see "not found" and both insert. A **unique index** makes the database reject the second insert, which you can then treat as "already created":

```js
app.post("/api/orders", async (req, res) => {
  const key = req.get("Idempotency-Key");
  if (!key) return res.status(400).json({ error: "Idempotency-Key header required" });

  try {
    const order = await Order.create({ idempotencyKey: key, userId: req.user.id, amount: await cartTotal(req.body.cartId) });
    return res.status(201).json(order);
  } catch (err) {
    if (err.code === 11000) {
      // duplicate key: this checkout was already created, return the original
      const existing = await Order.findOne({ userId: req.user.id, idempotencyKey: key });
      return res.status(200).json(existing);
    }
    throw err;
  }
});
```

## Step 2: Make payment finalization an atomic state transition

The most dangerous moment is marking an order **paid**, because that usually triggers stock deduction, invoices and notifications. Do it as a single conditional update that only succeeds from the expected previous state:

```js
async function finalizePayment({ gatewayOrderId, gatewayPaymentId }) {
  const order = await Order.findOneAndUpdate(
    { gatewayOrderId, status: "pending" }, // only a pending order can become paid
    { $set: { status: "paid", gatewayPaymentId } },
    { new: true },
  );

  if (!order) {
    // Already finalized by the other path (webhook vs callback), or not ours.
    return { alreadyProcessed: true };
  }

  await runPostPaymentSideEffects(order); // runs exactly once per order
  return { alreadyProcessed: false, order };
}
```

Whichever path arrives first wins the update. The second finds no `pending` order and exits without side effects. No locks, no timing assumptions.

## Step 3: Keep stock and order changes in one transaction

If marking an order paid and deducting stock are separate writes, a crash between them leaves your data inconsistent. MongoDB multi-document transactions (on a replica set) keep them together:

```js
const session = await mongoose.startSession();
try {
  await session.withTransaction(async () => {
    const order = await Order.findOneAndUpdate(
      { gatewayOrderId, status: "pending" },
      { $set: { status: "paid", gatewayPaymentId } },
      { new: true, session },
    );
    if (!order) return; // already processed

    for (const item of order.items) {
      const res = await Product.updateOne(
        { _id: item.productId, stock: { $gte: item.qty } }, // never go below zero
        { $inc: { stock: -item.qty } },
        { session },
      );
      if (res.modifiedCount === 0) throw new Error(`Insufficient stock for ${item.productId}`);
    }
  });
} finally {
  await session.endSession();
}
```

The `stock: { $gte: item.qty }` condition is what prevents two buyers from both getting the last unit: the update is atomic per document, so only one can succeed.

## Step 4: Verify and de-duplicate webhooks

Webhooks are public endpoints. Before trusting one:

1. **Verify the signature** with the gateway's secret (for example, Razorpay signs the raw request body with HMAC-SHA256). Compute it over the raw bytes, not a re-serialized JSON object.
2. **Respond quickly** with `200` once the event is safely recorded, so the gateway stops retrying.
3. **Process through the same `finalizePayment` function** as the browser callback, so both paths share one idempotent code path.

```js
import crypto from "node:crypto";

app.post("/webhooks/payments", express.raw({ type: "application/json" }), async (req, res) => {
  const expected = crypto.createHmac("sha256", process.env.WEBHOOK_SECRET).update(req.body).digest("hex");
  const received = req.get("X-Razorpay-Signature") ?? "";
  if (expected.length !== received.length || !crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(received))) {
    return res.status(400).end();
  }

  const event = JSON.parse(req.body.toString("utf8"));
  if (event.event === "payment.captured") {
    const p = event.payload.payment.entity;
    await finalizePayment({ gatewayOrderId: p.order_id, gatewayPaymentId: p.id });
  }
  res.status(200).end();
});
```

## Step 5: Test the race, not just the happy path

Idempotency bugs only appear under concurrency, so tests must create concurrency on purpose:

```js
test("parallel finalization creates exactly one paid order", async () => {
  const order = await createPendingOrder();

  const results = await Promise.all(
    Array.from({ length: 10 }, () => finalizePayment({ gatewayOrderId: order.gatewayOrderId, gatewayPaymentId: "pay_1" })),
  );

  expect(results.filter((r) => !r.alreadyProcessed)).toHaveLength(1);
  expect(await Order.countDocuments({ status: "paid" })).toBe(1);
});
```

Useful cases to cover: parallel finalization, webhook and callback arriving together, two buyers competing for the final unit, and a lost response where the client retries after the server already succeeded.

## Checklist

| Risk | Defence |
| --- | --- |
| Double click / client retry | Idempotency key + unique index |
| Webhook and callback both arrive | Conditional `pending → paid` update |
| Gateway retries webhook | Signature check, fast `200`, idempotent handler |
| Overselling the last unit | Atomic `$inc` with `stock >= qty` condition |
| Partial writes on crash | MongoDB transaction around order + stock |
| Side effects firing twice | Run them only when the state transition succeeds |

None of these techniques is complicated on its own. The reliability comes from applying all of them together, and from tests that deliberately reproduce the races you are defending against.

I applied these patterns while building the checkout for [ELEXIFY](/projects/elexify), a multichannel commerce platform. If you are hiring for [Node.js](/expertise/nodejs) or full stack roles, [get in touch](/#contact).
