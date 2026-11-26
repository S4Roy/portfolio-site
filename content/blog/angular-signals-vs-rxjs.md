---
title: Angular Signals vs RxJS: When to Use Which (and How to Migrate)
description: Signals vs RxJS in Angular 22, with measured examples: glitch-free computed values, lazy memoization, equality checks, linkedSignal, interop with toSignal, and a practical migration plan.
date: 2026-11-26
tags: Angular, RxJS, Interview
keyword: angular signals vs rxjs
draft: false
---

"Should we replace RxJS with signals?" is one of the most common questions in Angular teams right now, and one of the most common interview questions. The short answer is no. They solve different problems, and modern Angular code uses both.

This guide shows the difference with small experiments run on **Angular 22** (`@angular/core` signals) and **RxJS 7.8**. Every output below was produced by running the code.

> For the RxJS side in depth, read [RxJS Operators in Angular](/blog/rxjs-operators-angular).

## The short answer

| | Signals | RxJS observables |
| --- | --- | --- |
| Models | **A value** that changes | **Events** over time |
| Read the current value | Always, synchronously: `count()` | Only by subscribing (or `BehaviorSubject.value`) |
| Derived values | `computed()`: lazy, cached, glitch-free | Operators (`map`, `combineLatest`) |
| Time and async | Not built in | Debounce, cancel, retry, throttle, combine |
| Cleanup | Automatic | You unsubscribe (or `toSignal`, `async` pipe) |
| Change detection | Tells Angular exactly what changed | Needs `async` pipe or conversion |

**Rule of thumb:** use **signals for state** (what the UI shows) and **RxJS for events and async flows** (what happens over time). Convert between them at the boundary with `toSignal()` and `toObservable()`.

## 1. Derived state: signals are glitch-free

Consider a full name built from a first and a last name. Update both:

```ts
// RxJS
const first$ = new BehaviorSubject('Subhankar');
const last$ = new BehaviorSubject('Roy');
combineLatest([first$, last$]).pipe(map(([f, l]) => `${f} ${l}`)).subscribe(render);
first$.next('Amit');
last$.next('Das');

// Signals
const first = signal('Subhankar');
const last = signal('Roy');
const fullName = computed(() => `${first()} ${last()}`);
first.set('Amit');
last.set('Das');
```

```text
RxJS combineLatest emitted: ["Subhankar Roy", "Amit Roy", "Amit Das"]
signals computed read:      ["Subhankar Roy", "Amit Das"]   (2 computations)
```

RxJS emitted **"Amit Roy"**, a name that never existed, because each subject emits as soon as it changes. Signals only computed the value when it was read, after both updates.

It gets worse when two derived values come from **the same source** (the "diamond" problem):

```ts
const price$ = new BehaviorSubject(100);
const tax$ = price$.pipe(map((p) => p * 0.18));
const total$ = price$.pipe(map((p) => p * 1.18));
combineLatest([tax$, total$]).pipe(map(([t, tot]) => `tax ${t} / total ${tot}`)).subscribe(render);
price$.next(200);
```

```text
RxJS:    ["tax 18 / total 118", "tax 36 / total 118", "tax 36 / total 236"]
signals: ["tax 18 / total 118", "tax 36 / total 236"]
```

From a single price change, RxJS emitted an **inconsistent state**: tax for 200 with the total for 100. If that triggered a validation, an API call or an analytics event, it would have used wrong data. The signal version never produced it.

This is the strongest reason to use signals for UI state: **derived values are always consistent**.

## 2. computed() is lazy and cached

```ts
const items = signal(Array.from({ length: 10_000 }, (_, i) => i));
const evens = computed(() => items().filter((n) => n % 2 === 0));
```

```text
runs before any read:          0
runs after 1,000 reads:        1
runs after update (not read):  1
runs after next read:          2
RxJS map, 3 subscribers (no share): 3 runs
```

A `computed()` runs only when someone reads it, caches the result, and recomputes only after a dependency changes, and then only on the next read. A thousand template reads cost one filter.

In RxJS, each subscriber runs the pipeline separately unless you add `shareReplay`. That is why reading a `computed()` signal in a template is safe, while calling a function in a template is not (see [Angular Performance Optimization](/blog/angular-performance-optimization)).

