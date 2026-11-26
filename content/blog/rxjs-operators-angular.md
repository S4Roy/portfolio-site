---
title: RxJS Operators in Angular: switchMap, mergeMap, concatMap and exhaustMap Explained
description: The RxJS operators that matter in real Angular apps, with measured outputs: switchMap vs mergeMap vs concatMap vs exhaustMap, debounceTime, shareReplay, catchError and retry.
date: 2026-11-26
tags: Angular, RxJS, Interview
keyword: rxjs operators angular
draft: false
---

RxJS has more than 100 operators, but a real Angular application uses about ten of them most of the time. Choosing the wrong one rarely causes an error. Instead you get quiet bugs: search results that flicker back to an old query, an order saved twice, an API called three times on page load, or a search box that stops working after one failed request.

This guide covers the operators that cause, and fix, those bugs. Each example was run with **RxJS 7.8** against a fake API with controlled delays, and the outputs below are the actual results.

## The four flattening operators

Most RxJS questions come down to one situation: **an event triggers a request**. A keystroke triggers a search, a click triggers a save, a route change triggers a load. Each event produces an inner observable (the HTTP call), and you have to decide what happens when a new event arrives while the previous request is still running.

That decision is the whole difference between `mergeMap`, `concatMap`, `switchMap` and `exhaustMap`.

The test: a user types `a`, `ab`, `abc`, 50 ms apart. The API is slowest for the oldest query (`a` takes 300 ms, `ab` 100 ms, `abc` 200 ms), which happens all the time in real networks.

```ts
this.search$.pipe(xxxMap((term) => this.api.search(term))).subscribe(show);
```

```text
mergeMap    requests 3
   153ms results for "ab"
   301ms results for "a"      <- stale result arrives after a newer one
   302ms results for "abc"
concatMap   requests 3
   302ms results for "a"
   403ms results for "ab"
   605ms results for "abc"    <- correct, but the user waits 605 ms
switchMap   requests 3 (2 cancelled)
   305ms results for "abc"    <- only the latest query
exhaustMap  requests 1
   301ms results for "a"      <- newer queries were ignored
```

| Operator | When a new event arrives while busy | Use it for |
| --- | --- | --- |
| `mergeMap` | Runs both in parallel | Independent work where order does not matter |
| `concatMap` | Queues it until the previous one finishes | Writes that must happen in order |
| `switchMap` | Cancels the previous one | Search, filters, route parameters: only the latest matters |
| `exhaustMap` | Ignores it until the current one finishes | Submit buttons, login, refresh |

With `mergeMap`, the screen showed results for `ab`, then `a`, then `abc`. If `a` had been slowest of all, the user would be looking at results for `a` while the box says `abc`. This is the most common RxJS bug in search screens.

With `switchMap`, Angular's `HttpClient` also **aborts** the cancelled HTTP requests, so the browser stops waiting for them.

## Search boxes: debounceTime + distinctUntilChanged + switchMap

`switchMap` fixes stale results, but it still sends a request for every keystroke. Test: typing `angular 22` at a normal speed (80 ms per key), then deleting the last character and typing it again:

```text
no debounce                      requests: 12
debounceTime(300)                requests: 2
debounce + distinctUntilChanged  requests: 1
```

`debounceTime(300)` waits until the user pauses for 300 ms. `distinctUntilChanged()` drops the second request, because after the delete and retype, the term was the same as before.

```ts
results = toSignal(
  this.searchControl.valueChanges.pipe(
    map((term) => term.trim()),
    debounceTime(300),
    distinctUntilChanged(),
    switchMap((term) =>
      term.length < 2
        ? of([])
        : this.api.search(term).pipe(catchError(() => of([]))),
    ),
  ),
  { initialValue: [] },
);
```

This is the standard search pipeline, and every operator in it has a job. The `catchError` placement is important, as the error section below shows.

## Submit buttons: exhaustMap

A user double-clicks Save, or clicks again because nothing seemed to happen. Test: five clicks within 200 ms, where saving takes 500 ms:

```text
mergeMap    saves sent: 5, last finished at  666ms
concatMap   saves sent: 5, last finished at 2507ms
exhaustMap  saves sent: 1, last finished at  502ms
```

`mergeMap` sent five save requests in parallel. For "create order" or "make payment", that means five orders. `concatMap` sent five one after another. `exhaustMap` sent exactly one and ignored clicks while it was running.

