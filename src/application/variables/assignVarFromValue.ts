import { assignCollectionVariablesDTO, writeOperationTestScript } from '../../application'
import { PostmanMappedOperation } from '../../postman'
import { hasTpl, parseTpl } from '../../utils'

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

  // Early exit if value is not defined
  if (!varSetting.value) return pmOperation

  let pmVarAssign = ''
  const toggleLog = options?.logAssignVariables === false ? '// ' : ''

  const opsRef = pmOperation.id ? pmOperation.id : pmOperation.pathVar
  const varProp = `-var-` + fixedValueCounter

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
  const generatedValue = parseTpl({
    template: varSetting.value,
    oaOperation: oaOperation,
    options: {
      casing: globals?.variableCasing
    }
  })
  const processedValue =
    varSetting?.value && hasTpl(varSetting.value) ? generatedValue : varSetting.value
  const varValue = typeof processedValue === 'string' ? `"${processedValue}"` : processedValue

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
