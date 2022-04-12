import { writeOperationTestScript } from '../../application'
import { PostmanMappedOperation } from '../../postman'
import { CollectionVariableConfig, PortmanOptions } from '../../types'

/**
 * Assign PM variable with value defined by a fixed value, defined the portman config
 * @param varSetting
 * @param pmOperation
 * @param fixedValueCounter
 * @param options
 */
export const assignVarFromValue = (
  varSetting: CollectionVariableConfig,
  pmOperation: PostmanMappedOperation,
  fixedValueCounter: number | string,
  options?: PortmanOptions
  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
): PostmanMappedOperation => {
  // Early exit if request body is not defined
  if (!varSetting.value) return pmOperation

  let pmVarAssign = ''

  // Toggle log output
  const toggleLog = options?.logAssignVariables === false ? '// ' : ''

  // Set variable name
  const opsRef = pmOperation.id ? pmOperation.id : pmOperation.pathVar
  const varProp = `-var-` + fixedValueCounter
  const varName = varSetting.name ? varSetting.name : opsRef + '.' + varProp
  const varValue = typeof varSetting.value === 'string' ? `"${varSetting.value}"` : varSetting.value

  pmVarAssign = [
    `// pm.collectionVariables - Set fixed value for ${varName} variable \n`,
    `pm.collectionVariables.set("${varName}", ${varValue});\n`,
    `${toggleLog}console.log("- use {{${varName}}} as collection variable for value", ${varValue});\n`
  ].join('')

  // Expose the variable in Portman
  console.log(`- Set variable for "${opsRef}" - use {{${varName}}} as variable for ${varValue}`)

  writeOperationTestScript(pmOperation, pmVarAssign)

  return pmOperation
}
