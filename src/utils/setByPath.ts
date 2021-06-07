import dot from 'dot-object'
import { isObject } from './isObject'

/**
 * Method to set the value of a nested property from an object by passing a path notation
 * @param obj the nested object
 * @param path the path definition (example: website[0].url)
 * @param newValue the new value
 */
export const setByPath = (
  obj: Record<string, unknown>,
  path: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-module-boundary-types
  newValue: any,
  force = false
): Record<string, unknown> => {
  if (!isObject(obj)) return obj

  if (Array.isArray(newValue)) {
    dot.keepArray = true
  }

  const flatInput = dot.dot(obj)

  if (flatInput[path] || force) {
    flatInput[path] = newValue
  }

  return dot.object(flatInput)
}
