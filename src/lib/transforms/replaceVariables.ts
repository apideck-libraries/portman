/* eslint-disable @typescript-eslint/no-explicit-any */
import { CollectionDefinition } from 'postman-collection'

export const replaceVariables = (
  obj: CollectionDefinition,
  dictionary: Record<string, unknown>
): any => {
  if (!obj || typeof obj !== 'object' || Object.keys(dictionary)?.length === 0) return obj

  if (Array.isArray(obj)) {
    return obj.map(item => replaceVariables(item, dictionary))
  }

  const targets = Object.keys(dictionary)

  const mapped = Object.keys(obj).reduce((r, key) => {
    if (Array.isArray(r[key])) {
      return {
        ...r,
        [key]: r[key].map((arrObj: any) => {
          return replaceVariables(arrObj, dictionary)
        })
      }
    }

    if (typeof r[key] === 'object') {
      return {
        ...r,
        [key]: replaceVariables(r[key], dictionary)
      }
    }

    if (!targets.includes(r[key])) return r

    return { ...r, ...obj, value: dictionary[r[key]] }
  }, obj)

  return mapped
}
