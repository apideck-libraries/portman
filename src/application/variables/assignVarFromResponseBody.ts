import { writeOperationTestScript } from '../../application'
import { PostmanMappedOperation } from '../../postman'
import { CollectionVariableConfig, PortmanOptions } from '../../types'
import { renderBracketPath, renderChainPath } from '../../utils'
import { camelCase } from 'camel-case'

/**
 * Assign PM variables with values defined by the request body
 * @param varSetting
 * @param pmOperation
 * @param options
 */
export const assignVarFromResponseBody = (
  varSetting: CollectionVariableConfig,
  pmOperation: PostmanMappedOperation,
  options?: PortmanOptions
  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
): PostmanMappedOperation => {
  // Early exit if response body is not defined
  if (!varSetting.responseBodyProp) return pmOperation

  let pmJsonData = ''
  let pmMappedData = ''
  let pmVarAssign = ''

  // Only set the jsonData once
  if (!pmOperation.testJsonDataInjected) {
    pmJsonData = [
      `// Set response object as internal variable\n`,
      `let jsonData = {};\n`,
      `try {jsonData = pm.response.json();}catch(e){}\n`
    ].join('')
    pmOperation.testJsonDataInjected = true
  }

  // Toggle log output
  const toggleLog = options?.logAssignVariables === false ? '// ' : ''

  // Set variable name
  const root = varSetting.responseBodyProp === '.'
  const opsRef = pmOperation.id ? pmOperation.id : pmOperation.pathVar
  const prop = varSetting.responseBodyProp
  const varSafeProp = renderBracketPath(prop)
  const varProp = varSafeProp.charAt(0) === '[' ? `${varSafeProp}` : root ? '' : `.${varSafeProp}`
  const nameProp = prop.charAt(0) !== '[' ? `.${prop}` : prop
  const varName = varSetting.name ? varSetting.name : opsRef + nameProp
  const varPath = `${renderChainPath(`jsonData${varProp}`)}`
  const pathVarName = `_${camelCase(`res${varProp.replace(/\[/g, '')}`)}`

  // Only set the pathVarName once
  if (!pmOperation.mappedVars.includes(pathVarName)) {
    // Register Portman request variable name
    pmOperation.registerVar(pathVarName)
    pmMappedData = [
      `// Set property value as variable\n`,
      `const ${pathVarName} = ${varPath};\n`
    ].join('')
  }

  pmVarAssign = [
    `// pm.collectionVariables - Set ${varName} as variable for jsonData${varProp}\n`,
    `if (${pathVarName} !== undefined) {\n`,
    `   pm.collectionVariables.set("${varName}", jsonData${varProp});\n`,
    `   ${toggleLog}console.log("- use {{${varName}}} as collection variable for value",`,
    `jsonData${varProp});\n`,
    `} else {\n`,
    `   console.log('INFO - Unable to assign variable {{${varName}}}, as jsonData${varProp} is undefined.');\n`,
    `};\n`
  ].join('')

  // Expose the variable in Portman
  console.log(
    `- Set variable for "${opsRef}" - use {{${varName}}} as variable for "response${varProp}"`
  )

  if (pmJsonData !== '') writeOperationTestScript(pmOperation, pmJsonData)
  if (pmMappedData !== '') writeOperationTestScript(pmOperation, pmMappedData)
  if (pmVarAssign !== '') writeOperationTestScript(pmOperation, pmVarAssign)

  return pmOperation
}
