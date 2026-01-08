import isArray from './isArray';
import isObject from './isObject';
import isPlainObject from './isPlainObject';

export default function cloneObject<T>(data: T): T {
  let copy: any;

  if (data instanceof Date) {
    copy = new Date(data);
  } else if (isArray(data) || isObject(data)) {
    copy = isArray(data) ? [] : Object.create(Object.getPrototypeOf(data));
    if (!isArray(data) && !isPlainObject(data)) {
      copy = data;
    } else {
      for (const key in data) {
        if (data.hasOwnProperty(key)) {
          copy[key] = cloneObject(data[key]);
        }
      }
    }
  } else {
    return data;
  }
  return copy;
}
