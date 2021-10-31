import { PostmanMappedOperation } from '../../postman'
import { OverwriteQueryParamConfig } from '../../types'
import { QueryParam } from 'postman-collection'

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
  // if (!pmOperation.item?.request?.url?.query) return pmOperation

  // Get all Postman Headers
  const queryKeys = pmOperation.item.request.url.query.map(({ key }) => key)
  // Detect overwrite headers that do not exist in the Postman collection
  const insertNewKeys = overwriteValues.filter(x => !queryKeys.includes(x.key))

  pmOperation.item.request.url.query.each(pmQueryParam => {
    // Overwrite values for Keys
    overwriteValues.forEach(overwriteItem => {
      // Skip keys when no overwrite is defined
      if (!(overwriteItem.key && pmQueryParam.key && overwriteItem.key === pmQueryParam.key)) {
        return
      }

      // Test suite - Overwrite/extend query param value
      if (overwriteItem?.value && pmQueryParam?.value) {
        const orginalValue = pmQueryParam.value
        let newValue = overwriteItem.value

        if (overwriteItem.overwrite === false) {
          newValue = orginalValue + newValue
        }
        pmQueryParam.value = newValue
      }

      // Test suite - Disable query param
      if (overwriteItem?.disable === true) {
        pmQueryParam.disabled = true
      }

      // Test suite - Overwrite query param description
      if (overwriteItem?.description) {
        pmQueryParam.description = overwriteItem.description
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

  // Test suite - Add query param
  insertNewKeys
    .filter(overwriteItem => !(overwriteItem.insert === false))
    .map(queryToInsert => {
      // Initialize new Postman Header
      const newPmQueryParam = {
        key: queryToInsert.key,
        value: '',
        // description: '',
        disabled: false
      } as QueryParam

      // Set header properties based on the OverwriteValues
      if (queryToInsert.value) newPmQueryParam.value = queryToInsert.value
      if (queryToInsert.disable === true) newPmQueryParam.disabled = true
      if (queryToInsert.description) newPmQueryParam.description = queryToInsert.description

      // Add Postman query param
      // pmOperation.item.request.addHeader(newPmQueryParam)
      pmOperation.item.request.url.query.upsert(newPmQueryParam)

      // Add queryParams
      if (pmOperation?.queryParams && Array.isArray(pmOperation.queryParams)) {
        const { disabled, ...reqHeader } = newPmQueryParam
        pmOperation.queryParams.push(reqHeader)
      }
    })
  return pmOperation
}
