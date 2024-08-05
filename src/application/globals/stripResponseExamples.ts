/* eslint-disable no-useless-escape */
import traverse from 'neotraverse/legacy'
import { CollectionDefinition } from 'postman-collection'

/**
 * Strip response examples from the Postman collection
 * @param portmanCollection Postman collection as JSON object
 */
export const stripResponseExamples = (
  portmanCollection: CollectionDefinition
): CollectionDefinition => {
  if (!portmanCollection?.item) return portmanCollection

  traverse(portmanCollection.item).forEach(function (node) {
    // Request in a folder
    if (this?.parent?.key === 'item' && node?.response) {
      node.response = []
    }
    // Request on the root
    if (this.parent?.isRoot === true && node?.response) {
      node.response = []
    }
  })
  return portmanCollection
}
