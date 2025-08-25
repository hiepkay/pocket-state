// store.ts
import {IEventEmitter, Listener, Middleware, Store, UseStoreGet} from './type';
import {EventEmitter} from './event';
import {Draft, produce} from 'immer';
import {shallow} from './shallowEqual';

export function createStore<T>(
  initialState: T,
  middlewares: Middleware<T>[] = [],
  equalityFn?: (a: any, b: any) => boolean,
): Store<T> {
  const emitter: IEventEmitter = new EventEmitter();
  const _initialState = Array.isArray(initialState)
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
          prevSlice = slice;
          maybeListener(slice);
        }
      };
    } else {
      const listener: Listener<T> = selectorOrListener;
      let prev = state;
      wrapped = (next: T) => {
        if (!areEqual(next, prev)) {
          prev = next;
          listener(next);
        }
      };
    }

    emitter.on('state', wrapped);
    return () => emitter.off('state', wrapped);
  }

  function setValue(
    patch: Partial<T> | ((state: T) => Partial<T> | Promise<Partial<T>>),
  ): void {
    let resolved = typeof patch === 'function' ? patch(state) : patch;
    if (resolved instanceof Promise) {
      resolved
        .then(res => {
          if (res && typeof res === 'object') {
            setFn(res as Partial<T>);
          }
        })
        .catch(error => console.warn('[store.setValue] patch error:', error));
    } else {
      if (resolved && typeof resolved === 'object') {
        setFn(resolved as Partial<T>);
      }
    }
  }

  function setImmer(updater: (draft: Draft<T>) => void): void {
    try {
      const nextState = produce(state, updater);
      if (areEqual(state, nextState)) return;

      if (Array.isArray(state)) {
        setFn(nextState as unknown as Partial<T>);
        return;
      }
      const delta = {} as Partial<T>;
      let changed = false;
      for (const k in nextState as any) {
        const nv = (nextState as any)[k];
        const ov = (state as any)[k];
        if (nv !== ov) {
          (delta as any)[k] = nv;
          changed = true;
        }
      }
      for (const k in state as any) {
        if (!(k in (nextState as any))) {
          (delta as any)[k] = undefined;
          changed = true;
        }
      }
      if (changed) setFn(delta);
    } catch (e) {
      console.warn('[store.setImmer] error:', e);
    }
  }

  function reset(): void;
  function reset(initialValue?: T | Partial<T>): void;
  function reset(initialValue?: T | Partial<T>) {
    const isObj = (
      v: unknown,
    ): v is Record<string | symbol | number, unknown> =>
      typeof v === 'object' && v !== null;

    const cloneShallow = <U>(src: U): U => {
      if (Array.isArray(src)) return (src as any).slice();
      if (isObj(src)) return {...(src as any)} as U;
      return src;
    };

    let next = cloneShallow(initialState) as T;
    if (initialValue !== undefined) {
      if (Array.isArray(initialValue)) {
        next = (initialValue as any).slice();
      } else if (isObj(initialValue)) {
        Object.assign(next as any, initialValue);
      } else {
        const current = getValue();
        if (!Object.is(current as any, initialValue as any)) {
          setFn(initialValue as unknown as Partial<T>);
        }
        return;
      }
    }
    const current = getValue();
    if (!areEqual(current, next)) {
      setFn(next as unknown as Partial<T>);
    }
  }

  function getInitialValue(): T {
    if (Array.isArray(_initialState)) {
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