## 3. Equality: know what counts as "changed"

```text
signal: set the same string             -> recomputes: 0
signal: set a new object, same content  -> recomputes: 1
BehaviorSubject: next the same value    -> extra emissions: 1
```

Signals skip notifications when the new value is equal to the old one, using `Object.is` by default. A `BehaviorSubject` emits every `next()`, unless you add `distinctUntilChanged()`.

Note the second line. A new object is a different reference, even if its content is the same. Update objects immutably (`user.set({ ...user(), name })`), and pass a custom `equal` function when you need content-based comparison:

```ts
const filters = signal<Filters>(initial, {
  equal: (a, b) => a.status === b.status && a.city === b.city,
});
```

The reverse mistake is more common. Mutating an object inside a signal (`user().name = 'x'`) changes nothing as far as Angular is concerned, because the reference did not change. Use `set` or `update` with a new object.

## 4. Where RxJS is still the right tool

Signals have no concept of time. They can't express:

- **Wait until the user stops typing** (`debounceTime`)
- **Cancel the previous request** (`switchMap`)
- **Ignore clicks while saving** (`exhaustMap`)
- **Retry with backoff** (`retry`)
- **Poll every 30 seconds**, or combine WebSocket messages, router events and timers

In the RxJS operators post, a search box sent **12 requests without debouncing and 1 with it**, and `switchMap` was what stopped stale results from overwriting fresh ones. None of this has a signal equivalent, and writing it by hand with `effect()` and `setTimeout` brings back the bugs those operators solve.

## 5. Interop: toSignal and toObservable

Use each tool for what it does well, and convert at the edge:

```ts
@Component({
  template: `
    <input [value]="search()" (input)="search.set($any($event.target).value)" />
    @for (o of results(); track o.id) { <order-row [order]="o" /> }
    <p>{{ count() }} results</p>
  `,
})
export class OrderSearch {
  private api = inject(OrdersApi);

  search = signal('');                     // state: signal

  results = toSignal(                      // async flow: RxJS
    toObservable(this.search).pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap((t) => this.api.search(t).pipe(catchError(() => of([])))),
    ),
    { initialValue: [] as Order[] },
  );

  count = computed(() => this.results().length); // derived state: signal
}
```

- **`toSignal(obs$)`** subscribes immediately, unsubscribes when the component is destroyed, and gives you a synchronous value for the template. Provide `initialValue`, or the signal starts as `undefined`.
- **`toObservable(sig)`** emits when the signal changes. It emits asynchronously, after the signal settles, so several synchronous `set` calls produce one emission.

Both must run in an injection context (a constructor or field initializer), or receive an `injector` option.

## 6. Newer signal APIs worth knowing

**`input()`, `output()` and `model()`** replace `@Input`, `@Output` and two-way binding with signal-based APIs, so `computed()` can depend directly on inputs:

```ts
order = input.required<Order>();
total = computed(() => this.order().items.reduce((s, i) => s + i.price * i.qty, 0));
```

**`linkedSignal()`** is a writable signal that resets when its source changes. A common case is a selection that must reset when the list of options changes:

```ts
options = signal(['Kolkata', 'Delhi']);
selected = linkedSignal(() => this.options()[0]);
```

```text
user picked Delhi; list changed -> selected is now Mumbai
```

The user could change `selected`, and when `options` changed to `['Mumbai', 'Pune']`, it reset to the new first option automatically. Before `linkedSignal`, this needed an `effect()` that wrote to another signal, which is easy to get wrong.

**`resource()` and `httpResource()`** load async data into signals (value, loading state and error), reloading when the signals they depend on change. They suit simple "load data for these parameters" cases. For debouncing, cancellation rules or complex orchestration, use RxJS with `toSignal`.

## 7. Use effect() sparingly

`effect()` runs side effects when signals change. It is the most misused signal API:

```ts
// avoid: deriving state in an effect
effect(() => this.fullName.set(`${this.first()} ${this.last()}`));

// do: derive with computed
fullName = computed(() => `${this.first()} ${this.last()}`);
```

