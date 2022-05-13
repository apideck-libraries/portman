/* eslint-disable no-useless-escape */
import { GlobalReplacement } from '../../types'

export const writeRawReplacements = (
  collectionAsString: string,
  globalReplacements: GlobalReplacement[]
): string => {
  globalReplacements.map(({ searchFor, replaceWith }) => {
    const pattern = searchFor.replace(/"/g, '\\"')
    const replacement = replaceWith.replace(/"/g, '\\"')
    collectionAsString = collectionAsString.replace(
      new RegExp(escapeRegExp(pattern), 'g'),
      replacement
    )
    return collectionAsString
  })

  return collectionAsString
}

const escapeRegExp = (string: string): string => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
