---
title: React.memo, useMemo and useCallback: When They Actually Help (Measured in React 19)
description: When do React.memo, useMemo and useCallback improve performance? Measured re-render counts and timings in React 19, the inline-prop trap, context re-renders, and moving state down.
date: 2026-11-26
tags: React, Performance, Frontend
keyword: react usememo usecallback
draft: false
---

React developers often fall into one of two camps: wrap everything in `useMemo` and `useCallback` "for performance", or never use them at all. Neither is right. Memoization helps in specific situations, does nothing in others, and has a cost of its own.

This guide measures re-renders and render time in **React 19.2**, using a production build in Chromium. Each test performs 20 state updates with `flushSync`, so the time shown is React's actual synchronous render-and-commit work. I also ran each test with **4× CPU throttling**, which roughly simulates a mid-range phone.

## How re-rendering works

When a component's state changes, React re-renders that component **and all of its children**, whether or not their props changed. It doesn't compare props unless you ask it to. A re-render doesn't necessarily touch the DOM: React compares the new output with the old, and only updates what changed. But calling every component function and comparing their output still costs time.

## Test 1: a parent re-renders 1,000 rows

A search input and a list of 1,000 rows in the same component. Typing updates the input's state:

```jsx
function ProductPage() {
  const [text, setText] = useState('');
  return (
    <>
      <input value={text} onChange={(e) => setText(e.target.value)} />
      <ul>{items.map((item) => <Row key={item.id} item={item} />)}</ul>
    </>
  );
}
```

```text
                      row renders (20 keystrokes)   per keystroke   4x CPU
no memo                         20,000                 2.8 ms       6.3 ms
React.memo(Row)                      0                 0.5 ms       1.0 ms
```

Every keystroke re-rendered all 1,000 rows, even though none of them changed. Wrapping `Row` in `React.memo` made React compare props and skip every row:

```jsx
const Row = memo(function Row({ item }) {
  return <li>{item.name} {item.price}</li>;
});
```

Keep the scale in mind: even without memo, a keystroke took **2.8 ms**, well inside the 16 ms frame budget, and 6.3 ms on a throttled CPU. These rows are cheap. With heavier rows (images, nested components, formatting, charts) or several thousand of them, the same pattern becomes visible typing lag. That's when `memo` pays off.

## Test 2: the inline prop trap

The most common way `React.memo` silently stops working:

```jsx
<MemoRow item={item} onSelect={(id) => setSelected(id)} style={{ padding: 2 }} />
```

```text
memo + inline function/object props   20,000 renders   2.9 ms   4x CPU 6.7 ms
memo + useCallback/useMemo props           0 renders   0.6 ms   4x CPU 1.1 ms
```

**`memo` with inline props was as slow as no memo at all.** `React.memo` compares props by reference, and an arrow function or object literal written in JSX is a new value on every render. So every row saw a "changed" prop and re-rendered, and the comparison work came on top.

This is what `useCallback` and `useMemo` are for: keeping references stable so a memoized child can skip rendering.

```jsx
const onSelect = useCallback((id) => setSelected(id), []);
const rowStyle = useMemo(() => ({ padding: 2 }), []);

<MemoRow item={item} onSelect={onSelect} style={rowStyle} />
```

For constant objects, it's simpler still to define them **outside the component** (`const rowStyle = { padding: 2 }`), which needs no hook at all.

The key point: **`useCallback` on its own improves nothing.** It only helps when the function is passed to a component wrapped in `memo`, or used as a dependency of another hook. A `useCallback` around a handler passed to a plain `<button>` is pure overhead.

## Test 3: move state down instead

Often the best fix needs no memoization. Here, only the input needs the search text, so let the input own it:

```jsx
function SearchBox() {
  const [text, setText] = useState('');
  return <input value={text} onChange={(e) => setText(e.target.value)} />;
}

function ProductPage() {
  return (
    <>
      <SearchBox />
      <ul>{items.map((item) => <Row key={item.id} item={item} />)}</ul>
    </>
  );
}
```

```text
state moved down (no memo at all)   0 row renders   0.1 ms   4x CPU 0.1 ms
```

The fastest result of all. Typing re-renders only `SearchBox`, because the list is no longer a child of the component whose state changes. Before reaching for `memo`, ask: **does this state need to live this high up?**

A related pattern: pass expensive subtrees as `children`. Elements created by the parent's parent aren't re-created when the middle component's state changes.

## Test 4: useMemo for expensive calculations

A component filters 50,000 products. It also has an unrelated input:

```jsx
const top = products.filter((p) => p.price >= min).slice(0, 20);            // every render
const top = useMemo(() => products.filter((p) => p.price >= min).slice(0, 20), [min]); // only when min changes
```

```text
                          filter runs (20 updates)   per update   4x CPU
no useMemo, typing                   20                1.3 ms      2.3 ms
useMemo, typing                       0                0.2 ms      0.1 ms
useMemo, changing min                20                1.4 ms      2.4 ms
```

While typing, `useMemo` skipped the filter entirely. When `min` changed, it ran every time, as it should, so `useMemo` didn't make the calculation itself any faster. It **avoids repeating** a calculation when its inputs haven't changed.

Is 1.3 ms worth optimizing? On its own, barely. But calculations like this tend to grow (more data, sorting, grouping) and accumulate across components. Use `useMemo` when the calculation is measurably expensive (a common rule of thumb is around 1 ms or more), or when the result is passed to a memoized child or used as an effect dependency.

