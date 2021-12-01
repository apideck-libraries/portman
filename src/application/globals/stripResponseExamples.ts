/* eslint-disable no-useless-escape */
import traverse from 'traverse'
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
    if (this?.parent?.key === 'item' && node?.response) {
      node.response = []
    }
  })
  return portmanCollection
}
