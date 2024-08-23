import { PostmanMappedOperation } from '../../postman'
import { QueryParam } from 'postman-collection'
import { parseTpl, hasTpl, matchWildcard } from '../../utils'
import { OverwriteRequestDTO } from './applyOverwrites'
import _ from 'lodash'

/**
 * Overwrite Postman request query params with values defined by the portman testsuite
 * @param dto
 */
export const overwriteRequestQueryParams = (dto: OverwriteRequestDTO): PostmanMappedOperation => {
  const { overwriteValues, pmOperation, oaOperation, globals } = dto

  // Early exit if overwrite values are not defined
  if (!(overwriteValues instanceof Array)) return pmOperation

  // Get all Postman query params
  const queryKeys = pmOperation.item.request.url.query.map(({ key }) => key)

  // Detect overwrite query params that do not exist in the Postman collection
  const insertNewKeys = overwriteValues.filter(x => !queryKeys.includes(x.key))

  // Extract duplicate query params
  const duplicateKeys = _(queryKeys)
    .countBy()
    .pickBy((count: number) => count > 1)
    .keys()
    .value()

  // Initialize counters for tracking
  const queryKeyCounters = {}
  const overwriteKeyCounters = {}
  const duplicateKeyCounters = {}

  // Util function to get the count of key
  const getKeyCount = (key, counter) => counter[key] || 0

  // Util function to increment the key count
  const incrementKeyCount = (key, counter) => {
    counter[key] = getKeyCount(key, counter) + 1
    return counter[key]
  }

  pmOperation.item.request.url.query.each(pmQueryParam => {
    // Increment counter for query param
    const queryKeyIndex = incrementKeyCount(pmQueryParam.key, queryKeyCounters)

    // Overwrite values for Keys
    for (const overwriteItem of overwriteValues) {
      // Skip keys when no overwrite is defined
      if (
        !(overwriteItem?.key && pmQueryParam?.key && overwriteItem.key === pmQueryParam.key) &&
        !overwriteItem.key.includes('*')
      ) {
        continue
      }

      // Check wildcard match
      if (
        overwriteItem.key.includes('*') &&
        pmQueryParam.key &&
        !matchWildcard(pmQueryParam.key, overwriteItem.key)
      ) {
        continue
      }

      // Increment counter for overwrite key
      const overwriteKeyIndex = incrementKeyCount(overwriteItem.key, overwriteKeyCounters)

      const generatedName = parseTpl({
        template: overwriteItem.value,
        oaOperation: oaOperation,
        options: {
          casing: globals?.variableCasing
        }
      })
      let overwriteValue =
        overwriteItem?.value && hasTpl(overwriteItem.value) ? generatedName : overwriteItem?.value

      // Handle duplicated query params
      let duplicateFound = false
      if (
        duplicateKeys.length > 0 &&
        duplicateKeys.includes(pmQueryParam.key) &&
        overwriteItem.key === pmQueryParam.key &&
        queryKeyIndex === overwriteKeyIndex
      ) {
        const duplicateKeyIndex = getKeyCount(overwriteItem.key, duplicateKeyCounters)
        const matchingOverwriteItems = overwriteValues.filter(item => item.key === pmQueryParam.key)

        const overwriteObj = matchingOverwriteItems[duplicateKeyIndex]
        if (overwriteObj.value) {
          overwriteValue = overwriteObj.value
          incrementKeyCount(overwriteItem.key, duplicateKeyCounters)
          duplicateFound = true
        }
      }

      // Test suite - Overwrite/extend query param value
      let hasValue = false
      if (overwriteValue !== undefined && pmQueryParam?.value) {
        hasValue = true
        const orgValue = pmQueryParam.value
        let newValue = overwriteValue

        if (overwriteItem?.overwrite === false) {
          newValue = orgValue + newValue
        }
        pmQueryParam.value =
          (newValue !== undefined && newValue !== null) || 'boolean' === typeof newValue
            ? `${newValue}`.toString()
            : ''
      }

      // Test suite - Enable query param
      if (overwriteItem?.disable === false || hasValue) {
        pmQueryParam.disabled = false
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

      // Break the loop once a matching overwrite is applied
      if (duplicateFound) {
        break
      }
    }
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
