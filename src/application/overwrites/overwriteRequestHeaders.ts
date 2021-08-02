import { PostmanMappedOperation } from '../../postman'
import { OverwriteRequestHeadersConfig } from '../../types'

/**
 * Overwrite Postman request headers with values defined by the portman testsuite
 * @param overwriteValues
 * @param pmOperation
 */
export const overwriteRequestHeaders = (
  overwriteValues: OverwriteRequestHeadersConfig[],
  pmOperation: PostmanMappedOperation
): PostmanMappedOperation => {
  // Early exit if overwrite values are not defined
  if (!(overwriteValues instanceof Array)) return pmOperation

  // Early exit if request url headers are not defined
  if (!pmOperation.item?.request?.headers) return pmOperation

  pmOperation.item.request.headers.each(pmHeader => {
    // Overwrite values for Keys
    overwriteValues.forEach(overwriteValue => {
      // Skip keys when no overwrite is defined
      if (!(overwriteValue.key && pmHeader.key && overwriteValue.key === pmHeader.key)) {
        return
      }

      // Test suite - Overwrite/extend header value
      if (overwriteValue?.value && pmHeader?.value) {
        const originalValue = pmHeader.value
        let newValue = overwriteValue.value

        if (overwriteValue.overwrite === false) {
          newValue = originalValue + newValue
        }
        pmHeader.value = newValue
      }

      // Test suite - Disable header
      if (overwriteValue.disable === true) {
        pmHeader.disabled = true
      }

      // Set Postman header
      pmOperation.item.request.upsertHeader(pmHeader)
    })
  })

  // Test suite - Remove headers
  overwriteValues
    .filter(({ remove }) => remove)
    .map(headerToRemove => {
      pmOperation.item.request.headers.remove(header => {
        return header.key === headerToRemove.key
      }, null)
    })

  return pmOperation
}
