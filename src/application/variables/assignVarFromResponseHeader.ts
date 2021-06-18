import { writeOperationTestScript } from '../../application'
import { PostmanMappedOperation } from '../../postman'
import { CollectionVariableConfig } from '../../types'

/**
 * Assign PM variables with values defined by the request body
 * @param varSetting
 * @param pmOperation
 */
export const assignVarFromResponseHeader = (
  varSetting: CollectionVariableConfig,
  pmOperation: PostmanMappedOperation
  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
): PostmanMappedOperation => {
  // Early exit if response header is not defined
  if (!varSetting.responseHeaderProp) return pmOperation

  let pmJsonData = ''
  let pmVarAssign = ''

  // Only set the jsonData once
  if (!pmOperation.testJsonDataInjected) {
    pmJsonData = [
      `// Set response object as internal variable\n`,
      `let jsonData = pm.response.json();\n`
    ].join('')
    pmOperation.testJsonDataInjected = true
  }

  // Set variable name
  const opsRef = pmOperation.id ? pmOperation.id : pmOperation.pathVar
  const varProp = varSetting.responseHeaderProp
  const varName = varSetting.name ? varSetting.name : opsRef + '.' + varProp

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
    `   console.log("- use {{${varName}}} as collection variable for value", ${safeVarName});\n`,
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
