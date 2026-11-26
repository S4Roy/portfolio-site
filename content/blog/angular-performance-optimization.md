---
title: Angular Performance Optimization: 7 Techniques Measured in Angular 22
description: Measured Angular performance techniques for 2026: OnPush (now the default), signals and pure pipes, @for track, virtual scrolling, lazy loading and @defer.
date: 2026-11-26
tags: Angular, Performance, Frontend
keyword: angular performance optimization
draft: false
---

Angular apps rarely become slow because of one big mistake. They get slow from many small ones: a function called thousands of times per click, a list that rebuilds itself on every refresh, ten thousand rows rendered when twenty are visible. Each looks harmless in a code review.

This guide measures the techniques that matter most, using a small benchmark app on **Angular 22** in Chromium. Every number below was recorded with Playwright and simple counters, so you can see exactly what each change does.

Angular has changed a lot in the last few releases, and much of the advice online is out of date. Two facts about Angular 22 shape everything else:

- **New apps are zoneless.** A new Angular 22 project does not include `zone.js`. Change detection is triggered by signals, template events, `async` pipe updates and `markForCheck()`, not by every `setTimeout` or HTTP response.
- **`OnPush` is the default change detection strategy.** The old default is now called **`Eager`**, and `ChangeDetectionStrategy.Default` is deprecated as an alias for it.

If you maintain an older app, many of your components may still run with eager change detection. The measurements below show what that costs.

## 1. Use OnPush (and know when you are not)

With eager change detection, a component is re-checked whenever change detection passes through it, even if nothing it displays has changed. With `OnPush`, Angular checks it only when one of its inputs changes, an event fires inside it, a signal it reads changes, or it is marked for check.

Test: a parent renders 200 child cards. I clicked an unrelated button in the parent five times and counted how often each child template was checked.

```ts
@Component({
  selector: 'product-card',
  changeDetection: ChangeDetectionStrategy.Eager, // the pre-v22 default
  template: `<p>{{ checked() }} {{ item().name }}</p>`,
})
export class ProductCard {
  item = input.required<Item>();
}
```

```text
Eager  (200 cards)  after 5 unrelated clicks: 1,000 template checks
OnPush (200 cards)  after 5 unrelated clicks:     0 template checks
```

Every click re-checked all 200 eager cards, even though no card changed. With `OnPush`, none were checked.

**What to do:**

- In new Angular 22 code, `OnPush` is already the default. Don't opt out with `Eager` unless a component truly needs it.
- In older apps, search for components without `changeDetection: ChangeDetectionStrategy.OnPush` (or with `Default` / `Eager`) and convert the most frequently rendered ones first: list rows, cards, table cells.
- `OnPush` requires **immutable updates**. If you mutate an input object (`item.name = 'x'`), the reference does not change and the child will not update. Create a new object instead, or hold the data in signals.

## 2. Never call functions in templates; use pure pipes or computed signals

This is the most common performance problem I see in Angular code reviews:

```html
@for (item of items; track item.id) {
  <p>{{ formatPrice(item.price) }}</p>
}
```

Template expressions run every time the component is checked. Test: 1,000 rows, then 5 clicks on an unrelated button *in the same component*:

```text
function in template   initial: 1,000 calls | after 5 clicks: 5,000 calls
pure pipe              initial: 1,000 calls | after 5 clicks:     0 calls
computed() signal      initial: 1,000 calls | after 5 clicks:     0 calls
```

The function ran for every row on every click, even though no price changed. Note that `OnPush` did not prevent this: the click happened *inside* the component, which correctly marks it for check, and every expression in its template is re-evaluated. A formatting function is cheap, but replace it with a date calculation, a filter or a permission check and this becomes visible lag.

**Option A: a pure pipe.** Angular caches the result and only re-runs `transform` when its input changes:

```ts
@Pipe({ name: 'inr' }) // pipes are pure by default
export class InrPipe implements PipeTransform {
  transform(price: number) {
    return '₹' + price.toLocaleString('en-IN');
  }
}
```

```html
<p>{{ item.price | inr }}</p>
```

**Option B: a computed signal.** Derive display data once, and recompute only when the source signal changes:

