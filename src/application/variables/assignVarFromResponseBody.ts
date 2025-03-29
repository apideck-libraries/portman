import { assignCollectionVariablesDTO, writeOperationTestScript } from '../../application'
import { PostmanMappedOperation } from '../../postman'
import {
  parseTpl,
  hasTpl,
  renderBracketPath,
  renderChainPath,
  sanitizeKeyForVar
} from '../../utils'
import { changeCase } from 'openapi-format'

/**
 * Assign PM variables with values defined by the request body
 * @param dto
 */
export const assignVarFromResponseBody = (
  dto: assignCollectionVariablesDTO
): PostmanMappedOperation => {
  const { pmOperation, oaOperation, varSetting, options, globals } = dto

  // Early exit if response body is not defined
  if (!varSetting.responseBodyProp) return pmOperation

  let pmJsonData = ''
  let pmMappedData = ''
  let pmVarAssign = ''
  const toggleLog = options?.logAssignVariables === false ? '// ' : ''

  // Only set the jsonData once
  if (!pmOperation.testJsonDataInjected) {
    pmJsonData = [
      `// Set response object as internal variable\n`,
      `let jsonData = {};\n`,
      `try {jsonData = pm.response.json();}catch(e){}\n`
    ].join('')
    pmOperation.testJsonDataInjected = true
  }

  const root = varSetting.responseBodyProp === '.'
  const opsRef = pmOperation.id ? pmOperation.id : pmOperation.pathVar

  // Generate property path from template
  const casedProp = parseTpl({
    template: varSetting.responseBodyProp,
    oaOperation,
    options: {
      casing: globals?.variableCasing,
      caseOnlyExpressions: true
    }
  })
  const prop = hasTpl(varSetting?.responseBodyProp) ? casedProp : varSetting.responseBodyProp

  const varSafeProp = renderBracketPath(prop)
  const varProp = varSafeProp.charAt(0) === '[' ? `${varSafeProp}` : root ? '' : `.${varSafeProp}`
  const nameProp = prop.charAt(0) !== '[' ? `.${prop}` : prop

  // Generate variable name from template
  const tpl = varSetting?.name || hasTpl(varSetting?.name) ? varSetting?.name : '<opsRef><nameProp>'
  const casedVarName = parseTpl({
    template: tpl,
    oaOperation,
    dynamicValues: {
      nameProp: nameProp,
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

  const varPath = `${renderChainPath(`jsonData${varProp}`)}`
  const sanitizedVarProp = sanitizeKeyForVar(varProp)
  const pathVarName = `_${changeCase(`res${sanitizedVarProp.replace(/\[/g, '')}`, 'camelCase')}`

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