```ts
private save$ = new Subject<OrderForm>();

constructor() {
  this.save$
    .pipe(
      exhaustMap((form) => this.api.createOrder(form)),
      takeUntilDestroyed(),
    )
    .subscribe((order) => this.router.navigate(['/orders', order.id]));
}
```

Also disable the button while saving, for clear feedback. But do not rely only on the frontend. A slow network or a retry can still send the same request twice, so the backend should be idempotent too. [How to Prevent Duplicate Payments in Node.js](/blog/prevent-duplicate-payments-nodejs) covers the server side.

## Sharing one request: shareReplay

Every subscription to an HTTP observable sends a **new request**. If the header, sidebar and profile page all subscribe to `currentUser$`, you get three identical calls. Test: three subscribers at once, then one more 200 ms later:

```text
plain                                       HTTP calls: 4
shareReplay({ bufferSize: 1, refCount: true }) HTTP calls: 2
shareReplay(1)                              HTTP calls: 1
```

```ts
@Injectable({ providedIn: 'root' })
export class UserService {
  private http = inject(HttpClient);

  readonly currentUser$ = this.http.get<User>('/api/me').pipe(shareReplay(1));
}
```

The difference between the two `shareReplay` versions surprises people:

- **`shareReplay(1)`** keeps the source subscription and its last value forever. The late subscriber got the cached user, with no new request. Good for data that rarely changes in a session (current user, settings, lookup lists).
- **`refCount: true`** unsubscribes from the source when the subscriber count drops to zero. In the test, the first three subscribers had finished (they used `take(1)`), so the late subscriber triggered a fresh request. Use it for streams that should stop when nobody is listening, such as polling or WebSockets.

For simple cached state in modern Angular, you can also load the value into a **signal** in the service and read it everywhere, which avoids the question entirely.

## Errors: where you put catchError matters

When an observable errors, it **completes and stops**. Test: four searches where the second one fails:

```text
catchError on outer stream   -> ["ok one","error shown"]   (stream completed: search box is dead)
catchError inside switchMap  -> ["ok one","error shown","ok three","ok four"]
```

```ts
// wrong: one failed request kills the whole search stream
this.term$.pipe(
  switchMap((t) => this.api.search(t)),
  catchError(() => of([])),
);

// right: handle the error on the inner request; the outer stream keeps running
this.term$.pipe(
  switchMap((t) => this.api.search(t).pipe(catchError(() => of([])))),
);
```

In the first version, the outer stream itself errored, `catchError` replaced it with one value, and then it completed. The searches for `three` and `four` were never sent. The user sees a search box that silently stopped working until they reload the page.

**Rule:** inside a long-lived stream (search, clicks, route params), catch errors **inside** the flattening operator.

## Retrying with backoff

For temporary failures (a 503 during a deployment, a flaky mobile connection), retry a few times with an increasing delay:

```ts
this.http.get('/api/report').pipe(
  retry({ count: 3, delay: (_error, attempt) => timer(100 * 2 ** (attempt - 1)) }),
);
```

Test: an API that fails twice, then succeeds:

```text
ok after 3 attempts at 303ms   (waited 100 ms, then 200 ms)
```

Retry only **safe** requests (GET, or writes protected by an idempotency key). Retrying a non-idempotent POST can create duplicates. Don't retry 4xx errors such as 401 or 422: they will fail the same way every time. You can check the error inside `delay` and rethrow it to stop retrying.

## Combining streams

| Operator | Emits | Typical use |
| --- | --- | --- |
| `forkJoin([a$, b$])` | Once, when **all** complete, with the last values | Load several API calls in parallel for a page |
| `combineLatest([a$, b$])` | Whenever **any** emits, after each has emitted once | Filters + sort + page → query |
| `withLatestFrom(b$)` | When the source emits, with the latest value of `b$` | On click, read the current form state |

```ts
// load a dashboard in parallel; the page waits for the slowest call
forkJoin({ orders: this.api.orders(), stats: this.api.stats() });
```

`forkJoin` never emits if one of its observables never completes (a `Subject`, a `valueChanges` stream), and if any input errors, the whole `forkJoin` errors and you lose the other results, unless you catch errors on each input.

## Unsubscribing

