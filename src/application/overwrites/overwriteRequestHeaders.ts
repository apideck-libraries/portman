import { PostmanMappedOperation } from '../../postman'
import { Header } from 'postman-collection'
import { parseTpl, hasTpl } from '../../utils'
import { OverwriteRequestDTO } from './applyOverwrites'

/**
 * Overwrite Postman request headers with values defined by the portman testsuite
 * @param dto
 */
export const overwriteRequestHeaders = (dto: OverwriteRequestDTO): PostmanMappedOperation => {
  const { overwriteValues, pmOperation, oaOperation, globals } = dto
  // Early exit if overwrite values are not defined
  if (!(overwriteValues instanceof Array)) return pmOperation

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
        !(overwriteItem?.key && pmHeader?.key && overwriteItem.key === pmHeader.key) ||
        overwriteItem.insert === false
      ) {
        return
      }

      const generatedName = parseTpl({
        template: overwriteItem.value,
        oaOperation: oaOperation,
        options: {
          casing: globals?.variableCasing
        }
      })
      const overwriteValue =
        overwriteItem?.value && hasTpl(overwriteItem.value) ? generatedName : overwriteItem?.value

      // Test suite - Overwrite/extend header value
      let hasValue = false
      if (overwriteValue !== undefined) {
        hasValue = true
        const orgValue = pmHeader.value
        let newValue = overwriteValue

        if (overwriteItem?.overwrite === false && orgValue) {
          newValue = orgValue + newValue
        }
        pmHeader.value = newValue || 'boolean' === typeof newValue ? `${newValue}`.toString() : ''
      }

      // Test suite - Enable header
      if (overwriteItem?.disable === false || hasValue) {
        pmHeader.disabled = false
      }
      // Test suite - Disable header
      if (overwriteItem?.disable === true) {
        pmHeader.disabled = true
      }

      // Test suite - Overwrite header description
      if (overwriteItem?.description) {
        pmHeader.description = overwriteItem.description
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
    .filter(overwriteItem => !(overwriteItem.insert === false))
    .map(headerToInsert => {
      // Initialize new Postman Header
      const newPmHeader = {
        key: headerToInsert.key,
        value: '',
        // description: '',
        disabled: false
      } as Header

      // Set header properties based on the OverwriteValues
      if (headerToInsert.value) newPmHeader.value = headerToInsert.value
      if (headerToInsert.disable === true) newPmHeader.disabled = true
      if (headerToInsert.description) newPmHeader.description = headerToInsert.description

      // Add Postman header
      pmOperation.item.request.addHeader(newPmHeader)

      // Add requestHeaders
      if (pmOperation?.requestHeaders && Array.isArray(pmOperation.requestHeaders)) {
        const { disabled, ...reqHeader } = newPmHeader
        pmOperation.requestHeaders.push(reqHeader)
      }
    })

  return pmOperation
}
