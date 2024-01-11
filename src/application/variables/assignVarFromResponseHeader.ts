import { assignCollectionVariablesDTO, writeOperationTestScript } from '../../application'
import { PostmanMappedOperation } from '../../postman'
import { generateVarName } from '../../utils'

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

  // Toggle log output
  const toggleLog = options?.logAssignVariables === false ? '// ' : ''

  // Set variable name
  const opsRef = pmOperation.id ? pmOperation.id : pmOperation.pathVar
  const varProp = varSetting.responseHeaderProp
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
