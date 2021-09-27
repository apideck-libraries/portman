import Dot from 'dot-object'
import { isObject } from './isObject'

/**
 * Method to set the value of a nested property from an object by passing a path notation
 * @param objectOrArray the nested object
 * @param path the path definition (example: website[0].url)
 * @param newValue the new value
 */
export const setByPath = (
  objectOrArray: Record<string, unknown> | Record<string, unknown>[],
  path: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-module-boundary-types
  newValue: any
): Record<string, unknown> | Record<string, unknown>[] => {
  if (!isObject(objectOrArray) && !Array.isArray(objectOrArray)) return objectOrArray

  const dot = new Dot() // Initiate new dot-object
  const arrayPathCheck = path.endsWith(']')
  const indexKey = path.match(/\d+/g)?.[0]

  if (Array.isArray(newValue)) {
    dot.keepArray = true
  }

  // Handle array of objects
  if (Array.isArray(objectOrArray)) {
    // Handle array definition (example: [0])
    if (indexKey && objectOrArray[indexKey] && !path.includes('.') && arrayPathCheck) {
      objectOrArray[indexKey] = newValue
      return objectOrArray
    }

    // Handle array definition (example: [0].websites[1])
    if (indexKey && objectOrArray[indexKey] && path.includes('.') && arrayPathCheck) {
      const item = objectOrArray[indexKey]
      const subPath = path.substring(path.indexOf('.') + 1)
      if (subPath) {
        objectOrArray[indexKey] = dot.str(subPath, newValue, item)
        return objectOrArray
      }
    }

    // Handle array definition with prop (example: [1].websites[1].url)
    const flatInput = dot.dot(objectOrArray)
    if (flatInput[path] && !arrayPathCheck) {
      flatInput[path] = newValue
      const res = dot.object(flatInput)
      return res[Object.keys(res)[0]]
    }
  }

  // Update property from object
  return dot.str(path, newValue, objectOrArray)
}
