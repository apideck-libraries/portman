import { assignCollectionVariablesDTO, writeOperationTestScript } from '../../application'
import { PostmanMappedOperation } from '../../postman'
import { generateVarName, getByPath } from '../../utils'

/**
 * Assign PM variables with values defined by the request body
 * @param dto
 */
export const assignVarFromRequestBody = (
  dto: assignCollectionVariablesDTO
): PostmanMappedOperation => {
  const { pmOperation, oaOperation, varSetting, options, globals } = dto

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
  // const defaultVarName = `${opsRef}.${varProp}`
  // const casedVarName = settings?.variableCasing
  //   ? changeCase(defaultVarName, settings.variableCasing)
  //   : defaultVarName

  // Generate dynamic variable name
  const casedVarName = generateVarName({
    oaOperation,
    dynamicValues: {
      varProp: varProp
    },
    options: {
      casing: globals?.variableCasing
    }
  })
  const varName = varSetting?.name ?? casedVarName

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
