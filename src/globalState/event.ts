// event.ts
import {IEventEmitter, Listener} from './type';

export class EventEmitter implements IEventEmitter {
  private events = new Map<string, Set<Listener<any>>>();
  private onceWrappers = new Map<string, Map<Listener<any>, Listener<any>>>();

  on<T>(event: string, listener: Listener<T>): void {
    let set = this.events.get(event);
    if (!set) {
      set = new Set();
      this.events.set(event, set);
    }
    set.add(listener as unknown as Listener<any>);
  }

  once<T>(event: string, listener: Listener<T>): void {
    const wrapper: Listener<T> = payload => {
      this.off(event, wrapper);
      this.onceWrappers
        .get(event)
        ?.delete(listener as unknown as Listener<any>);
      listener(payload);
    };
    if (!this.onceWrappers.has(event)) {
      this.onceWrappers.set(event, new Map());
    }
    this.onceWrappers
      .get(event)!
      .set(
        listener as unknown as Listener<any>,
        wrapper as unknown as Listener<any>,
      );
    this.on(event, wrapper);
  }

  emit<T>(event: string, payload: T): void {
    const listeners = this.events.get(event);
    if (!listeners || listeners.size === 0) return;
    for (const l of listeners) {
      try {
        l(payload);
      } catch (error) {
        console.warn(`Error in listener for '${event}':`, error);
      }
    }
  }

  off<T>(event: string, listener?: Listener<T>): void {
    const set = this.events.get(event);
    if (!set) return;

    if (listener) {
      const wrapped = this.onceWrappers
        .get(event)
        ?.get(listener as unknown as Listener<any>);
      if (wrapped) {
        set.delete(wrapped as unknown as Listener<any>);
        this.onceWrappers
          .get(event)!
          .delete(listener as unknown as Listener<any>);
        if (this.onceWrappers.get(event)!.size === 0) {
          this.onceWrappers.delete(event);
        }
      } else {
        set.delete(listener as unknown as Listener<any>);
      }
      if (set.size === 0) {
        this.events.delete(event);
      }
      return;
    }
    this.events.delete(event);
    this.onceWrappers.delete(event);
  }

  clear(): void {
    this.events.clear();
    this.onceWrappers.clear();
  }

  getNumberOfSubscriber(event?: string): number {
    if (event) {
      return this.events.get(event)?.size ?? 0;
    }
    let total = 0;
    this.events.forEach(set => (total += set.size));
    return total;
  }
}
