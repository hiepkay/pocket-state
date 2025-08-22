import {useCallback, useRef, useSyncExternalStore} from 'react';
import type {Store} from './type';

export function useStore<T, S = T>(
  store: Store<T>,
  selector?: (state: T) => S,
): S {
  const sliceRef = useRef<S>(
    selector ? selector(store.getValue()) : (store.getValue() as unknown as S),
  );

  const subscribe = useCallback(
    (onChange: () => void) => {
      if (selector) {
        return store.subscribe(selector, (nextSlice: S) => {
          sliceRef.current = nextSlice;
          onChange();
        });
      }
      return store.subscribe((next: T) => {
        sliceRef.current = next as unknown as S;
        onChange();
      });
    },
    [store, selector],
  );
  const getSnapshot = useCallback(() => sliceRef.current, []);

  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
