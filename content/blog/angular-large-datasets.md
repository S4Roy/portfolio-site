---
title: How to Handle Large Datasets in Angular: Pagination, Virtual Scroll and Web Workers
description: Handle 50,000+ rows in Angular without freezing the UI. Measured comparisons of rendering everything, pagination, CDK virtual scrolling, server-side paging and web workers.
date: 2026-11-26
tags: Angular, Performance, Frontend
keyword: angular large data handling
draft: false
---

Sooner or later, every business application gets a screen with "all the orders", "all the products" or "all the transactions". It works fine with 200 test records. Then production has 50,000, and the page takes seconds to open and freezes while someone types in the search box.

This guide measures what actually happens with a large dataset in Angular, and which fixes help. The benchmark uses **Angular 22** in Chromium with a list of **50,000 orders** (ID, customer, city, status, amount) and a search box that filters by customer or city. Each number was recorded with Playwright in a production build.

> This post builds on [Angular Performance Optimization: 7 Techniques Measured in Angular 22](/blog/angular-performance-optimization), which covers `OnPush`, `track` and template functions.

## The problem: rendering everything

The simplest implementation keeps the data in a signal, filters it with `computed()`, and renders every match:

```ts
orders = signal<Order[]>([]);
term = signal('');

filtered = computed(() => {
  const t = this.term().toLowerCase();
  return t
    ? this.orders().filter((o) => o.customer.toLowerCase().includes(t) || o.city.toLowerCase().includes(t))
    : this.orders();
});
```

```html
<input (input)="term.set($any($event.target).value)" />
@for (o of filtered(); track o.id) {
  <div class="row">{{ o.id }} {{ o.customer }} {{ o.city }} {{ o.status }} {{ o.amount }}</div>
}
```

This code already follows good practice: signals, `computed()`, and `track` by ID. It is still slow, because it puts 50,000 rows in the DOM:

```text
render all 50,000 rows   load to first row: ~1,400 ms | DOM elements: 300,017
```

Then I typed `customer 12` into the search box, one character at a time, and measured how long each keystroke took to appear on screen:

```text
keystrokes (ms): 67, 43, 40, 45, 48, 45, 46, 49, 51, 672, 375
```

Every keystroke cost 40 to 70 ms, even when the result did not change, because Angular must check 50,000 rows. When the filter finally narrowed the list (`customer 1`), removing about 45,000 rows froze the page for **672 ms**. Users notice anything above about 100 ms as lag.

The fix is not a faster filter. **Filtering 50,000 objects in JavaScript is fast. Rendering them is not.** The goal is to keep the number of rows in the DOM small, whatever the size of the data.

## Option 1: client-side pagination

Keep the full list in memory, but render one page:

```ts
page = signal(0);
pageSize = 50;

visible = computed(() =>
  this.filtered().slice(this.page() * this.pageSize, (this.page() + 1) * this.pageSize),
);
total = computed(() => this.filtered().length);
pages = computed(() => Math.max(1, Math.ceil(this.total() / this.pageSize)));
```

```html
@for (o of visible(); track o.id) { ... }
<button (click)="page.set(page() - 1)" [disabled]="page() === 0">Previous</button>
<span>Page {{ page() + 1 }} of {{ pages() }}</span>
<button (click)="page.set(page() + 1)" [disabled]="page() + 1 >= pages()">Next</button>
```

Same data, same search:

```text
render all rows   load ~1,400 ms | DOM 300,017 | worst keystroke 672 ms
paginate (50)     load      56 ms | DOM     317 | worst keystroke  18 ms
```

Every keystroke now completes within about one frame (16.7 ms at 60 Hz). The filter still runs over all 50,000 rows, and that takes only a few milliseconds. Remember to reset `page` to 0 when the search term changes, or the user can end up on page 40 of a 3-page result.

## Option 2: virtual scrolling

Some screens should scroll, not paginate: logs, chat history, long pick lists. The Angular CDK's virtual scroll renders only the rows in view and swaps them as the user scrolls:

