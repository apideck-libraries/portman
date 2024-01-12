import { assignCollectionVariablesDTO, writeOperationTestScript } from '../../application'
import { PostmanMappedOperation } from '../../postman'
import { parseTpl, getByPath, hasTpl } from '../../utils'

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

  let pmVarAssign = ''
  const toggleLog = options?.logAssignVariables === false ? '// ' : ''

  const opsRef = pmOperation.id ? pmOperation.id : pmOperation.pathVar

  // Generate property path from template
  const casedProp = parseTpl({
    template: varSetting.requestBodyProp,
    oaOperation
    // options: {
    // casing: globals?.variableCasing
    // }
  })
  const varProp = hasTpl(varSetting?.requestBodyProp) ? casedProp : varSetting.requestBodyProp

  // Generate variable name from template
  const casedVarName = parseTpl({
    template: varSetting?.name,
    oaOperation,
    dynamicValues: {
      varProp: varProp,
      opsRef: opsRef
    },
    options: {
      casing: globals?.variableCasing
    }
  })

  // Set variable name
  let varName = casedVarName
  if (varSetting?.name === undefined || hasTpl(varSetting.name)) {
    varName = casedVarName
  } else if (varSetting.name !== '') {
    varName = varSetting.name
  }

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
