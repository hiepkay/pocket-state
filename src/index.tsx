import {createStore} from './globalState/store';
import {useStore} from './globalState/hooks';
import type {
  IEventEmitter,
  Listener,
  Middleware,
  MutateFn,
  UseStoreGet,
  UseStoreSet,
  Store,
} from './globalState/type';

export {createStore, useStore};
export type {
  IEventEmitter,
  Listener,
  Middleware,
  MutateFn,
  UseStoreGet,
  UseStoreSet,
  Store,
};
