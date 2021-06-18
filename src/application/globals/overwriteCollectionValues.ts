import { CollectionDefinition } from 'postman-collection'
import { isObject } from '../../utils'

export const overwriteCollectionValues = (
  collectionJson: CollectionDefinition | Partial<CollectionDefinition>,
  dictionary: Record<string, unknown>
): CollectionDefinition => {
  Object.entries(dictionary).map(([target, value]) => {
    for (const [key, val] of Object.entries(collectionJson)) {
      if (Array.isArray(val)) {
        val.map(obj => overwriteCollectionValues(obj, dictionary))
      } else if (val && isObject(val)) {
        overwriteCollectionValues(val, dictionary)
      } else if (typeof val === 'string' && val.includes(target)) {
        collectionJson[key] = value
      }
    }
  })
  return collectionJson
}
