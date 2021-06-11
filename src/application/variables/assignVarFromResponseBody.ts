import { writeOperationTestScript } from 'application'
import { PostmanMappedOperation } from 'postman'
import { CollectionVariableConfig } from 'types'

/**
 * Assign PM variables with values defined by the request body
 * @param varSetting
 * @param pmOperation
 */
export const assignVarFromResponseBody = (
  varSetting: CollectionVariableConfig,
  pmOperation: PostmanMappedOperation
  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
): PostmanMappedOperation => {
  // Early exit if response body is not defined
  if (!varSetting.responseBodyProp) return pmOperation

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
  const varProp = varSetting.responseBodyProp
  const varName = varSetting.name ? varSetting.name : opsRef + '.' + varProp

  pmVarAssign = [
    `// pm.collectionVariables - Set ${varName} as variable for jsonData.${varProp}  \n`,
    `if (typeof jsonData.${varProp} !== "undefined") {\n`,
    `   pm.collectionVariables.set("${varName}", jsonData.${varProp});\n`,
    `   console.log("- use {{${varName}}} as collection variable for value",`,
    `jsonData.${varProp});\n`,
    `};\n`
  ].join('')

  // Expose the variable in Portman
  console.log(
    `- Set variable for "${opsRef}" - use {{${varName}} as variable for "response.${varProp}"`
  )

  writeOperationTestScript(pmOperation, pmJsonData)
  writeOperationTestScript(pmOperation, pmVarAssign)

  return pmOperation
}
