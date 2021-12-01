/* eslint-disable no-useless-escape */
import traverse from 'traverse'
import { CollectionDefinition } from 'postman-collection'

/**
 * Strip response examples from the Postman collection
 * @param portmanCollection
 */
export const stripResponseExamples = (
  portmanCollection: CollectionDefinition
): CollectionDefinition => {
  traverse(portmanCollection).forEach(function (node) {
    if (this?.parent?.key === 'item' && node?.response) {
      node.response = []
    }
  })
  return portmanCollection
}
