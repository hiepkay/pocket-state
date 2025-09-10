import {useCallback, useRef, useSyncExternalStore} from 'react';
import type {Store} from './type';
import {shallow} from '../utils/shallowEqual';

type EqualityFn<S> = (a: any, b: any) => boolean;

// Overloads
export function useStore<T>(store: Store<T>): T;
export function useStore<T, S>(
  store: Store<T>,
  selector: (state: T) => S,
  equalityFn?: EqualityFn<S>,
): S;

export function useStore<T, S = T>(
  store: Store<T>,
  selector?: (state: T) => S,
  equalityFn: EqualityFn<S> = shallow,
): S {
  const sel = selector ?? ((s: T) => s as unknown as S);

  const sliceRef = useRef<S>(sel(store.getValue()));
  const eqFn = selector ? equalityFn : Object.is;

  const subscribe = useCallback((onChange: () => void) => {
    return store.subscribe(sel, (_prev: S, next: S) => {
      if (!eqFn(sliceRef.current, next)) {
        sliceRef.current = next;
        onChange();
      }
    });
  }, []);

  const getSnapshot = useCallback(() => {
    const next = sel(store.getValue());
    if (!eqFn(sliceRef.current, next)) {
      sliceRef.current = next;
    }
    return sliceRef.current;
  }, []);

  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
