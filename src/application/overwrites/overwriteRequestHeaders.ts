import { PostmanMappedOperation } from '../../postman'
import { OverwriteRequestHeadersConfig } from '../../types'
import { Header } from 'postman-collection'

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
  // if (!pmOperation.item?.request?.headers) {
  //   return pmOperation
  // }

  // Get all Postman Headers
  const headerKeys = pmOperation.item.request.headers.map(({ key }) => key)
  // Detect overwrite headers that do not exist in the Postman collection
  const insertNewKeys = overwriteValues.filter(x => !headerKeys.includes(x.key))

  // Test suite - Overwrite/extend Postman headers
  pmOperation.item.request.headers.each(pmHeader => {
    // Overwrite values for Keys
    overwriteValues.forEach(overwriteItem => {
      // Skip keys when no overwrite is defined
      if (
        !(overwriteItem.key && pmHeader.key && overwriteItem.key === pmHeader.key) ||
        overwriteItem.insert === false
      ) {
        return
      }

      // Test suite - Overwrite/extend header value
      if (overwriteItem?.value && pmHeader?.value) {
        const originalValue = pmHeader.value
        let newValue = overwriteItem.value

        if (overwriteItem.overwrite === false) {
          newValue = originalValue + newValue
        }
        pmHeader.value = newValue
      }

      // Test suite - Disable header
      if (overwriteItem.disable === true) {
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

  // Test suite - Add headers
  insertNewKeys
    .filter(overwriteItem => !overwriteItem.insert)
    .map(headerToInsert => {
      const newPmHeader = { key: headerToInsert.key, value: '', disabled: false } as Header
      if (headerToInsert.value) {
        newPmHeader.value = headerToInsert.value
      }
      if (headerToInsert.disable === true) {
        newPmHeader.disabled = true
      }
      // Add Postman header
      pmOperation.item.request.headers.add(newPmHeader)

      // Add requestHeaders
      if (pmOperation?.requestHeaders && Array.isArray(pmOperation.requestHeaders)) {
        const { disabled, ...reqHeader } = newPmHeader
        pmOperation.requestHeaders.push(reqHeader)
      }
    })

  return pmOperation
}
