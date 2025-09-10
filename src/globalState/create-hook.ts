import {useMemo} from 'react';
import {useStore} from './hooks';
import {Store} from './type';

/**
 * Creates a custom React hook for a store, giving you access to the store API
 * (such as reset, set, subscribe, etc.) and optionally, reactive state selection.
 *
 * Usage:
 *   // 1. Create your store instance (with custom API)
 *   const countStore = createStore({ count: 0, ... });
 *
 *   // 2. Create the hook
 *   const useCount = createHook(countStore);
 *
 *   // 3. Use inside component:
 *   // a) Access API only, never triggers re-render
 *   const { reset, setValue } = useCount();
 *
 *   // b) Access selected value (and API), triggers re-render only when value changes
 *   const { value, reset } = useCount(state => state.count);
 *
 * @template T The store state type.
 * @param store - The store instance implementing the Store<T> API.
 * @returns A custom hook with two usage patterns:
 *   1. `useHook()` – Returns store API only (no value, no render on state change).
 *   2. `useHook(selector)` – Returns `{ value, ...api }` where `value` is the selected state. Re-renders on selected value changes.
 */
export function createHook<T>(store: Store<T>) {
  const api = {...store};

  function useBoundStore(): typeof api;
  function useBoundStore<S>(selector: (state: T) => S): {value: S} & typeof api;
  function useBoundStore<S = T>(selector?: (state: T) => S) {
    if (!selector) return api;
    const value = useStore(store, selector);
    return useMemo(() => ({value, ...api}), [value]);
  }

  return useBoundStore;
}