Don't `useMemo` cheap things like `a + b` or `items.length`. The hook's own bookkeeping costs more than the calculation.

## Test 5: context re-renders every consumer

```jsx
function App() {
  const [text, setText] = useState('');
  const [user] = useState('Subhankar');
  return (
    <UserContext.Provider value={{ user }}>   {/* new object every render */}
      <input value={text} onChange={(e) => setText(e.target.value)} />
      <Sidebar /> {/* 200 memoized components that read UserContext */}
    </UserContext.Provider>
  );
}
```

```text
inline context value { user }      4,000 consumer renders
useMemo(() => ({ user }), [user])      0 consumer renders
```

All 200 consumers were wrapped in `memo`, and all of them still re-rendered on every keystroke. **Context bypasses `memo`.** When the provider's `value` changes by reference, every component that reads that context re-renders. Since `{ user }` is a new object on each render of `App`, that's every keystroke, even though `user` never changed.

Fixes:

- **Memoize the value:** `const value = useMemo(() => ({ user, setUser }), [user])`.
- **Split contexts** so fast-changing values (form input, cursor position) don't share a provider with slow ones (current user, theme).
- **Keep fast-changing state out of context**, or use a store with selectors (Zustand, Redux) so components subscribe only to the slice they read.

## What about the React Compiler?

The **React Compiler** (stable since late 2025) automatically memoizes components and values at build time, so in many cases you don't need to write `memo`, `useMemo` or `useCallback` by hand. If your project uses it, the traps above (inline props, unstable context values) are largely handled for you.

It doesn't fix design problems, though. State that lives too high, giant contexts and rendering 10,000 rows are still slow with perfect memoization. The compiler also needs your components to follow the Rules of React (pure render, no mutation of props or state). I didn't test the compiler here, so measure your own app with React DevTools before and after enabling it.

## How to find re-render problems

- **React DevTools Profiler:** record an interaction and see which components rendered, how long each took, and why ("props changed", "hooks changed", "parent rendered"). Turn on "Highlight updates when components render" to see re-renders live.
- **Measure in a production build.** Development mode is much slower and double-invokes some functions in Strict Mode, which exaggerates everything.
- **Throttle the CPU** in Chrome DevTools (4× or 6×) to see what users on cheaper phones experience.
- Optimize what the profiler shows is slow, not every component.

## Decision guide

| Situation | Do this |
| --- | --- |
| State changes re-render a large, unrelated subtree | **Move state down**, or pass the subtree as `children` |
| A child is expensive and its props rarely change | `React.memo` |
| Passing functions or objects to a `memo` child | `useCallback` / `useMemo`, or define constants outside the component |
| Expensive calculation (≈1 ms+), inputs change rarely | `useMemo` |
| Context provider value is an object or function | `useMemo` the value; split fast and slow contexts |
| Long lists (thousands of rows) | Virtualize or paginate (memo can't fix DOM size) |
| Cheap components, cheap calculations | **Nothing.** Memoization adds overhead |
| Using the React Compiler | Let it memoize; fix structure and list size yourself |

The list-size row matters most. Memoization reduces how often components render; it doesn't reduce how much is on the page. The Angular side of this problem, with measurements, is in [How to Handle Large Datasets in Angular](/blog/angular-large-datasets), and the same techniques (pagination, virtual scrolling with libraries like TanStack Virtual) apply in React.

## Interview questions: quick answers

**When does a React component re-render?**
When its state changes, when its parent re-renders, or when a context it reads changes. Props changing isn't required: by default, children re-render whenever their parent does.

**What does React.memo do?**
It skips re-rendering a component when its props are shallowly equal (same references) to the previous render's props.

**What is the difference between useMemo and useCallback?**
`useMemo` caches a computed value. `useCallback` caches a function. `useCallback(fn, deps)` is equivalent to `useMemo(() => fn, deps)`.

**Why does my memoized component still re-render?**
Usually because a prop is a new reference each render (an inline function, object or array), because a context it reads changed, or because its own state changed.

**Should you wrap every function in useCallback?**
No. It only helps when the function is passed to a memoized child or used in a hook's dependency array. Otherwise it adds overhead and noise.

**Does useMemo make a calculation faster?**
No. It skips the calculation when its dependencies haven't changed. When they change, the calculation runs at full cost.

**How does context affect performance?**
Every consumer re-renders when the provider's value changes by reference, even consumers wrapped in `React.memo`. Memoize the value and split contexts by how often they change.

## Summary

Measured in React 19.2, production build:

- Typing re-rendered **20,000 rows** (1,000 rows × 20 keystrokes); `React.memo` cut that to **0**.
- `memo` with **inline props** did nothing: still 20,000 renders.
- **Moving state down** was the fastest fix: 0 renders, 0.1 ms, with no memoization.
- `useMemo` skipped a 50,000-item filter on unrelated updates, but didn't speed it up when its inputs changed.
- An inline context value re-rendered **200 memoized consumers** on every keystroke.
- Without any memoization, a keystroke took 2.8 ms, so for cheap components memoization is rarely urgent.

Fix the structure first, memoize what the profiler shows is expensive, and keep lists small.

If you are hiring for [React](/expertise/react), [Next.js](/expertise/nextjs) or [MERN stack](/expertise/mern-stack) roles, [get in touch](/#contact).
