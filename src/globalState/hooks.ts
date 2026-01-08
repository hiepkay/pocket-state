import {useCallback, useRef, useSyncExternalStore} from 'react';
import type {Store} from './type';
import {shallow} from '../utils/shallowEqual';

type EqualityFn = (a: any, b: any) => boolean;

// Overloads
export function useStore<T>(store: Store<T>): T;
export function useStore<T, S>(
  store: Store<T>,
  selector: (state: T) => S,
  equalityFn?: EqualityFn,
): S;

export function useStore<T, S = T>(
  store: Store<T>,
  selector?: (state: T) => S,
  equalityFn: (a: S, b: S) => boolean = shallow,
): S {
  const sliceRef = useRef<S | null>(null);
  const selectorRef = useRef(selector);
  const equalityRef = useRef(equalityFn);

  selectorRef.current = selector;
  equalityRef.current = equalityFn;

  const getSnapshot = useCallback(() => {
    const state = store.getValue();
    const next = selectorRef.current
      ? selectorRef.current(state)
      : (state as unknown as S);

    if (
      sliceRef.current === null ||
      !equalityRef.current(sliceRef.current, next)
    ) {
      sliceRef.current = next;
    }

    return sliceRef.current;
  }, [store]);

  const subscribe = useCallback(
    (onChange: () => void) => {
      return store.subscribe(() => {
        onChange();
      });
    },
    [store],
  );

  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