An HTTP observable completes after one response, but streams like `valueChanges`, `interval` and router events do not. A component that subscribes to them without cleanup keeps running after it is destroyed.

In modern Angular, prefer, in this order:

1. **`toSignal()`** or the **`async` pipe**: they unsubscribe automatically.
2. **`takeUntilDestroyed()`** for manual `subscribe()` calls in components and services.
3. `take(1)` or `first()` when you need exactly one value.

```ts
constructor() {
  this.route.paramMap
    .pipe(
      map((p) => p.get('id')!),
      switchMap((id) => this.api.getOrder(id)),
      takeUntilDestroyed(), // keep it last
    )
    .subscribe((order) => this.order.set(order));
}
```

Put `takeUntilDestroyed()` last, so it unsubscribes from everything above it.

## RxJS and signals

Angular now uses signals for state, and RxJS remains the better tool for **events over time**: debouncing, cancelling, retrying and combining async sources. They work well together:

- Keep component state in **signals**.
- Use RxJS for **async flows**: search, polling, WebSockets, request orchestration.
- Convert at the edges with **`toSignal()`** (observable to signal) and **`toObservable()`** (signal to observable).

```ts
search = signal('');
results = toSignal(
  toObservable(this.search).pipe(
    debounceTime(300),
    switchMap((term) => this.api.search(term).pipe(catchError(() => of([])))),
  ),
  { initialValue: [] },
);
```

[How to Handle Large Datasets in Angular](/blog/angular-large-datasets) uses this pattern to drive server-side pagination.

## Cheat sheet

| Situation | Operator |
| --- | --- |
| Search box, filters, route param → load data | `debounceTime` + `distinctUntilChanged` + `switchMap` |
| Save, submit, login, pay | `exhaustMap` (and an idempotent backend) |
| Writes that must run in order | `concatMap` |
| Independent parallel work | `mergeMap` (limit concurrency with its second argument) |
| Several API calls for one page | `forkJoin` |
| Recompute when any input changes | `combineLatest` |
| Same data used by many components | `shareReplay(1)` or a signal in a service |
| Handle a failed request | `catchError` **inside** the flattening operator |
| Temporary failures | `retry({ count, delay })` |
| Cleanup | `toSignal`, `async` pipe, `takeUntilDestroyed` |

## Interview questions: quick answers

**What is the difference between switchMap, mergeMap, concatMap and exhaustMap?**
They differ in what happens when a new value arrives while an inner observable is still running. `switchMap` cancels the previous one, `mergeMap` runs both in parallel, `concatMap` queues the new one, and `exhaustMap` ignores the new one.

**Which operator should you use for a search box?**
`switchMap`, usually after `debounceTime` and `distinctUntilChanged`, so only the latest query's results are shown and older requests are cancelled.

**Which operator prevents duplicate form submissions?**
`exhaustMap`. It ignores new clicks until the current request finishes.

**Why did my stream stop working after an error?**
An error completes the observable. If `catchError` is on the outer stream, the stream ends after the first error. Put `catchError` on the inner request, inside the flattening operator.

**What is the difference between shareReplay(1) and refCount: true?**
`shareReplay(1)` keeps the source subscription and caches the last value even with no subscribers. With `refCount: true`, it unsubscribes from the source when the last subscriber leaves, and a new subscriber starts a new subscription.

**What is the difference between forkJoin and combineLatest?**
`forkJoin` emits once, when all inputs complete. `combineLatest` emits every time any input emits, once every input has emitted at least once.

**Are signals replacing RxJS?**
No. Signals are for synchronous state and change detection. RxJS is for async events over time. Modern Angular apps use both and convert between them with `toSignal` and `toObservable`.

## Summary

- Measured with RxJS 7.8: `mergeMap` showed a **stale search result**, `switchMap` showed only the latest.
- `exhaustMap` turned **5 save requests into 1**.
- `debounceTime` + `distinctUntilChanged` reduced **12 search requests to 1**.
- `shareReplay(1)` reduced **4 HTTP calls to 1**.
- `catchError` on the outer stream **killed the search box** after one error; inside `switchMap`, it kept working.

Pick the operator by asking one question: *what should happen when a new event arrives while the last one is still running?*

If you are hiring for [Angular](/expertise/angular) or [MEAN stack](/expertise/mean-stack) roles, [get in touch](/#contact).
