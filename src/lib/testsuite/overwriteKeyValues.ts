/* eslint-disable @typescript-eslint/no-explicit-any */
import { CollectionDefinition } from 'postman-collection'
import { isObject } from '../../utils/isObject'

export const overwriteKeyValues = (
  collectionJson: CollectionDefinition | Partial<CollectionDefinition>,
  dictionary: Record<string, unknown>
): any => {
  if (!collectionJson || !isObject(collectionJson) || Object.keys(dictionary)?.length === 0)
    return collectionJson

  if (Array.isArray(collectionJson)) {
    return collectionJson.map(item => overwriteKeyValues(item, dictionary))
  }

  const targets = Object.keys(dictionary)

  const mapped = Object.keys(collectionJson).reduce((r, key) => {
    if (Array.isArray(r[key])) {
      return {
        ...r,
        [key]: r[key].map((arrObj: any) => {
          return overwriteKeyValues(arrObj, dictionary)
        })
      }
    }

    if (isObject(r[key])) {
      return {
        ...r,
        [key]: overwriteKeyValues(r[key], dictionary)
      }
    }

    if (!targets.includes(r[key])) return r

    return { ...r, ...collectionJson, value: dictionary[r[key]] }
  }, collectionJson)

  return mapped
}
