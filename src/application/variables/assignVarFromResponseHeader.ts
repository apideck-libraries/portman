import { assignCollectionVariablesDTO, writeOperationTestScript } from '../../application'
import { PostmanMappedOperation } from '../../postman'
import { hasTpl, parseTpl } from '../../utils'

/**
 * Assign PM variables with values defined by the request body
 * @param dto
 */
export const assignVarFromResponseHeader = (
  dto: assignCollectionVariablesDTO
): PostmanMappedOperation => {
  const { pmOperation, oaOperation, varSetting, options, globals } = dto

  // Early exit if response header is not defined
  if (!varSetting.responseHeaderProp) return pmOperation

  let pmJsonData = ''
  let pmVarAssign = ''
  const toggleLog = options?.logAssignVariables === false ? '// ' : ''

  // Only set the jsonData once
  if (!pmOperation.testJsonDataInjected) {
    pmJsonData = [
      `// Set response object as internal variable\n`,
      `let jsonData = {};\n`,
      `try {jsonData = pm.response.json();}catch(e){}\n`
      // `let jsonData = pm.response.json();\n`
    ].join('')
    pmOperation.testJsonDataInjected = true
  }

  const opsRef = pmOperation.id ? pmOperation.id : pmOperation.pathVar

  // Generate property path from template
  const casedProp = parseTpl({
    template: varSetting.responseHeaderProp,
    oaOperation
    // options: {
    // casing: globals?.variableCasing
    // }
  })
  const varProp = hasTpl(varSetting?.responseHeaderProp) ? casedProp : varSetting.responseHeaderProp

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

  // Safe variable name
  const safeVarName = varName
    .replace(/-/g, '')
    .replace(/_/g, '')
    .replace(/ /g, '')
    .replace(/\./g, '')

  pmVarAssign = [
    `// pm.collectionVariables - Set ${varName} as variable for header \n`,
    `let ${safeVarName} = pm.response.headers.get("${varProp}");\n`,
    `if (${safeVarName} !== undefined) {\n`,
    `   pm.collectionVariables.set("${varName}", ${safeVarName});\n`,
    `   ${toggleLog}console.log("- use {{${varName}}} as collection variable for value", ${safeVarName});\n`,
    `};\n`
  ].join('')

  // Expose the variable in Portman
  console.log(
    `- Set variable for "${opsRef}" - use {{${varName}}} as variable for "header.${varProp}"`
  )

  writeOperationTestScript(pmOperation, pmJsonData)
  writeOperationTestScript(pmOperation, pmVarAssign)

  return pmOperation
}