```ts
items = signal<Item[]>([]);
rows = computed(() =>
  this.items().map((i) => ({ id: i.id, label: '₹' + i.price.toLocaleString('en-IN') })),
);
```

```html
@for (row of rows(); track row.id) {
  <p>{{ row.label }}</p>
}
```

Use pipes for reusable formatting. Use `computed()` for view models derived from component state, such as filtered, sorted or grouped lists. Reading a signal in the template (`rows()`) is cheap: it returns the cached value.

## 3. Track list items by a stable ID

Angular's `@for` requires a `track` expression. What you track decides whether Angular can reuse DOM elements when the list changes.

Test: 500 items, then a "refresh from API" that returns the **same items as new objects**, which is what every HTTP call produces:

```html
@for (item of items(); track item) { <li>{{ item.name }}</li> }    <!-- by object identity -->
@for (item of items(); track item.id) { <li>{{ item.name }}</li> } <!-- by stable ID -->
```

```text
track item     <li> removed: 500, added: 500
track item.id  <li> removed:   0, added:   0
```

Tracking by object identity threw away and rebuilt all 500 elements, because every object was new. Tracking by `id` recognised the same items and kept every element. On real rows with images, child components and form state, the difference is large: rebuilt rows lose focus, scroll position and component state, and cost far more to render.

**Rule:** track by a unique, stable ID from your data (`item.id`, `order.orderNo`). Use `$index` only for static lists that never reorder.

## 4. Virtualize long lists

If a list has thousands of rows, rendering all of them costs DOM nodes, memory and layout time. **Virtual scrolling** renders only the rows in view and swaps them as the user scrolls.

Test: 10,000 rows, three cells each:

```text
plain @for      rows in DOM: 10,000 | DOM elements: 40,015 | load to first row: 229 ms
virtual scroll  rows in DOM:     20 | DOM elements:     98 | load to first row:  62 ms
```

After scrolling to row 5,000, the virtual list still had only **23 rows** in the DOM. With the Angular CDK:

```ts
import { ScrollingModule } from '@angular/cdk/scrolling';

@Component({
  imports: [ScrollingModule],
  template: `
    <cdk-virtual-scroll-viewport itemSize="40" class="viewport">
      <div *cdkVirtualFor="let item of items; trackBy: trackById" class="row">
        {{ item.name }}
      </div>
    </cdk-virtual-scroll-viewport>
  `,
  styles: `.viewport { height: 600px; } .row { height: 40px; }`,
})
export class OrderList {
  items = makeItems(10_000);
  trackById = (_: number, item: Item) => item.id;
}
```

Things to know:

- The viewport needs a **fixed height**, and `itemSize` should match the row height.
- Rows of very different heights need extra handling (fixed-height rows are simplest).
- Browser find (Ctrl+F) only searches rendered rows. For admin tables, combine virtualization with your own search box.
- Often the best fix is not rendering 10,000 rows at all: **paginate on the server** and send 50.

## 5. Lazy-load routes and defer heavy UI

Every component, library and dependency in your initial bundle must be downloaded, parsed and executed before the app starts. Load features when they are needed:

```ts
export const routes: Routes = [
  { path: 'orders', loadComponent: () => import('./orders/orders').then((m) => m.Orders) },
  { path: 'reports', loadChildren: () => import('./reports/routes').then((m) => m.REPORT_ROUTES) },
];
```

In the benchmark app, switching four routes from eager imports to `loadComponent` reduced the initial bundle from **271.8 kB to 245.8 kB**. Most of the difference was the CDK scrolling code, which moved into a 27.6 kB chunk that only loads when that page opens. In a real app, with charting libraries, rich text editors and admin modules, the savings are much larger.

Within a page, **`@defer`** lazy-loads a block of the template, including its components and their dependencies:

```html
@defer (on viewport) {
  <sales-chart [data]="sales()" />
} @placeholder {
  <div class="chart-skeleton"></div>
} @loading (minimum 300ms) {
  <spinner />
}
```

Good candidates: charts, maps, comment sections, rich editors, and anything below the fold. Triggers include `on viewport`, `on interaction`, `on hover`, `on idle` and `on timer(2s)`.

Watch your budget in `angular.json` so bundle growth fails the build instead of reaching users:

