import { PostmanMappedOperation } from 'lib/postman/PostmanMappedOperation'
import { getByPath } from '../../utils/getByPath'
import { setByPath } from '../../utils/setByPath'
import { omitByPath } from '../../utils/omitByPath'

/**
 * Overwrite Postman request headers with values defined by the portman testsuite
 * @param overwriteValues
 * @param pmOperation
 */
export const overwriteRequestHeader = (
  overwriteValues: [
    {
      key: string
      value: string
      overwrite: boolean
      disable: boolean
      remove: boolean
    }
  ],
  pmOperation: PostmanMappedOperation
  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
): PostmanMappedOperation => {
  // Early exit if no request body is defined
  if (!(overwriteValues instanceof Array)) return pmOperation

  // Early exit if no request url headers is defined
  if (!pmOperation.item?.request?.headers?.members) return pmOperation

  pmOperation.item.request.headers.members.forEach(pmHeader => {
    // Overwrite values for Keys
    overwriteValues.forEach(overwriteValue => {
      // Skip keys when no overwrite is defined
      if (!(overwriteValue.key && pmHeader.key && overwriteValue.key === pmHeader.key)) {
        return
      }

      // Test suite - Overwrite/extend header value
      if (overwriteValue.hasOwnProperty('value') && pmHeader.hasOwnProperty('value')) {
        const orgValue = pmHeader.value
        let newValue = overwriteValue.value

        if (overwriteValue.overwrite === false) {
          newValue = orgValue + newValue
        }
        pmHeader.value = newValue
      }

      // Test suite - Disable header
      if (overwriteValue.disable === true) {
        pmHeader.disabled = true
      }

      // Set Postman header
      pmOperation.item.request.upsertHeader(pmHeader)

      // Test suite - Remove header
      if (overwriteValue.remove === true) {
        // TODO figure out why this alters the other overwrites
        // pmOperation.item.request.removeQueryParams(overwriteValue.key)
      }
    })
  })

  return pmOperation
}
