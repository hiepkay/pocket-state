export default (value: unknown): value is Array<unknown> =>
  Array.isArray(value);
