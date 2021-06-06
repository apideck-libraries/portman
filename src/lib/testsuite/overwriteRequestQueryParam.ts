import { PostmanMappedOperation } from 'lib/postman/PostmanMappedOperation'

/**
 * Overwrite Postman request query params with values defined by the portman testsuite
 * @param overwriteValues
 * @param pmOperation
 */
export const overwriteRequestQueryParams = (
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
  // Early exit if overwrite values are not defined
  if (!(overwriteValues instanceof Array)) return pmOperation

  // Early exit if request url query is not defined
  if (!pmOperation.item?.request?.url?.query?.members) return pmOperation

  pmOperation.item.request.url.query.members.forEach(pmQueryParam => {
    // Overwrite values for Keys
    overwriteValues.forEach(overwriteValue => {
      // Skip keys when no overwrite is defined
      if (!(overwriteValue.key && pmQueryParam.key && overwriteValue.key === pmQueryParam.key)) {
        return
      }

      // Test suite - Overwrite/extend query param value
      if (overwriteValue.hasOwnProperty('value') && pmQueryParam.hasOwnProperty('value')) {
        const orgValue = pmQueryParam.value
        let newValue = overwriteValue.value

        if (overwriteValue.overwrite === false) {
          newValue = orgValue + newValue
        }
        pmQueryParam.value = newValue
      }

      // Test suite - Disable query param
      if (overwriteValue.disable === true) {
        pmQueryParam.disabled = true
      }

      // Set Postman query param
      pmOperation.item.request.url.query.upsert(pmQueryParam)

      // Test suite - Remove query param
      if (overwriteValue.remove === true) {
        // TODO figure out why this alters the other overwrites
        // pmOperation.item.request.removeQueryParams(overwriteValue.key)
      }
    })
  })

  return pmOperation
}
