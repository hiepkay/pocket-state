import {createStore} from './globalState/store';
import {useStore} from './globalState/hooks';
import {createHook} from './globalState/create';
import type {
  IEventEmitter,
  Listener,
  Middleware,
  MutateFn,
  UseStoreGet,
  UseStoreSet,
  Store,
} from './globalState/type';

export {createStore, useStore, createHook};
export type {
  IEventEmitter,
  Listener,
  Middleware,
  MutateFn,
  UseStoreGet,
  UseStoreSet,
  Store,
};
