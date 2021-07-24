import pluralize from 'pluralize'
import { PostmanMappedOperation } from '../../postman'
import { OverwritePathIdVariableConfig } from '../../types'

/**
 * Overwrite Postman request path variables with values defined by the portman testsuite
 * @param overwriteValues
 * @param pmOperation
 */
export const overwriteRequestPathIdVariables = (
  overwriteValues: OverwritePathIdVariableConfig[],
  pmOperation: PostmanMappedOperation
  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
): PostmanMappedOperation => {
  // Early exit if overwrite values are not defined
  if (!(overwriteValues instanceof Array)) return pmOperation

  // Early exit if request path variables are not defined
  if (!pmOperation.item?.request) return pmOperation

  // Early exit if request name/resource is not defined
  if (!pmOperation.item?.name) return pmOperation

  const pathParams = pmOperation.item.request.url?.path
    ? Array.from(pmOperation.item.request.url?.path)
    : []

  const idIndex = pathParams.indexOf(':id')

  // Early exit if path variables do not include :id
  if (idIndex < 0) return pmOperation

  // Assume the resource is defined restfully :-/
  const name = pathParams[idIndex - 1]
  const singular = pluralize.singular(name.toLowerCase())
  const variableName = `{{${singular}Id}}`

  pmOperation.item.request.url.variables.map(item => {
    if (item.key === 'id') {
      item.value = variableName
    }
  })

  return pmOperation
}
