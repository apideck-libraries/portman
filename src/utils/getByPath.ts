import Dot from 'dot-object'
import { isObject } from './isObject'

/**
 * Method to get the value of a nested property from an object by passing a path notation
 * @param objectOrArray the nested object or array
 * @param path the path definition (example: website[0].url)
 * @param defaultValue
 */
export const getByPath = (
  objectOrArray: Record<string, unknown> | Record<string, unknown>[],
  path: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  defaultValue: any | undefined = undefined
): string | number | boolean | Record<string, unknown> | Record<string, unknown>[] | undefined => {
  if (!isObject(objectOrArray) && !Array.isArray(objectOrArray)) return objectOrArray

  // Return full root element
  if (path === '.') return objectOrArray

  const dot = new Dot() // Initiate new dot-object
  const arrayPathCheck = path.endsWith(']')
  const indexKey = path.match(/\d+/g)?.[0]

  // Handle array definition with prop (example: [1].websites[1].url)
  const flatInput = dot.dot(objectOrArray)
  if (flatInput[path] && !arrayPathCheck) return flatInput[path]

  // Handle array of objects
  if (Array.isArray(objectOrArray)) {
    // Handle array definition (example: [0])
    if (indexKey && objectOrArray[indexKey] && !path.includes('.')) {
      const res = objectOrArray.splice(Number(indexKey), 1)
      return res[Object.keys(res)[0]]
    }

    // Handle array definition (example: [0].websites)
    if (indexKey && objectOrArray[indexKey] && path.includes('.')) {
      const item = objectOrArray[indexKey]
      const subPath = path.substring(path.indexOf('.') + 1)
      if (subPath) {
        return getByPath(item, subPath)
      }
    }
  }

  // Handle object definition
  const byPath = dot.pick(path, objectOrArray)
  if (byPath) return byPath

  return flatInput[path] || defaultValue
}
