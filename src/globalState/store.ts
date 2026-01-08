// store.ts
import {IEventEmitter, Listener, Middleware, Store, UseStoreGet} from './type';
import {EventEmitter} from '../utils/event';
import {Draft, produce} from 'immer';
import {shallow} from '../utils/shallowEqual';
import cloneObject from '../utils/cloneObject';
import isPromise from '../utils/isPromise';
import isArray from '../utils/isArray';

export function createStore<T>(
  initialState: T,
  middlewares: Middleware<T>[] = [],
  equalityFn?: (a: any, b: any) => boolean,
): Store<T> {
  const emitter: IEventEmitter = new EventEmitter();
  const _initialState = isArray(initialState)
    ? (initialState as any).slice()
    : initialState && typeof initialState === 'object'
    ? {...initialState}
    : initialState;
  let state = _initialState;

  const areEqual = equalityFn ?? shallow;

  const emitState = () => {
    emitter.emit('state', state);
  };

  function baseSet(delta: Partial<T>) {
    const nextState = Array.isArray(state)
      ? (delta as unknown as T)
      : {...state, ...delta};

    if (!areEqual(state, nextState)) {
      state = nextState;
      emitState();
    }
  }

  const setFn = middlewares.reduceRight(
    (next, mw) => mw(next, () => state),
    baseSet as (patch: Partial<T>) => void,
  );

  const getValue = ((key?: keyof T) => {
    if (key === undefined) return state;
    return state[key];
  }) as UseStoreGet<T>;

  function subscribe(selectorOrListener: any, maybeListener?: any) {
    let wrapped: Listener<any>;

    if (typeof maybeListener === 'function') {
      const selector: (s: T) => any = selectorOrListener;
      let prevSlice = selector(state);
      wrapped = (next: T) => {
        const slice = selector(next);
        if (!areEqual(slice, prevSlice)) {
          maybeListener(prevSlice, slice);
          prevSlice = slice;
        }
      };
    } else {
      const listener: Listener<T> = selectorOrListener;
      let prev = state;
      wrapped = (next: T) => {
        if (!areEqual(next, prev)) {
          listener(prev, next);
          prev = next;
        }
      };
    }

    emitter.on('state', wrapped);
    return () => emitter.off('state', wrapped);
  }

  function setValue(
    patch: Partial<T> | ((state: T) => Partial<T> | Promise<Partial<T>>),
    patchOptions?: {
      forced?: boolean;
    },
  ): void {
    const apply = (res: Partial<T>) => {
      if (!res || typeof res !== 'object') return;
      if (patchOptions?.forced) {
        state = isArray(state) ? (res as unknown as T) : {...state, ...res};
        emitState();
        return;
      }
      setFn(res);
    };

    try {
      const resolved = typeof patch === 'function' ? patch(state) : patch;

      if (isPromise(resolved)) {
        resolved
          .then(apply)
          .catch(error =>
            console.warn('[store.setValue] patch async error:', error),
          );
      } else {
        apply(resolved);
      }
    } catch (error) {
      console.warn('[store.setValue] patch error:', error);
    }
  }

  function setImmer(updater: (draft: Draft<T>) => void): void {
    try {
      const nextState = produce(state, updater);
      if (areEqual(state, nextState)) return;

      if (isArray(state)) {
        setFn(nextState as unknown as Partial<T>);
        return;
      }
      const delta = {} as Partial<T>;
      let changed = false;
      for (const k in nextState as any) {
        const nv = (nextState as any)[k];
        const ov = state[k];
        if (nv !== ov) {
          (delta as any)[k] = nv;
          changed = true;
        }
      }
      for (const k in state) {
        if (!(k in nextState)) {
          (delta as any)[k] = undefined;
          changed = true;
        }
      }
      if (changed) setFn(delta);
    } catch (e) {
      console.warn('[store.setImmer] error:', e);
    }
  }

  function reset(initialValue?: T | Partial<T>) {
    const isObj = (v: unknown): v is Record<any, any> =>
      typeof v === 'object' && v !== null;

    // 1️⃣ reset() → force về _initialState + force emit
    if (initialValue === undefined) {
      const cloned = cloneObject(_initialState) as T;
      state = cloned;
      emitState();
      return;
    }

    // 2️⃣ reset(value) → dựa trên _initialState
    let next = cloneObject(_initialState) as T;

    if (isArray(initialValue)) {
      next = initialValue.slice() as T;
    } else if (isObj(initialValue)) {
      Object.assign(next as any, initialValue);
    } else {
      if (!Object.is(getValue(), initialValue)) {
        setFn(initialValue as unknown as Partial<T>);
      }
      return;
    }
    if (!areEqual(getValue(), next)) {
      setFn(next as unknown as Partial<T>);
    }
  }

  function getInitialValue(): T {
    if (isArray(_initialState)) {
      return (_initialState as any).slice();
    }
    if (_initialState && typeof _initialState === 'object') {
      return {..._initialState};
    }
    return _initialState;
  }

  function isDirty() {
    return !areEqual(state, _initialState);
  }

  function getNumberOfSubscriber() {
    return emitter.getNumberOfSubscriber();
  }

  return {
    getValue,
    getInitialValue,
    setValue,
    setImmer,
    reset,
    subscribe,
    isDirty,
    getNumberOfSubscriber,
  };
}
