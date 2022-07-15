import { PostmanMappedOperation } from '../../postman'
import { OverwritePathVariableConfig } from '../../types'

/**
 * Overwrite Postman request path variables with values defined by the portman testsuite
 * @param overwriteValues
 * @param pmOperation
 */
export const overwriteRequestPathVariables = (
  overwriteValues: OverwritePathVariableConfig[],
  pmOperation: PostmanMappedOperation
  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
): PostmanMappedOperation => {
  // Early exit if overwrite values are not defined
  if (!(overwriteValues instanceof Array)) return pmOperation

  // Early exit if request path variables are not defined
  if (!pmOperation.item?.request) return pmOperation

  pmOperation.item.request.url.variables.each(variable => {
    // Overwrite values for Keys
    overwriteValues.forEach(overwriteValue => {
      // Skip keys when no overwrite is defined
      if (!(overwriteValue.key && variable.key && overwriteValue.key === variable.key)) {
        return
      }

      if (
        overwriteValue.key &&
        variable.key &&
        overwriteValue.key === variable.key &&
        overwriteValue?.value !== undefined
      ) {
        const orgValue = variable?.value || null
        let newValue = overwriteValue.value || null

        if (overwriteValue.overwrite === false) {
          newValue = orgValue + newValue
        }

        variable.type = 'string' // Set schema as type string dynamic variable
        variable.value = newValue ? newValue.toString() : ''
      }
    })
  })

  return pmOperation
}
