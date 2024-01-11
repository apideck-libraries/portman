import { assignCollectionVariablesDTO, writeOperationTestScript } from '../../application'
import { PostmanMappedOperation } from '../../postman'
import { generateVarName } from '../../utils'

/**
 * Assign PM variable with value defined by a fixed value, defined the portman config
 * @param dto
 * @param fixedValueCounter
 */
export const assignVarFromValue = (
  dto: assignCollectionVariablesDTO,
  fixedValueCounter: number | string
): PostmanMappedOperation => {
  const { pmOperation, oaOperation, varSetting, options, globals } = dto

  // Early exit if request body is not defined
  if (!varSetting.value) return pmOperation

  let pmVarAssign = ''

  // Toggle log output
  const toggleLog = options?.logAssignVariables === false ? '// ' : ''

  // Set variable name
  const opsRef = pmOperation.id ? pmOperation.id : pmOperation.pathVar
  const varProp = `-var-` + fixedValueCounter
  // const defaultVarName = `${opsRef}.${varProp}`
  // const casedVarName = settings?.variableCasing
  //   ? changeCase(defaultVarName, settings.variableCasing)
  //   : defaultVarName

  // Generate dynamic variable name
  const casedVarName = generateVarName({
    oaOperation,
    dynamicValues: {
      varProp: varProp,
      opsRef: opsRef
    },
    options: {
      casing: globals?.variableCasing
    }
  })

  const varName = varSetting?.name ?? casedVarName
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
