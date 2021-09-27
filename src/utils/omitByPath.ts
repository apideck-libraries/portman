import Dot from 'dot-object'
import { isObject } from './isObject'

/**
 * Method to remove a nested property from an object by passing a path notation
 * @param objectOrArray the nested object or array
 * @param path the path definition (example: website[0].url)
 */
export const omitByPath = (
  objectOrArray: Record<string, unknown> | Record<string, unknown>[],
  path: string
): Record<string, unknown> | Record<string, unknown>[] => {
  if (!isObject(objectOrArray) && !Array.isArray(objectOrArray)) return objectOrArray

  const dot = new Dot() // Initiate new dot-object

  // Handle array of objects
  if (Array.isArray(objectOrArray)) {
    const indexKey = path.match(/\d+/g)?.[0]
    // Handle array definition (example: [0])
    if (indexKey && objectOrArray[indexKey] && !path.includes('.')) {
      objectOrArray.splice(Number(indexKey), 1)
      return objectOrArray
    }
    // Handle array definition (example: [0].websites)
    if (indexKey && objectOrArray[indexKey] && path.includes('.')) {
      const item = objectOrArray[indexKey]
      const subPath = path.substring(path.indexOf('.') + 1)
      if (subPath) {
        objectOrArray[indexKey] = omitByPath(item, subPath)
      }
      return objectOrArray
    }
  }

  // Remove property from object
  dot.delete(path, objectOrArray)
  return objectOrArray
}
