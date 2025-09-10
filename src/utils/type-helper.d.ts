// ---- Path utilities (zero-deps, RHF-like) ----
type Primitive =
  | string
  | number
  | boolean
  | bigint
  | symbol
  | null
  | undefined
  | Date
  | RegExp
  | Function;

type IsTuple<A extends readonly unknown[]> = number extends A['length']
  ? false
  : true;

type IndexKeys<T> = Extract<keyof T, string>;

/** All dot/bracket-style paths into T (e.g. "user.name", "items.0.qty") */
export type Path<T> = T extends Primitive
  ? never
  : T extends readonly (infer V)[]
  ? IsTuple<T> extends true
    ? {
        [I in Extract<keyof T, `${number}`>]: `${I}` | `${I}.${Path<V>}`;
      }[Extract<keyof T, `${number}`>]
    : `${number}` | `${number}.${Path<V>}`
  : {
      [K in IndexKeys<T>]: T[K] extends Primitive
        ? `${K}`
        : `${K}` | `${K}.${Path<T[K]>}`;
    }[IndexKeys<T>];

/** Value type at path P */
export type PathValue<
  T,
  P extends string,
> = P extends `${infer K}.${infer Rest}`
  ? K extends keyof T
    ? PathValue<T[K], Rest>
    : K extends `${number}`
    ? T extends readonly (infer V)[]
      ? PathValue<V, Rest>
      : never
    : never
  : P extends keyof T
  ? T[P]
  : P extends `${number}`
  ? T extends readonly (infer V)[]
    ? V
    : never
  : never;

/** Tuple of values for a tuple of paths */
export type PathValues<T, PS extends readonly string[]> = {
  [I in keyof PS]: PS[I] extends string ? PathValue<T, PS[I]> : never;
};
