---
title: Next.js 16 Rendering and Caching: Static, Streaming, use cache and Revalidation (Measured)
description: How Next.js 16 renders pages with Cache Components: static, cached, streamed and blocking routes measured side by side, plus use cache, cacheLife, cacheTag, revalidateTag and updateTag.
date: 2026-11-26
tags: Next.js, React, Performance
keyword: next js caching
draft: false
---

Caching has been the most confusing part of the Next.js App Router. Next.js 16 replaced the old implicit model with **Cache Components**: nothing is cached unless you say so, with `'use cache'`, and anything dynamic must either stream behind `<Suspense>` or explicitly opt out of prerendering.

This guide builds the same page four ways on **Next.js 16.3** with Cache Components enabled, then measures what the browser actually receives. Each page loads data through a simulated database query that takes **300 ms**. All numbers are medians of 11 requests to a local production server (`next build && next start`).

## Turning on Cache Components

```ts
// next.config.ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  cacheComponents: true,
};

export default nextConfig;
```

With it enabled, the old route segment options (`export const dynamic`, `revalidate`, `fetchCache`) are removed. Caching is controlled where the data is loaded instead.

## The four strategies

### 1. Static: no data

```tsx
export default function Page() {
  return <main><h1>About</h1><p>No data, no runtime APIs.</p></main>;
}
```

Rendered once at build time and served as a file.

### 2. Cached: `'use cache'`

```tsx
import { cacheLife, cacheTag } from 'next/cache';

async function getProducts() {
  'use cache';
  cacheLife('hours');
  cacheTag('products');
  return db.products.findMany();
}

export default async function Page() {
  const products = await getProducts();
  return <main><h1>Products</h1><ProductList products={products} /></main>;
}
```

The query ran during the build, and the result was baked into the prerendered page. `cacheLife('hours')` sets how long it stays fresh, and `cacheTag` gives it a name so you can invalidate it on demand.

### 3. Streaming: dynamic data inside `<Suspense>`

```tsx
import { Suspense } from 'react';
import { connection } from 'next/server';

async function Orders() {
  await connection(); // this data must be fresh on every request
  const orders = await db.orders.recent();
  return <OrderTable orders={orders} />;
}

export default function Page() {
  return (
    <main>
      <h1>Dashboard</h1>
      <Suspense fallback={<p>Loading orders...</p>}>
        <Orders />
      </Suspense>
    </main>
  );
}
```

The heading, layout and fallback are prerendered as a **static shell**. The orders stream in on each request. Next.js calls this Partial Prerendering.

### 4. Blocking: dynamic data with no Suspense

```tsx
export default async function Page() {
  await connection();
  const orders = await db.orders.recent();
  return <main><h1>Dashboard</h1><OrderTable orders={orders} /></main>;
}
```

I expected this to work like the old dynamic rendering. Instead, **the build failed**:

```text
Error: Route "/blocking": Next.js encountered uncached or runtime data during prerendering.
`fetch(...)`, `cookies()`, `headers()`, `params`, `searchParams`, or `connection()`
accessed outside of `<Suspense>` prevents the route from being prerendered,
blocking the page load and leading to a slower user experience.
Ways to fix this:
  - [stream] Provide a placeholder with `<Suspense fallback={...}>` around the data access
  - [cache] For uncached data: cache the access with "use cache"
  - [block] Set `export const instant = false` to allow a blocking route
```

With Cache Components, Next.js treats a page that blocks on uncached data as a mistake and makes you choose: stream it, cache it, or explicitly accept blocking. I added `export const instant = false` to measure the blocking version anyway.

The build output shows how each route will be served:

```text
○ /static      (Static)
○ /cached      (Static)  revalidate 1h, expire 1d
◐ /streaming   (Partial Prerender)
ƒ /blocking    (Dynamic)
```

## What the user receives

I timed when the heading, and then the data, actually arrived in the HTML stream:

```text
/static      heading visible    2 ms | data    -   | done    2 ms
/cached      heading visible    1 ms | data    1 ms | done    1 ms
/streaming   heading visible    6 ms | data  316 ms | done  317 ms  (fallback at 6 ms)
/blocking    heading visible  312 ms | data  312 ms | done  313 ms
```

- **Static and cached** pages were complete in 1–2 ms. The 300 ms query never ran at request time.
- **Streaming** showed the heading, layout and "Loading orders..." at **6 ms**, then filled in the data at 316 ms.
- **Blocking** showed **nothing useful for 312 ms**. The whole page waited for the slowest query.

One trap in measuring this: the blocking route's **TTFB** (time to first byte) was only about 3 ms, because Next.js flushes the start of the response immediately. TTFB looked fine while the user was staring at a blank page. Measure when meaningful content arrives (or use Largest Contentful Paint in the browser), not just the first byte.

Streaming doesn't make the data faster: both dynamic pages finished at about 315 ms. It makes the **page** usable sooner. Users see the layout, can read navigation and start interacting, and the slow part fills in.

## Revalidation: updating cached data

Cached data needs a way to change when the underlying data changes. There are three tools.

### Time-based: `cacheLife`

```ts
cacheLife('hours');   // built-in profiles: 'seconds', 'minutes', 'hours', 'days', 'weeks', 'max'
cacheLife({ stale: 300, revalidate: 3600, expire: 86400 }); // or custom, in seconds
```

`revalidate` controls when the server refreshes the entry in the background. `expire` is the maximum age before a request must wait for fresh data. `stale` controls how long the browser's router cache may reuse it.

### On demand: `revalidateTag`

Call it from a webhook or an admin endpoint when data changes elsewhere, for example after a CMS publish or an import:

```ts
// app/api/revalidate/route.ts
import { revalidateTag } from 'next/cache';

export async function POST() {
  revalidateTag('products', 'max');
  return Response.json({ ok: true });
}
```

