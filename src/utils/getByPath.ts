import dot from 'dot-object'
import { isObject } from './isObject'

/**
 * Method to get the value of a nested property from an object by passing a path notation
 * @param obj the nested object
 * @param path the path definition (example: website[0].url)
 * @param defaultValue
 */
export const getByPath = (
  obj: Record<string, unknown>,
  path: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  defaultValue: any | undefined = undefined
): string | Record<string, unknown> | undefined => {
  if (!isObject(obj)) return

  const flatInput = dot.dot(obj)
  if (flatInput[path]) return flatInput[path]

  const byPath = dot.pick(path, obj)
  if (byPath) return byPath

  return flatInput[path] || defaultValue
}