```json
"budgets": [{ "type": "initial", "maximumWarning": "500kB", "maximumError": "1MB" }]
```

## 6. Move to signals and clean up subscriptions

Signals give Angular fine-grained knowledge of what changed, which is what makes zoneless change detection efficient. Practical habits:

- Hold component state in `signal()`, derive values with `computed()`, and read them in templates.
- Convert observables at the boundary with `toSignal()` (it unsubscribes automatically) or use the `async` pipe.
- For manual subscriptions, use `takeUntilDestroyed()`. Leaked subscriptions keep components in memory and keep firing after the user has left the page.
- Debounce input-driven requests so typing does not send a request per keystroke:

```ts
results = toSignal(
  this.searchControl.valueChanges.pipe(
    debounceTime(300),
    distinctUntilChanged(),
    switchMap((term) => this.api.search(term)), // cancels the previous request
  ),
  { initialValue: [] },
);
```

- Avoid heavy work inside `effect()`. Effects are for side effects (logging, syncing to storage), not for computing state. Use `computed()` instead.

## 7. Optimize images and the first load

- Use **`NgOptimizedImage`** (`<img ngSrc="..." width height>`). It warns about missing dimensions (layout shift), lazy-loads offscreen images by default, and supports `priority` for the main hero image to improve LCP.
- Consider **SSR with hydration** for public, SEO-relevant pages. Users see content before JavaScript finishes loading, and incremental hydration with `@defer` can hydrate parts of the page only when needed.
- Measure before and after with **Lighthouse** and the **Angular DevTools profiler**, which shows which components were checked and how long each took.

## A quick audit checklist

| Check | Fix |
| --- | --- |
| Components with `Eager` / `Default` change detection | Switch to `OnPush` (default in Angular 22) |
| Function calls in templates | Pure pipe or `computed()` |
| `track item` or `track $index` on dynamic lists | `track item.id` |
| Lists with hundreds or thousands of rows | Server pagination or CDK virtual scroll |
| Large initial bundle | `loadComponent`, `loadChildren`, `@defer`, budgets |
| Manual `subscribe()` without cleanup | `toSignal`, `async` pipe, `takeUntilDestroyed` |
| Requests on every keystroke | `debounceTime` + `switchMap` |
| Images without dimensions | `NgOptimizedImage` |

## Interview questions: quick answers

**What is the default change detection strategy in Angular 22?**
`OnPush`. The previous default is now called `Eager`, and `ChangeDetectionStrategy.Default` is a deprecated alias for it.

**When does an OnPush component re-render?**
When an input reference changes, an event fires inside the component or its children, a signal read in its template changes, an `async` pipe emits, or `markForCheck()` is called.

**Why are functions in templates bad?**
They run on every change detection check of the component, for every place they are used. In a list, that multiplies by the number of rows.

**What does `track` do in `@for`?**
It tells Angular how to identify items between renders, so it can move and reuse existing DOM elements instead of recreating them.

**What is zoneless change detection?**
Angular runs change detection based on explicit notifications (signals, template events, `markForCheck`) instead of patching every async browser API with `zone.js`. New Angular 22 apps are zoneless by default.

**What is the difference between lazy loading and `@defer`?**
Lazy loading splits code at the route level. `@defer` splits code inside a template, loading a block's components and dependencies when a trigger fires, such as entering the viewport.

## Summary

Measured on Angular 22:

- **OnPush:** 1,000 → 0 unnecessary child checks over five clicks.
- **Pure pipe / `computed()`:** 5,000 → 0 repeated function calls.
- **`track item.id`:** 500 → 0 DOM rows recreated on refresh.
- **Virtual scroll:** 40,015 → 98 DOM elements, first row in 62 ms instead of 229 ms.
- **Lazy routes:** initial bundle 271.8 kB → 245.8 kB in a tiny app, far more in real ones.

None of these techniques is complicated. The skill is noticing them early, before a list grows from 50 rows to 5,000.

I build enterprise Angular applications, from procurement workflows to single sign-on platforms. If you are hiring for [Angular](/expertise/angular) or [MEAN stack](/expertise/mean-stack) roles, [get in touch](/#contact).