I tested what users see after calling it:

```text
before:                            products @ 13:07:43.892
after revalidateTag, 1st request:  products @ 13:07:43.892   <- stale, refresh starts in background
next request:                      products @ 13:07:56.666   <- fresh
```

That's **stale-while-revalidate**. The first request after invalidation still got the old data instantly, while Next.js regenerated the entry in the background. The next request got the new data. No user waited for the 300 ms query. The `'max'` profile, which the docs recommend, allows stale content to be served while the refresh runs. Remember to protect this endpoint with a secret.

### Read your own writes: `updateTag`

When a user changes something and expects to see it immediately (editing their profile, adding an item), stale-while-revalidate is the wrong behaviour. Use `updateTag` inside a Server Action:

```ts
'use server';
import { updateTag } from 'next/cache';

export async function updateProduct(formData: FormData) {
  await db.products.update(/* ... */);
  updateTag('products'); // expire now; the next render waits for fresh data
}
```

`updateTag` can only be called from Server Actions. Use `revalidateTag(tag, 'max')` for background refreshes triggered elsewhere, such as Route Handlers and webhooks.

## Choosing a strategy per piece of data

The real power of Cache Components is that one page can mix strategies. A product page might be:

```tsx
export default async function ProductPage({ params }: PageProps<'/products/[id]'>) {
  const { id } = await params;
  const product = await getProduct(id);          // 'use cache' + cacheTag(`product-${id}`)
  return (
    <>
      <ProductDetails product={product} />       {/* cached, in the static shell */}
      <Suspense fallback={<StockSkeleton />}>
        <LiveStock id={id} />                    {/* fresh on every request, streamed */}
      </Suspense>
      <Suspense fallback={<CartSkeleton />}>
        <CartSummary />                          {/* reads cookies(), streamed */}
      </Suspense>
    </>
  );
}
```

| Data | Strategy |
| --- | --- |
| Marketing pages, docs, blog posts | Static (no data) or `'use cache'` with `cacheLife('days')` |
| Product catalog, CMS content | `'use cache'` + `cacheTag`, `revalidateTag(tag, 'max')` from a webhook |
| Stock levels, prices, live dashboards | `<Suspense>` + fresh data each request |
| User-specific data (cart, profile) | `<Suspense>` around `cookies()`; optionally `'use cache: private'` |
| User edits their own data | Server Action + `updateTag` |
| Truly cannot show a shell | `export const instant = false` (rare) |

For dynamic routes like `/products/[id]`, use `generateStaticParams` to prerender the most popular IDs at build time.

This site is a practical example of the static end. Every blog post, case study and expertise page is prerendered at build time from Markdown and data files, so pages are served as static HTML with no database at all.

## Common mistakes

- **Expecting `fetch` to be cached.** In Next.js 15 and 16, `fetch` is not cached by default. Cache explicitly with `'use cache'`.
- **Reading cookies or headers inside a cached function.** Runtime APIs can't be used inside `'use cache'`. Read them outside, and pass the values in as arguments (arguments become part of the cache key).
- **Giant cache keys.** Everything passed into a cached function, or captured from outer scope, becomes part of the key. Pass IDs, not whole request objects.
- **One Suspense boundary around the whole page.** That's just a slower blocking page. Wrap each slow, independent part separately, so fast parts appear first.
- **Measuring TTFB only.** As measured above, a blocking page can have a 3 ms TTFB and show nothing for 300 ms.
- **Unprotected revalidation endpoints.** Anyone who finds them can keep your cache permanently cold.

## Interview questions: quick answers

**What are Cache Components in Next.js 16?**
A rendering model enabled with `cacheComponents: true`. Data is not cached unless marked with `'use cache'`. Uncached and runtime data must be wrapped in `<Suspense>` and streamed, so pages get a prerendered static shell (Partial Prerendering).

**What does `'use cache'` do?**
It caches the return value of an async function or component. Arguments and captured variables form the cache key. `cacheLife` sets its lifetime and `cacheTag` lets you invalidate it.

**What is Partial Prerendering?**
A page is split into a static shell, prerendered at build time, and dynamic holes behind `<Suspense>` that stream in at request time. Users see the shell immediately.

**What is the difference between revalidateTag and updateTag?**
`revalidateTag(tag, 'max')` marks data stale and serves stale content while it refreshes in the background (stale-while-revalidate). It suits webhooks and Route Handlers. `updateTag(tag)` expires the data immediately so the next render shows fresh data; it is for read-your-own-writes in Server Actions only.

**Does streaming make data load faster?**
No. The data takes the same time. Streaming sends the rest of the page first, so users see and use it while the slow part loads.

**Why did my build fail with "uncached or runtime data during prerendering"?**
With Cache Components, a page accessed uncached data or a runtime API (`cookies`, `headers`, `connection`, `searchParams`) outside `<Suspense>`. Wrap it in Suspense, cache it with `'use cache'`, or set `export const instant = false` to allow blocking.

## Summary

Measured on Next.js 16.3, with a 300 ms query:

- **Static and `'use cache'`** pages were complete in **1–2 ms**.
- **Streaming** showed the page in **6 ms** and the data at 316 ms.
- **Blocking** showed nothing for **312 ms**, despite a 3 ms TTFB.
- Next.js **refused to build** the blocking page until I explicitly allowed it.
- `revalidateTag(tag, 'max')` served **stale data once**, then fresh, with no user waiting.

Cache what can be cached, stream what must be fresh, and give every slow piece its own `<Suspense>` boundary.

If you are hiring for [Next.js](/expertise/nextjs), [React](/expertise/react) or full stack roles, [get in touch](/#contact).
