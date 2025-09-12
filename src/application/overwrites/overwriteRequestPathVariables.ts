import { PostmanMappedOperation } from '../../postman'
import { Variable } from 'postman-collection'
import { parseTpl, hasTpl } from '../../utils'
import { OverwriteRequestDTO } from './applyOverwrites'

/**
 * Overwrite Postman request path variables with values defined by the portman testsuite
 * @param dto
 */
export const overwriteRequestPathVariables = (dto: OverwriteRequestDTO): PostmanMappedOperation => {
  const { overwriteValues, pmOperation, oaOperation, globals } = dto

  // Early exit if overwrite values are not defined
  if (!(overwriteValues instanceof Array)) return pmOperation

  // Early exit if request path variables are not defined
  // if (!pmOperation.item?.request) return pmOperation

  // Get all Postman path params
  const pathVarKeys = pmOperation.item.request.url.variables.map(({ key }) => key)
  // Detect overwrite path variables that do not exist in the Postman collection
  const insertNewKeys = overwriteValues.filter(x => !pathVarKeys.includes(x.key))

  pmOperation.item.request.url.variables.each(variable => {
    // Overwrite values for Keys
    overwriteValues.forEach(overwriteItem => {
      // Skip keys when no overwrite is defined
      if (!(overwriteItem.key && variable.key && overwriteItem.key === variable.key)) {
        return
      }

      const generatedName = parseTpl({
        template: overwriteItem?.value,
        oaOperation: oaOperation,
        options: {
          casing: globals?.variableCasing
        }
      })
      const overwriteValue =
        overwriteItem?.value && hasTpl(overwriteItem.value) ? generatedName : overwriteItem?.value

      if (
        overwriteItem.key &&
        variable.key &&
        overwriteItem.key === variable.key &&
        overwriteValue !== undefined
      ) {
        const orgValue = variable?.value || null
        let newValue = overwriteValue

        if (overwriteItem.overwrite === false) {
          newValue = orgValue + newValue
        }
        variable.type = 'string' // Set schema as type string dynamic variable
        variable.value =
          (newValue !== undefined && newValue !== null) || 'boolean' === typeof newValue
            ? `${newValue}`.toString()
            : ''
      }
    })
  })

  // Test suite - Remove request path variables
  overwriteValues
    .filter(({ remove }) => remove)
    .map(pathVarToRemove => {
      if (pmOperation?.item?.request?.url?.path) {
        const newPath = pmOperation.item.request.url.path.filter(variable => {
          return variable !== `:${pathVarToRemove.key}`
        }, null)
        pmOperation.item.request.url.path = newPath
      }
      pmOperation.item.request.url.variables.remove(variable => {
        return variable.key === pathVarToRemove.key
      }, null)
    })

  // Test suite - Add path variables
  insertNewKeys
    .filter(overwriteItem => !(overwriteItem.insert === false))
    .filter(overwriteItem => !(overwriteItem.remove === true))
    .map(pathToInsert => {
      // Initialize new Postman-collection path variable
      const newPmPathVar = {
        key: pathToInsert.key,
        value: '',
        // description: '',
        disabled: false
      } as Variable

      // Set path variable properties based on the OverwriteValues
      if (pathToInsert.value) newPmPathVar.value = pathToInsert.value
      if (pathToInsert.disable === true) newPmPathVar.disabled = true
      if (pathToInsert.description) newPmPathVar.description = pathToInsert.description

      // Add Postman path variable
      pmOperation.item.request.url.variables.upsert(newPmPathVar)
      if (pmOperation?.item?.request?.url?.path) {
        pmOperation.item.request.url.path.push(`:${pathToInsert.key}`)
      }

      // Add path variable
      if (pmOperation?.pathParams && Array.isArray(pmOperation.pathParams)) {
        const { disabled, ...reqPathVar } = newPmPathVar
        pmOperation.pathParams.push(reqPathVar)
      }
    })

  return pmOperation
}
