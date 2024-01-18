import { PostmanMappedOperation } from '../../postman'
import { QueryParam } from 'postman-collection'
import { parseTpl, hasTpl } from '../../utils'
import { OverwriteRequestDTO } from './applyOverwrites'

/**
 * Overwrite Postman request query params with values defined by the portman testsuite
 * @param dto
 */
export const overwriteRequestQueryParams = (dto: OverwriteRequestDTO): PostmanMappedOperation => {
  const { overwriteValues, pmOperation, oaOperation, globals } = dto

  // Early exit if overwrite values are not defined
  if (!(overwriteValues instanceof Array)) return pmOperation

  // Early exit if request url query is not defined
  // if (!pmOperation.item?.request?.url?.query) return pmOperation

  // Get all Postman query params
  const queryKeys = pmOperation.item.request.url.query.map(({ key }) => key)
  // Detect overwrite query params that do not exist in the Postman collection
  const insertNewKeys = overwriteValues.filter(x => !queryKeys.includes(x.key))

  pmOperation.item.request.url.query.each(pmQueryParam => {
    // Overwrite values for Keys
    overwriteValues.forEach(overwriteItem => {
      // Skip keys when no overwrite is defined
      if (!(overwriteItem?.key && pmQueryParam?.key && overwriteItem.key === pmQueryParam.key)) {
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

      // Test suite - Overwrite/extend query param value
      if (overwriteValue !== undefined && pmQueryParam?.value) {
        const orgValue = pmQueryParam.value
        let newValue = overwriteValue

        if (overwriteItem?.overwrite === false) {
          newValue = orgValue + newValue
        }
        pmQueryParam.value =
          newValue || 'boolean' === typeof newValue ? `${newValue}`.toString() : ''
      }

      // Test suite - Disable query param
      if (overwriteItem?.disable === true) {
        pmQueryParam.disabled = true
      }
      // Test suite - Enable query param
      if (overwriteItem?.disable === false) {
        pmQueryParam.disabled = false
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
    .filter(overwriteItem => !(overwriteItem.remove === true))
    .map(queryToInsert => {
      // Initialize new Postman query param
      const newPmQueryParam = {
        key: queryToInsert.key,
        value: '',
        // description: '',
        disabled: false
      } as QueryParam

      // Set query param properties based on the OverwriteValues
      if (queryToInsert.value) newPmQueryParam.value = queryToInsert.value
      if (queryToInsert.disable === true) newPmQueryParam.disabled = true
      if (queryToInsert.description) newPmQueryParam.description = queryToInsert.description

      // Add Postman query param
      pmOperation.item.request.url.query.upsert(newPmQueryParam)

      // Add queryParams
      if (pmOperation?.queryParams && Array.isArray(pmOperation.queryParams)) {
        const { disabled, ...reqQueryParam } = newPmQueryParam
        pmOperation.queryParams.push(reqQueryParam)
      }
    })

  return pmOperation
}
