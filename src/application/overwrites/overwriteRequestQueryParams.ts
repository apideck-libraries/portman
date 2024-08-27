import { PostmanMappedOperation } from '../../postman'
import { Description, QueryParam } from 'postman-collection'
import { parseTpl, hasTpl, matchWildcard } from '../../utils'
import { OverwriteRequestDTO } from './applyOverwrites'
import _ from 'lodash'
import { OverwriteQueryParamConfig } from 'types'

/**
 * Overwrite Postman request query params with values defined by the portman testsuite
 * @param dto
 */
export const overwriteRequestQueryParams = (dto: OverwriteRequestDTO): PostmanMappedOperation => {
  const { overwriteValues, pmOperation, oaOperation, globals } = dto

  // Early exit if overwrite values are not defined
  if (!(overwriteValues instanceof Array)) return pmOperation

  const _overwriteValues = _.cloneDeep(overwriteValues)

  // Get all Postman query params
  const queryKeys = pmOperation.item.request.url.query.map(({ key }) => key)

  // Util function to get the count of key
  const getKeyCount = (key, counter) => counter[key] || 0

  // Util function to increment the key count
  const incrementKeyCount = (key, counter) => {
    counter[key] = getKeyCount(key, counter) + 1
    return counter[key]
  }

  // Create a counter for each key in queryKeys to track their usage
  const queryKeyUsage = {}
  queryKeys.forEach(key => incrementKeyCount(key, queryKeyUsage))

  // Detect overwrite query params that do not exist in the Postman collection
  const insertNewKeys = overwriteValues.filter(({ key }) => {
    if (queryKeyUsage[key]) {
      // If there's an unused key in queryKeys, decrement the counter
      queryKeyUsage[key]--
      return false // This key does not need to be inserted
    }
    // If no matching key left in queryKeys, this overwriteValue key should be inserted
    return true
  })

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

  // New list to hold the updated query parameters
  let newQueryParams: QueryParam[] = []

  pmOperation.item.request.url.query.each(pmQueryParam => {
    // Increment counter for query param
    const queryKeyIndex = incrementKeyCount(pmQueryParam.key, queryKeyCounters)

    // Track whether the current query param has been overwritten or removed
    let paramProcessed = false

    // Overwrite values for Keys
    for (let i = 0; i < _overwriteValues.length; i++) {
      const overwriteItem = _overwriteValues[i]

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

      // Handle removal logic
      if (overwriteItem.remove) {
        // Increment the counter for removed duplicate query params
        incrementKeyCount(overwriteItem.key, duplicateKeyCounters)
        paramProcessed = true
        _.remove(_overwriteValues, (item: OverwriteQueryParamConfig) => item === overwriteItem)
        break
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
        const matchingOverwriteItems = _overwriteValues.filter(
          (item: OverwriteQueryParamConfig) => item.key === pmQueryParam.key
        )

        const overwriteObj = matchingOverwriteItems[0]
        if (overwriteObj?.value) {
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
        pmQueryParam.description = new Description(overwriteItem.description)
      }

      // Overwrite existing query param
      newQueryParams.push(pmQueryParam as QueryParam)

      // Mark as overwritten
      paramProcessed = true

      // Remove the overwrite value if it is linked to a duplicated query param
      if (duplicateFound) {
        _.remove(_overwriteValues, (item: OverwriteQueryParamConfig) => item === overwriteItem)
        break
      }
    }

    // If not overwritten or removed, add the original param to the new list
    if (!paramProcessed) {
      newQueryParams.push(pmQueryParam)
    }
  })

  // Test suite - Remove query param
  // _overwriteValues
  //   .filter(({ remove }) => remove)
  //   .map(paramToRemove => {
  //     newQueryParams = newQueryParams.filter(qp => qp.key !== paramToRemove.key)
  //   })

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

      // Add to the new list of query params
      newQueryParams.push(newPmQueryParam)
    })

  // Clear existing query params and the Portman query params ones
  pmOperation.item.request.url.query.clear()
  newQueryParams.forEach(param => pmOperation.item.request.url.query.append(param))

  return pmOperation
}
