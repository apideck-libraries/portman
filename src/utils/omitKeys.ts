/* eslint-disable @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any*/
export const omitKeys = (obj: any, keys: string[]): any => {
  return obj !== Object(obj)
    ? obj
    : Array.isArray(obj)
    ? obj.map(item => omitKeys(item, keys))
    : Object.keys(obj)
        .filter(k => !keys.includes(k))
        .reduce((acc, x) => Object.assign(acc, { [x]: omitKeys(obj[x], keys) }), {})
}
