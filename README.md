# pocket-state

A lightweight, typed, and framework-agnostic state management library.  
Supports **selectors**, **middleware**, and **Immer-style updates**.  
Works seamlessly **inside React** with hooks or **outside React** with a simple API.

---

## ✨ Features

- ⚡ Minimal API – Simple and powerful.
- 🎯 Selectors – Subscribe to slices of state (store-level and hook-level).
- 🌀 Immer support – Mutate drafts safely with `setImmer`.
- 🔌 Framework-agnostic – Works in plain TS/JS and React.
- 🛠 Middleware – Logging, persistence, batching, devtools bridges, etc.
- 🔔 Event Emitter – Subscribe to store and custom events.
- ✅ TypeScript-first – Fully type-safe.

---

## 📦 Installation

```bash
npm install pocket-state
# or
yarn add pocket-state
# or
pnpm add pocket-state
```

---

## 🚀 Usage

### 1) Create a Store

```ts
import {createStore} from 'pocket-state';

interface Counter {
  count: number;
  flag: boolean;
}

export const counterStore = createStore<Counter>({
  count: 0,
  flag: false,
});
```

### 2) Read & Write

```ts
// Read full state
console.log(counterStore.getValue()); // { count: 0, flag: false }

// Read by key
console.log(counterStore.getValue('count')); // 0

// Update via partial
counterStore.setValue({flag: true});

// Update via function
counterStore.setValue(s => ({count: s.count + 1}));

// Async update
counterStore.setValue(async s => {
  const delta = await Promise.resolve(2);
  return {count: s.count + delta};
});
```

### 3) Immer Updates

📦 Install immer

```bash
npm install immer
# or
yarn add immer
# or
pnpm add immer
```

```ts
counterStore.setImmer(draft => {
  draft.count++;
  draft.flag = !draft.flag;
});
```

### 4) Reset & Dirty Check

```ts
counterStore.reset(); // reset to initial
counterStore.reset({count: 10}); // reset with override

console.log(counterStore.isDirty()); // true/false
```

### 5) Subscriptions (Outside React)

```ts
// Entire state
const unsub = counterStore.subscribe(state => {
  console.log('New state:', state);
});

// With selector (push model)
const unsubCount = counterStore.subscribe(
  s => s.count,
  count => console.log('Count changed:', count),
);

// cleanup
unsub();
unsubCount();
```

### 6) Using with React

```tsx
import React from 'react';
import {Text, Button, View} from 'react-native';
import {useStore} from 'pocket-state';
import {counterStore} from './counterStore';

export function CounterComponent() {
  const count = useStore(counterStore, s => s.count);

  return (
    <View>
      <Text>Count: {count}</Text>
      <Button
        title="Inc"
        onPress={() => counterStore.setValue(s => ({count: s.count + 1}))}
      />
    </View>
  );
}
```

---

## 🎯 Selectors

Selectors let you subscribe to **just part of the state**.

### React

```tsx
function FlagDisplay() {
  const flag = useStore(counterStore, s => s.flag);
  return <Text>Flag is {flag ? 'ON' : 'OFF'}</Text>;
}
```

### Non‑React

```ts
// Only listen to count changes
const off = counterStore.subscribe(
  s => s.count,
  c => console.log('Count updated:', c),
);
```

### Derived selectors (memoized)

For CPU‑heavy derivations, memoize a selector factory:

```ts
// simple memo (per invocation)
const makeExpensiveSelector = () => {
  let lastIn: number | undefined;
  let lastOut: number | undefined;
  return (s: {count: number}) => {
    if (lastIn === s.count && lastOut !== undefined) return lastOut;
    // expensive calculation here
    const out = s.count * 2;
    lastIn = s.count;
    lastOut = out;
    return out;
  };
};

const selectDouble = makeExpensiveSelector();
const double = useStore(counterStore, selectDouble);
```

> Tip: When selecting multiple fields, prefer returning an **object** and use a shallow equality helper at the hook, or do slice comparison at the store level.

---

## 🧪 Advanced Usage

### A) Multiple stores & cross‑updates

```ts
interface Auth {
  user?: {id: string; name: string} | null;
}
interface Todos {
  items: {id: string; title: string; done: boolean}[];
}

export const authStore = createStore<Auth>({user: null});
export const todoStore = createStore<Todos>({items: []});

// react to auth changes
authStore.subscribe(s => {
  if (!s.user) {
    todoStore.reset({items: []}); // clear todos on logout
  }
});
```

### B) Derived state without reselect libraries

```ts
type Cart = {items: {id: string; price: number; qty: number}[]};
export const cartStore = createStore<Cart>({items: []});

const selectTotal = (s: Cart) =>
  s.items.reduce((sum, it) => sum + it.price * it.qty, 0);

// React:
const total = useStore(cartStore, selectTotal);
```

### C) Persist middleware (conceptual)

```ts
import type {Middleware} from 'pocket-state';

const persist =
  <T>(key: string): Middleware<T> =>
  (next, get) =>
  patch => {
    next(patch);
    try {
      localStorage.setItem(key, JSON.stringify(get()));
    } catch {}
  };

const store = createStore({count: 0}, [persist('app:store')]);
```

### D) Logger middleware

```ts
const logger =
  (name = 'store'): Middleware<any> =>
  (next, get) =>
  patch => {
    const prev = get();
    console.log(`[${name}] prev`, prev);
    next(patch);
    console.log(`[${name}] next`, get());
  };
```

### E) Push vs Pull model

- **Push** (store filters): `store.subscribe(selector, listener)` fires **only when slice changes**.  
  Hook can be very light (keep last slice, no equality check).
- **Pull** (hook filters): store emits on any change; `useStore` runs `selector + equality`.  
  Useful if your store lacks selector subscriptions.

Pick **one** place to compare slices to avoid double work.

### F) Coalesced emits

If your store batches emits in a microtask, multiple updates in a burst trigger one notify:

```ts
for (let i = 0; i < 10; i++) {
  counterStore.setValue(s => ({count: s.count + 1}));
}
// With coalescing, subscribers run once.
```

### G) Using outside React (workers, Node, services)

```ts
// service.ts
import {counterStore} from './counterStore';

export function increment() {
  counterStore.setValue(s => ({count: s.count + 1}));
}

export function onCountChange(cb: (n: number) => void) {
  return counterStore.subscribe(s => s.count, cb);
}
```

### H) Testing

```ts
import {expect, test} from 'vitest';
import {counterStore} from './counterStore';

test('increments', () => {
  counterStore.reset({count: 0, flag: false});
  counterStore.setValue(s => ({count: s.count + 1}));
  expect(counterStore.getValue('count')).toBe(1);
});
```

### I) Type‑safe key reads with `getValue(key)`

```ts
const c = counterStore.getValue('count'); // typed as number
```

---

## 🧩 API Reference

### `Store<T>`

- `getValue(): T` and `getValue(key: K): T[K]`
- `setValue(patch | (state) => patch | Promise<patch>)`
- `setImmer((draft) => void)`
- `reset(next?: T | Partial<T>)`
- `subscribe(listener)` and `subscribe(selector, listener)`
- `isDirty()`
- `getInitialValue()`
- `getNumberOfSubscriber()`

### `useStore(store, selector?)` (React)

Lightweight hook built on `useSyncExternalStore` that subscribes to your store and returns the selected slice. It supports both full‑state and slice subscriptions.

---

## 📜 License

ISC — use it however you like.