```ts
import { ScrollingModule } from '@angular/cdk/scrolling';

@Component({
  imports: [ScrollingModule],
  template: `
    <cdk-virtual-scroll-viewport itemSize="32" class="viewport">
      <div *cdkVirtualFor="let o of filtered(); trackBy: byId" class="row">
        {{ o.id }} {{ o.customer }} {{ o.city }}
      </div>
    </cdk-virtual-scroll-viewport>
  `,
  styles: `.viewport { height: 600px; } .row { height: 32px; }`,
})
export class OrderList {
  byId = (_: number, o: Order) => o.id;
}
```

```text
virtual scroll    load      54 ms | DOM     170 | worst keystroke  18 ms
```

Only 25 rows were in the DOM at any time, out of 50,000 (or 2,776 after filtering). The viewport needs a fixed height, and `itemSize` must match the row height. Rows of varying height need extra work, and browser find (Ctrl+F) only sees rendered rows, so give users a search box.

Pagination or virtual scroll? Use **pagination** for admin tables where users jump to a page, share a link to it, or export it. Use **virtual scroll** for continuous lists where position in the list doesn't matter.

## Option 3: don't send 50,000 rows at all

Both options above still download the whole dataset. I measured the API response for these orders (with order number and date added, as a real API would return):

```text
50 rows       7.2 KB raw | 1.0 KB gzip | JSON.parse 0.02 ms
50,000 rows   7.3 MB raw | 806 KB gzip | JSON.parse 25 ms
```

806 KB is noticeable on mobile data, and the browser then holds 7 MB of objects in memory. The database also has to read and serialize every row. For real business data, which only grows, **server-side pagination, filtering and sorting** is the right default. The client asks for one page:

```ts
@Injectable({ providedIn: 'root' })
export class OrdersApi {
  private http = inject(HttpClient);

  list(q: { page: number; size: number; search: string; sort: string }) {
    return this.http.get<{ items: Order[]; total: number }>('/api/orders', {
      params: { page: q.page, size: q.size, search: q.search, sort: q.sort },
    });
  }
}
```

And the component turns its state into requests, cancelling stale ones:

```ts
search = signal('');
page = signal(0);

private query = computed(() => ({ page: this.page(), size: 50, search: this.search(), sort: '-createdAt' }));

result = toSignal(
  toObservable(this.query).pipe(
    debounceTime(300),
    switchMap((q) => this.api.list(q)), // cancels the previous request
  ),
  { initialValue: { items: [], total: 0 } },
);
```

`debounceTime` waits until the user stops typing, so `customer 12` sends one request instead of eleven. `switchMap` cancels an older request if a newer one starts, so a slow response can never overwrite a fresh one.

On the server, the query needs an index that matches the filter and sort, and deep pages should use range (cursor) pagination instead of `skip()`. [MongoDB Query Optimization](/blog/mongodb-query-optimization) measures both: on 500,000 documents, `skip(450000)` took 92 ms, while range pagination took under 1 ms.

