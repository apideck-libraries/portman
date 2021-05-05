import { CollectionDefinition } from 'postman-collection'

export const replaceValues = (
  targets: string[],
  value: string,
  obj: CollectionDefinition
): CollectionDefinition => {
  for (const [key, val] of Object.entries(obj)) {
    if (targets.includes(val)) {
      obj[key] = value
    } else if (val && typeof val === 'object') {
      replaceValues(targets, value, val)
    }
  }
  return obj
}
