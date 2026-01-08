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
- ⚖️ EqualityFn – Custom comparator (shallow by default, can use deep/custom).
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

// With selector
const unsubCount = counterStore.subscribe(
  s => s.count,
  count => console.log('Count changed:', count),
);

unsub();
unsubCount();
```

---

## 🎣 Custom Hooks with `createHook`

A utility to generate custom, type-safe hooks for your stores —  
allowing you to access the store API without re-renders,  
or subscribe to selected state slices with precise control.

```ts
import {createHook} from 'pocket-state';
import {counterStore} from './counterStore';

// Generate a custom hook
const useCounter = createHook(counterStore);

// Access only store API (no re-render)
const {reset, setValue} = useCounter();

// Access selected state (with API), triggers re-render on changes
const {value: count, reset} = useCounter(state => state.count);
```

### 🧩 **React Example**

```tsx
import React from 'react';
import {Text, Button, View} from 'react-native';
import {createStore, createHook} from 'pocket-state';

// 1. Create your store
interface Counter {
  count: number;
}
const counterStore = createStore<Counter>({count: 0});

// 2. Create the custom hook
const useCounter = createHook(counterStore);

// 3. Use inside a React Native component
export function CounterComponent() {
  // Only gets API, no re-render
  const {reset} = useCounter();

  // Gets selected value + API, re-renders when count changes
  const {value: count, reset: reset2} = useCounter(state => state.count);

  return (
    <View>
      <Text>Count: {count}</Text>
      <Button
        title="Inc"
        onPress={() => counterStore.setValue(s => ({count: s.count + 1}))}
      />
      <Button title="Reset" onPress={reset} />
    </View>
  );
}
```

**Advantages:**

- **No accidental re-renders** when accessing only API methods.
- **Type-safe selectors** and API usage, with full IDE support.
- **Simple migration path** for those coming from Zustand or similar libraries.

---

## ⚖️ EqualityFn

By default, `createStore` uses a shallow equality function to detect changes.  
You can override this by providing a custom comparator as the 3rd argument:

```ts
import {createStore} from 'pocket-state';
import deepEqual from 'fast-deep-equal';

interface State {
  count: number;
  nested: {a: number; b: number};
}

// shallow equality (default)
const store1 = createStore<State>({count: 0, nested: {a: 1, b: 2}});

// deep equality
const store2 = createStore<State>(
  {count: 0, nested: {a: 1, b: 2}},
  [],
  deepEqual,
);
```

This is useful when working with nested state objects and you want to avoid unnecessary re-renders.

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

Lightweight hook built on `useSyncExternalStore` that subscribes to your store and returns the selected slice.

### `createHook(store)` (React)

Generates a custom hook for your store.

- `hook()` → store API only, **no re-render**.
- `hook(selector)` → `{ value, ...api }`, re-renders when selected state changes.

---

## 📜 License

MIT

keywords: pocket-state, state-management, react, react-native, typescript, hooks, store, equalityFn