**When is client-side data fine?** When the dataset is small and bounded (a few thousand rows that don't grow quickly), when users need instant filtering without round trips, or when the app must work offline. Even then, paginate or virtualize the rendering.

## Option 4: move heavy computation to a web worker

Sometimes you really do need to process a big array in the browser: sorting, grouping or aggregating for a report, parsing a large CSV upload, or generating an export. That work runs on the main thread and blocks everything else, including typing, clicks and animations.

I sorted 200,000 orders by customer name with `localeCompare`, and measured the longest time the main thread was blocked:

```text
sort on main thread   total 156–179 ms | longest freeze 152–176 ms
sort in web worker    total 189–218 ms | longest freeze  42–46 ms
```

The worker made the operation slightly *slower* overall, but the page stayed far more responsive. The remaining 42 ms freeze is not the sort. It is the cost of **copying 200,000 objects** to the worker, because `postMessage` clones the data.

The Angular CLI supports workers directly (`ng generate web-worker sort`):

```ts
// sort.worker.ts
/// <reference lib="webworker" />
addEventListener('message', ({ data }) => {
  data.sort((a: Order, b: Order) => a.customer.localeCompare(b.customer));
  postMessage(data.slice(0, 50));
});
```

```ts
// component
private worker = new Worker(new URL('./sort.worker', import.meta.url), { type: 'module' });

sortByCustomer() {
  this.worker.onmessage = ({ data }) => this.topRows.set(data);
  this.worker.postMessage(this.rows);
}
```

To get the most from a worker:

- **Send the data once and keep it in the worker.** Then send small commands (`{ sort: 'customer' }`) and receive small results (the first page), instead of copying the full array each time.
- **Return only what the UI needs**, such as a page or a summary, not the whole sorted array.
- For numeric data, use typed arrays and **transfer** their buffers, which moves them without copying.
- Use workers for CPU work only. They don't make HTTP requests faster.

The same idea applies on the backend: [Node.js Worker Threads vs Cluster](/blog/nodejs-worker-threads-vs-cluster) shows a blocked health check dropping from 911 ms to 4 ms with a worker thread.

## Other habits that help

- **Use `OnPush` and signals** so only components whose data changed are checked. In Angular 22, `OnPush` is the default.
- **Track rows by ID.** `track o.id` lets Angular reuse rows when data is refreshed, instead of rebuilding them.
- **Keep rows light.** A row with five child components, tooltips and menus costs much more than plain text. Render heavy parts (action menus, details) only when the user opens them, or use `@defer (on interaction)`.
- **Avoid functions in row templates.** In a 50-row page this is minor; in a 5,000-row list it multiplies.
- **Precompute search keys.** If you filter client-side, build a lowercase search string once when the data loads, instead of lowercasing every field on every keystroke.
- **Stream large exports.** Generate CSV or Excel exports on the server, or in a worker, rather than building the file on the main thread.

## Decision guide

| Situation | Approach |
| --- | --- |
| Dataset grows without limit (orders, logs, transactions) | **Server-side** pagination, filtering and sorting |
| Admin table with page numbers and exports | Server or client **pagination** |
| Long continuous list (logs, chat, pick lists) | **CDK virtual scroll** |
| Small, bounded dataset that must filter instantly | Client-side filter + pagination or virtual scroll |
| Heavy sorting, grouping or parsing in the browser | **Web worker**, keep data inside it |
| Search box triggers requests | `debounceTime` + `switchMap` |

## Interview questions: quick answers

**How do you display 100,000 records in Angular?**
Don't render them all. Fetch one page from the server with server-side filtering and sorting, and render it with pagination or CDK virtual scrolling, so the DOM only holds the rows in view.

**What is the difference between pagination and virtual scrolling?**
Pagination renders one fixed page and lets users move between pages. Virtual scrolling renders only the visible rows of a long scrolling list and swaps them as the user scrolls. Both keep the DOM small; the difference is the user experience.

**Why is a large list slow when filtering is fast?**
Filtering an array is cheap. Creating, checking and removing tens of thousands of DOM elements is expensive. In the benchmark, removing about 45,000 rows took 672 ms.

**When should you use a web worker in Angular?**
For CPU-heavy work in the browser, such as sorting or aggregating large arrays, parsing files, or generating exports, so the main thread stays responsive. Data sent to a worker is copied, so keep large data inside the worker and exchange small messages.

**How do you avoid sending a request on every keystroke?**
Use `debounceTime` to wait until typing pauses, `distinctUntilChanged` to skip repeated values, and `switchMap` to cancel the previous request.

## Summary

Measured on Angular 22 with 50,000 rows:

- **Render everything:** ~1,400 ms to load, 300,017 DOM elements, keystrokes up to 672 ms.
- **Paginate or virtual scroll:** ~55 ms to load, 170–317 DOM elements, every keystroke within one frame.
- **Server paging:** a 50-row page is 1 KB gzipped instead of 806 KB.
- **Web worker:** the longest freeze while sorting 200,000 rows dropped from about 170 ms to about 45 ms, and the rest was copying.

The data can be as large as the business needs. The DOM should stay small.

I build enterprise Angular applications with large operational datasets, from procurement and inventory to document management. If you are hiring for [Angular](/expertise/angular) or [MEAN stack](/expertise/mean-stack) roles, [get in touch](/#contact).
