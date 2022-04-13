import { writeOperationTestScript } from '../../application'
import { PostmanMappedOperation } from '../../postman'
import { CollectionVariableConfig, PortmanOptions } from '../../types'
import { getByPath } from '../../utils'

/**
 * Assign PM variables with values defined by the request body
 * @param varSetting
 * @param pmOperation
 * @param options
 */
export const assignVarFromRequestBody = (
  varSetting: CollectionVariableConfig,
  pmOperation: PostmanMappedOperation,
  options?: PortmanOptions
  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
): PostmanMappedOperation => {
  // Early exit if request body is not defined
  if (!pmOperation.item?.request?.body?.raw) return pmOperation

  // Early exit if request body prop is not defined
  if (!varSetting.requestBodyProp) return pmOperation

  // const requestBody = pmOperation.item.request.body.raw
  let pmVarAssign = ''

  // Toggle log output
  const toggleLog = options?.logAssignVariables === false ? '// ' : ''

  // Set variable name
  const opsRef = pmOperation.id ? pmOperation.id : pmOperation.pathVar
  const varProp = varSetting.requestBodyProp
  const varName = varSetting.name ? varSetting.name : opsRef + '.' + varProp

  // Set variable value
  const reqBodyObj = JSON.parse(pmOperation.item.request.body.raw)
  const reqBodyValue = getByPath(reqBodyObj, varProp)
  if (reqBodyValue !== undefined) {
    const varValue = typeof reqBodyValue === 'string' ? `"${reqBodyValue}"` : reqBodyValue
    pmVarAssign = [
      `// pm.collectionVariables - Set ${varName} as variable from request body \n`,
      `pm.collectionVariables.set("${varName}", ${varValue});\n`,
      `${toggleLog}console.log("- use {{${varName}}} as collection variable for value", ${varValue});\n`
    ].join('')

    // Expose the variable in Portman
    console.log(
      `- Set variable for "${opsRef}" - use {{${varName}}} as variable for "request.${varProp}"`
    )
  }

  writeOperationTestScript(pmOperation, pmVarAssign)

  return pmOperation
}