Good uses of `effect()`: syncing to `localStorage`, logging and analytics, or calling a non-Angular library (a chart, a map). If you're writing to a signal inside an effect, you probably want `computed()` or `linkedSignal()` instead.

## Is performance a reason to switch?

Not on its own. I measured one million updates of a value plus a read of a doubled value:

```text
signals              67–72 ms
BehaviorSubject+map  51–55 ms
```

Both are well under 0.1 µs per update, and neither will be your bottleneck. The real performance benefit of signals is in **change detection**: Angular knows exactly which components read a changed signal, which makes zoneless, `OnPush`-by-default apps efficient. The benefit is in rendering, not in the reactive primitive itself.

## A practical migration plan

You don't need a rewrite. In an existing app:

1. **New components:** use `input()`, `output()`, signals for local state and `computed()` for derived values.
2. **Replace `BehaviorSubject` state in services** with signals, exposing them read-only:
   ```ts
   private readonly _cart = signal<CartItem[]>([]);
   readonly cart = this._cart.asReadonly();
   readonly count = computed(() => this._cart().length);
   add(item: CartItem) { this._cart.update((c) => [...c, item]); }
   ```
3. **Replace `async` pipes and manual subscriptions** in templates with `toSignal()` where it simplifies the code.
4. **Keep RxJS** for HTTP orchestration, search, polling, WebSockets and anything involving time.
5. **Don't convert back and forth** inside one flow. Pick the boundary once: RxJS for the async pipeline, a signal at the end.

Angular's migration schematics can convert `@Input`/`@Output` and queries to signal APIs (`ng generate @angular/core:signal-input-migration` and related), which handles most of the mechanical work.

## Decision guide

| Situation | Use |
| --- | --- |
| Component state, form UI state, toggles | `signal()` |
| Value derived from other state | `computed()` |
| Writable value that resets when a source changes | `linkedSignal()` |
| Shared app state in a service (cart, user, settings) | Signals, read-only outside the service |
| Search box, typeahead | RxJS (`debounceTime` + `switchMap`), then `toSignal` |
| Submit / save | RxJS `exhaustMap` |
| WebSockets, polling, timers, router events | RxJS |
| Simple data loading by parameters | `resource()` / `httpResource()` or RxJS + `toSignal` |
| Side effects (storage, logging, third-party widgets) | `effect()` |

## Interview questions: quick answers

**Are signals replacing RxJS in Angular?**
No. Signals manage synchronous state and drive change detection. RxJS handles async events over time. Angular provides `toSignal` and `toObservable` so they work together.

**What is the difference between a signal and a BehaviorSubject?**
Both hold a current value. A signal is read synchronously, tracks dependencies automatically, skips equal values, and needs no unsubscribe. A `BehaviorSubject` is an observable: you subscribe, it emits on every `next()`, and it composes with RxJS operators.

**What does glitch-free mean?**
A derived value never shows an inconsistent intermediate state. When several dependencies change, `computed()` recalculates once, from the latest values, when read. `combineLatest` can emit for each individual change, including mixed states.

**Is computed() lazy?**
Yes. It runs only when read, caches the result, and recomputes on the next read after a dependency changes.

**When should you use effect()?**
For side effects outside Angular's reactive graph, such as storage, logging or third-party libraries. Not for deriving state; use `computed()` or `linkedSignal()` for that.

**What does toSignal() do?**
It subscribes to an observable, exposes the latest value as a signal, and unsubscribes when the injection context (usually the component) is destroyed.

## Summary

Measured on Angular 22 and RxJS 7.8:

- `combineLatest` emitted a **name that never existed** ("Amit Roy") and an **inconsistent tax/total pair**; `computed()` did not.
- `computed()` ran **once for 1,000 reads** and only recomputed when read after a change.
- Signals skipped an update with the **same value**; `BehaviorSubject` emitted it again.
- Raw speed is **not** the reason to switch: both handled a million updates in under 75 ms.

Use **signals for state, RxJS for time**, and convert at the boundary.

If you are hiring for [Angular](/expertise/angular) or [MEAN stack](/expertise/mean-stack) roles, [get in touch](/#contact).
