import {Draft} from 'immer';

interface FileList {
  readonly length: number;
  item(index: number): File | null;
  [index: number]: File;
}

/**
 * A callback invoked when an event is emitted with a payload of type `T`.
 * Keep listeners pure and fast. Long-running side effects should live in
 * middleware/effects instead of listeners.
 */
export interface Listener<T = unknown> {
  (prev: T, next: T): void;
}
/**
 * Immer-style mutation function used for "mutable-looking" updates.
 *
 * - Receives a `draft` (a Proxy of your state).
 * - You can mutate the draft; Immer will produce the next immutable state.
 * - You may return a new value instead of mutating the draft (less common).
 * - Can be async, but it's recommended to await first, then mutate, to avoid races.
 */
export type MutateFn<T> = (draft: Draft<T>) => void | T | Promise<void | T>;

/**
 * Store getter API.
 *
 * Usage:
 * ```ts
 * const all = getValues();          // → T (entire state)
 * const count = getValues('count'); // → T['count'] (one key)
 * ```
 *
 * Notes:
 * - Results are expected to be reference-stable when state hasn't changed,
 *   which helps React avoid unnecessary renders.
 * - If you want to support reading multiple keys at once, extend the type.
 */
export type UseStoreGet<T> = {
  (): T;
  <K extends keyof T>(key: K): T[K];
};
/**
 * Store setter API:
 * - Accepts a `patch` (partial) to shallow-merge into current state,
 *   or a function that receives the current state and returns a partial.
 *   The function may be async.
 *
 * Examples:
 * ```ts
 * setValue({ flag: true });
 * setValue(s => ({ count: s.count + 1 }));
 * setValue(async s => {
 *   const user = await fetchUser();
 *   return { user };
 * });
 * ```
 *
 * Notes:
 * - The store is responsible for equality checks and only emits on real changes.
 * - Multiple updates in the same tick may be coalesced (implementation-dependent).
 *
 * `immer()` (if implemented) is a convenience to enable Immer-style updates.
 * This type does not define its runtime behavior; see your implementation.
 */
export type UseStoreSet<T> = {
  (patch: Partial<T> | ((state: T) => Partial<T> | Promise<Partial<T>>)): void;
  immer(): void;
};

/**
 * Minimal pub/sub event emitter contract.
 *
 * Expected behavior:
 * - `on` registers a listener for an event name.
 * - `emit` broadcasts a payload to all listeners of that event.
 * - `off` removes a specific listener or all listeners for an event.
 * - `once` registers a listener that runs exactly once, then unregisters itself.
 * - `clear` removes listeners for all events.
 *
 * Implementation guidance:
 * - Snapshot listeners before emitting to stay safe if `on/off` happens during emit.
 * - `off(event, original)` should remove a `once` listener even if it's wrapped.
 */
export interface IEventEmitter {
  /** Register a listener for an event name. */
  on<T = any>(event: string, listener: Listener<T>): void;

  /** Emit an event with a payload. */
  emit<T = any>(event: string, payload: T): void;

  /**
   * Remove a listener or all listeners for an event.
   * Omit `listener` to remove all listeners for the event.
   */
  off<T = any>(event: string, listener?: Listener<T>): void;

  /** Register a one-time listener that auto-unregisters after the first emit. */
  once<T>(event: string, listener: Listener<T>): void;

  /** Remove all listeners for all events. */
  clear(): void;

  /** Get number of subscribe */
  getNumberOfSubscriber(event?: string): number;
}

/**
 * Reactive key-value store interface.
 * Supports:
 * - Reading current state (`getValues`)
 * - Updating via partials or functions (`setValue`)
 * - Immer-style updates (`setImmer`) when available
 * - Reset to the initial value (`reset`)
 * - Subscribing to the whole state or to a slice via a selector
 *
 * Important notes:
 * - Listeners are called only when the relevant data actually changes.
 * - `subscribe` returns an unsubscribe function — call it on unmount to avoid leaks.
 * - `subscribe` does **not** auto-invoke the listener initially (fits `useSyncExternalStore`);
 *   if you need an initial call, read the snapshot and invoke it yourself at the call site.
 */
export interface Store<T> {
  /**
   * Read the full state or a specific property by key.
   * @param key Optional key within the state.
   * @returns Without `key` → the full state `T`.
   *          With `key`    → the value `T[K]`.
   */
  getValue: UseStoreGet<T>;

  /**
   * Update state by shallow-merging `patch`, or by running a function
   * that returns a `patch`. The function may be async.
   */
  setValue(
    patch: Partial<T> | ((state: T) => Partial<T> | Promise<Partial<T>>),
    patchOptions?: {
      forced: boolean;
    },
  ): void;

  /**
   * Returns the store's initial state value.
   *
   * - For arrays and objects → returns a shallow clone to avoid external mutations.
   * - For primitive types → returns the value as-is.
   * - The returned value represents the original initial state, not the current state.
   */
  getInitialValue(): T;

  /**
   * Update state in Immer style.
   * @example
   * ```ts
   * store.setImmer(draft => {
   *   draft.user.name = 'Hiep';
   *   draft.items.push({ id: 'x' });
   * });
   * ```
   */
  setImmer(updater: (draft: Draft<T>) => void): void;

  /**
   * Resets the state to the initial value (`initialState`) with a new reference (shallow clone).
   *
   * - If no argument is provided → the state is reset to `initialState` (new reference).
   * - If `initialValue` is provided:
   *   - If it's an object/array → shallow-merge it into a clone of `initialState`.
   *   - If it's a primitive → replace the state entirely with that value.
   * - Always creates a new reference; only updates if the result is not shallow-equal to the current state.
   */
  reset(initialValue?: T | Partial<T>): void;

  /**
   * Subscribe to the entire state.
   * The listener is invoked **after commit** whenever state changes.
   * @returns Unsubscribe function.
   */
  subscribe(listener: Listener<T>): () => void;

  /**
   * Subscribe to a derived slice of the state.
   * The listener fires only when the selector's result changes.
   * @returns Unsubscribe function.
   */
  subscribe<S>(selector: (state: T) => S, listener: Listener<S>): () => void;

  /**
   * Checks whether the current state differs from the initial state.
   *
   * - For primitive types → compared using strict equality (`===`).
   * - For objects/arrays → compared using deep equality.
   * - Returns `true` if the state is modified, otherwise `false`.
   *
   * @example
   * ```ts
   * const store = createStore({ count: 0 });
   * store.isDirty(); // false
   *
   * store.setValue({ count: 1 });
   * store.isDirty(); // true
   * ```
   */
  isDirty(): boolean;

  /** Get number of subscriber for current store */
  getNumberOfSubscriber(): number;

  /** */
}

/**
 * Middleware that intercepts and transforms a `patch` before it is applied.
 *
 * Contract:
 * - Must call `next(patch)` to forward the update (similar to Redux middleware).
 * - Can read the current state via `getState()`.
 * - Useful for logging, validation, mapping, batching, devtools bridges, persistence, etc.
 *
 * @example Logging middleware:
 * ```ts
 * const logger: Middleware<State> = (next, get) => patch => {
 *   console.log('Before:', get());
 *   next(patch);
 *   console.log('After:', get());
 * };
 * ```
 */
export type Middleware<T> = (
  next: (patch: Partial<T>) => void,
  getState: () => T,
) => (patch: Partial<T>) => void;
