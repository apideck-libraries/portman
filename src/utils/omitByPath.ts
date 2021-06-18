import dot from 'dot-object'
import { isObject } from './isObject'

/**
 * Method to remove a nested property from an object by passing a path notation
 * @param obj the nested object
 * @param path the path definition (example: website[0].url)
 */
export const omitByPath = (obj: Record<string, unknown>, path: string): Record<string, unknown> => {
  if (!isObject(obj)) return obj

  dot.delete(path, obj)
  return obj
}
