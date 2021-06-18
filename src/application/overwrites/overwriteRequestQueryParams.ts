import { PostmanMappedOperation } from '../../postman'
import { OverwriteQueryParamConfig } from '../../types'

/**
 * Overwrite Postman request query params with values defined by the portman testsuite
 * @param overwriteValues
 * @param pmOperation
 */
export const overwriteRequestQueryParams = (
  overwriteValues: OverwriteQueryParamConfig[],
  pmOperation: PostmanMappedOperation
  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
): PostmanMappedOperation => {
  // Early exit if overwrite values are not defined
  if (!(overwriteValues instanceof Array)) return pmOperation

  // Early exit if request url query is not defined
  if (!pmOperation.item?.request?.url?.query) return pmOperation

  pmOperation.item.request.url.query.each(pmQueryParam => {
    // Overwrite values for Keys
    overwriteValues.forEach(overwriteValue => {
      // Skip keys when no overwrite is defined
      if (!(overwriteValue.key && pmQueryParam.key && overwriteValue.key === pmQueryParam.key)) {
        return
      }

      // Test suite - Overwrite/extend query param value
      if (overwriteValue?.value && pmQueryParam?.value) {
        const orginalValue = pmQueryParam.value
        let newValue = overwriteValue.value

        if (overwriteValue.overwrite === false) {
          newValue = orginalValue + newValue
        }
        pmQueryParam.value = newValue
      }

      // Test suite - Disable query param
      if (overwriteValue?.disable === true) {
        pmQueryParam.disabled = true
      }

      // Set Postman query param
      pmOperation.item.request.url.query.upsert(pmQueryParam)
    })
  })
  // Test suite - Remove query param
  overwriteValues
    .filter(({ remove }) => remove)
    .map(paramToRemove => {
      pmOperation.item.request.url.removeQueryParams(paramToRemove.key)
    })

  return pmOperation
}
