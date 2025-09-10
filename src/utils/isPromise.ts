export default (value: unknown): value is Promise<any> =>
  value instanceof Promise;
