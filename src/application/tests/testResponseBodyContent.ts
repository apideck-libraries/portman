import { writeOperationTestScript } from '../../application'
import { PostmanMappedOperation } from '../../postman'
import { GlobalConfig, ResponseBodyTest } from '../../types'
import { renderBracketPath, renderChainPath, sanitizeKeyForVar } from '../../utils'
import { changeCase } from 'openapi-format'

export const testResponseBodyContent = (
  responseBodyTests: ResponseBodyTest[],
  pmOperation: PostmanMappedOperation,
  config?: GlobalConfig
): PostmanMappedOperation => {
  responseBodyTests.map(check => {
    let pmJsonData = ''
    let pmMappedData = ''
    let pmHelperContains = ''
    let pmTestKey = ''
    let pmTestValue = ''
    let pmTestContains = ''
    let pmTestOneOf = ''
    let pmTestLength = ''
    let pmTestMinLength = ''
    let pmTestMaxLength = ''
    let pmTestAssert = ''

    // Separator
    const split = config?.separatorSymbol ?? '::'

    let checkKey = check.key

    // Only set the jsonData once
    if (!pmOperation.testJsonDataInjected) {
      pmJsonData = [
        `// Set response object as internal variable\n`,
        `let jsonData = {};\n`,
        `try {jsonData = pm.response.json();}catch(e){}\n`
      ].join('')
      // sets pmResponseJsonVarInjected on TestSuite
      pmOperation.testJsonDataInjected = true
    }

    // Detect if key contains a *
    let sourceVarName = ''
    if (check.key.includes('[*]') && check.value) {
      const keyPaths = check.key.split('[*].')

      if (keyPaths.length === 2) {
        // const keyArraySafeValue =renderBracketPath(`jsonData.${keyPaths[0]}`)
        const keyArrayPath = `${renderChainPath(`jsonData.${keyPaths[0]}`)}`
        const safeKeyPart = sanitizeKeyForVar(keyPaths[0].replace(/\[/g, ''))
        const pathArrayVarName = `_resArray${changeCase(safeKeyPart, 'pascalCase')}`
        const safeKeyFull = sanitizeKeyForVar(check.key.replace(/\[/g, ''))
        sourceVarName = `_resArray${changeCase(safeKeyFull, 'pascalCase')}`

        // Only set the pathArrayVarName once
        if (!pmOperation.mappedVars.includes(pathArrayVarName)) {
          // Register Portman request variable name
          pmOperation.registerVar(pathArrayVarName)
          pmOperation.registerVar(sourceVarName)

          pmHelperContains = [
            `const ${pathArrayVarName} = ${keyArrayPath};\n`,
            `const ${sourceVarName} = ${pathArrayVarName}.find(c => c.${keyPaths[1]} === ${JSON.stringify(check.value)});\n`
          ].join('')

          // Set last part as key
          checkKey = keyPaths[1]
        }
      }
    }

    // Detect if target is ROOT element/array or property
    const isRoot = checkKey === '.'
    const isArray = checkKey.startsWith('[')
    const sourceData = sourceVarName ? `${sourceVarName}` : `jsonData`
    const keyLabel = isRoot ? `ROOT` : `${checkKey}`
    const keySafeValue = renderBracketPath(checkKey)
    const keyValue = isRoot
      ? ``
      : isArray || keySafeValue.startsWith('[')
        ? `${keySafeValue}`
        : `.${keySafeValue}`
    const keyPath = `${renderChainPath(`${sourceData}${keyValue}`)}`
    const safeKeyForVar = sanitizeKeyForVar(keyValue.replace(/\[/g, ''))
    const pathVarName = `_${changeCase(`res${safeKeyForVar}`, 'camelCase')}`

    if (check.hasOwnProperty('key')) {
      // Only set the pathVarName once
      if (!pmOperation.mappedVars.includes(pathVarName)) {
        // Register Portman request variable name
        pmOperation.registerVar(pathVarName)
        pmMappedData = [
          `// Set property value as variable\n`,
          `const ${pathVarName} = ${keyPath};\n`
        ].join('')
      }

      const negate = check.notExist === true ? '===' : '!=='
      const negateLabel = check.notExist === true ? 'not exists' : 'exists'
      const label = check.notExist === true ? 'not have' : 'have'

      pmTestKey = [
        `// Response body should ${label} ${JSON.stringify(keyLabel)}\n`,
        `pm.test(${JSON.stringify(`[${pmOperation.method.toUpperCase()}]${split}${pmOperation.path} - Content check if '${keyLabel}' ${negateLabel}`)}, function() {\n`,
        `   pm.expect(${pathVarName} ${negate} undefined).to.be.true;\n`,
        `});\n`
      ].join('')
    }

    if (check.hasOwnProperty('value')) {
      let checkValue = check.value
      if (typeof check.value === 'string') {
        // Quote string value
        checkValue = JSON.stringify(check.value)
        // Get collection variables
        if (check.value.includes('{{') && check.value.includes('}}')) {
          checkValue = `pm.collectionVariables.get(${JSON.stringify(check.value.replace(/{{|}}/g, ''))})`
        }
      } else {
        checkValue = JSON.stringify(check.value)
      }

      pmTestValue = [
        `// Response body should have value ${JSON.stringify(check.value)} for ${JSON.stringify(keyLabel)}\n`,
        `if (${pathVarName} !== undefined) {\n`,
        `pm.test(${JSON.stringify(`[${pmOperation.method.toUpperCase()}]${split}${pmOperation.path} - Content check if value for '${keyLabel}' matches '${check.value}'`)}, function() {\n`,
        `  pm.expect(${pathVarName}).to.eql(${checkValue});\n`,
        `})};\n`
      ].join('')
    }

    if (check.hasOwnProperty('contains')) {
      let checkContains = check.contains
      if (typeof check.contains === 'string') {
        // Quote string value
        checkContains = JSON.stringify(check.contains)
        // Get collection variables
        if (check.contains.includes('{{') && check.contains.includes('}}')) {
          checkContains = `pm.collectionVariables.get(${JSON.stringify(check.contains.replace(/{{|}}/g, ''))})`
        }
      } else {
        checkContains = JSON.stringify(check.contains)
      }

      pmTestContains = [
        `// Response body should contain value ${JSON.stringify(check.contains)} for ${JSON.stringify(keyLabel)}\n`,
        `if (${pathVarName} !== undefined) {\n`,
        `pm.test(${JSON.stringify(`[${pmOperation.method.toUpperCase()}]${split}${pmOperation.path} - Content check if value for '${keyLabel}' contains '${check.contains}'`)}, function() {\n`,
        `  pm.expect(${pathVarName}).to.include(${checkContains});\n`,
        `})};\n`
      ].join('')
    }

    if (check.hasOwnProperty('oneOf')) {
      if (Array.isArray(check.oneOf)) {
        // Make items safe to inject into test
        const safeOneOf = check.oneOf.map(item => {
          if (typeof item === 'string') {
            let checkOneOfItem = item
            if (checkOneOfItem.includes('{{') && checkOneOfItem.includes('}}')) {
              checkOneOfItem = `pm.collectionVariables.get(${JSON.stringify(
                checkOneOfItem.replace(/{{|}}/g, '')
              )})`
              return checkOneOfItem
            }
            // Quote string value
            return JSON.stringify(checkOneOfItem)
          }
          return JSON.stringify(item)
        })

        pmTestOneOf = [
          `// Response body should be one of the values ${JSON.stringify(check.oneOf)} for ${JSON.stringify(keyLabel)}\n`,
          `if (${pathVarName} !== undefined) {\n`,
          `pm.test(${JSON.stringify(`[${pmOperation.method.toUpperCase()}]${split}${pmOperation.path} - Content check if value for '${keyLabel}' is matching one of: '${check.oneOf}'`)}, function() {\n`,
          `  pm.expect(${pathVarName}).to.be.oneOf([${safeOneOf.join(', ')}]);\n`,
          `})};\n`
        ].join('')
      }
    }

    if (check.hasOwnProperty('length')) {
      let checkLength = check.length
      if (typeof check.length === 'string') {
        // Quote string value
        checkLength = JSON.stringify(check.length)
        // Get collection variables
        if (check.length.includes('{{') && check.length.includes('}}')) {
          checkLength = `pm.collectionVariables.get(${JSON.stringify(check.length.replace(/{{|}}/g, ''))})`
        }
      } else {
        checkLength = JSON.stringify(check.length)
      }

      pmTestLength = [
        `// Response body should have a length of ${JSON.stringify(check.length)} for ${JSON.stringify(keyLabel)}\n`,
        `if (${pathVarName} !== undefined) {\n`,
        `pm.test(${JSON.stringify(`[${pmOperation.method.toUpperCase()}]${split}${pmOperation.path} - Content check if value of '${keyLabel}' has a length of '${check.length}'`)}, function() {\n`,
        `  pm.expect(${sourceData}${keyValue}.length).to.equal(${checkLength});\n`,
        `})};\n`
      ].join('')
    }

    if (check.hasOwnProperty('minLength')) {
      let checkMinLength = check.minLength
      if (typeof check.minLength === 'string') {
        // Quote string value
        checkMinLength = JSON.stringify(check.minLength)
        // Get collection variables
        if (check.minLength.includes('{{') && check.minLength.includes('}}')) {
          checkMinLength = `pm.collectionVariables.get(${JSON.stringify(check.minLength.replace(/{{|}}/g, ''))})`
        }
      } else {
        checkMinLength = JSON.stringify(check.minLength)
      }

      pmTestMinLength = [
        `// Response body should have a minimum length of ${JSON.stringify(check.minLength)} for ${JSON.stringify(keyLabel)}\n`,
        `if (${pathVarName} !== undefined) {\n`,
        `pm.test(${JSON.stringify(`[${pmOperation.method.toUpperCase()}]${split}${pmOperation.path} - Content check if value of '${keyLabel}' has a minimum length of '${check.minLength}'`)}, function() {\n`,
        `  pm.expect(${sourceData}${keyValue}.length).is.at.least(${checkMinLength});\n`,
        `})};\n`
      ].join('')
    }

    if (check.hasOwnProperty('maxLength')) {
      let checkMaxLength = check.maxLength
      if (typeof check.maxLength === 'string') {
        // Quote string value
        checkMaxLength = JSON.stringify(check.maxLength)
        // Get collection variables
        if (check.maxLength.includes('{{') && check.maxLength.includes('}}')) {
          checkMaxLength = `pm.collectionVariables.get(${JSON.stringify(check.maxLength.replace(/{{|}}/g, ''))})`
        }
      } else {
        checkMaxLength = JSON.stringify(check.maxLength)
      }

      pmTestMaxLength = [
        `// Response body should have a maximum length of ${JSON.stringify(check.maxLength)} for ${JSON.stringify(keyLabel)}\n`,
        `if (${pathVarName} !== undefined) {\n`,
        `pm.test(${JSON.stringify(`[${pmOperation.method.toUpperCase()}]${split}${pmOperation.path} - Content check if value of '${keyLabel}' has a maximum length of '${check.maxLength}'`)}, function() {\n`,
        `  pm.expect(${sourceData}${keyValue}.length).is.at.most(${checkMaxLength});\n`,
        `})};\n`
      ].join('')
    }

    if (check.hasOwnProperty('assert') && check.assert) {
      // strip . from beginning & end of assert property, remove double .., replace ' with single "
      const cleanAssert = check.assert
        .replace(/\.\./g, '.')
        .replace(/^\.|\.$/g, '')
        .replace(/'/g, '"')
      const cleanAssertLabel = cleanAssert.replace(/"/g, "'")

      pmTestAssert = [
        `// Response body value for ${JSON.stringify(keyLabel)} ${JSON.stringify(cleanAssert)}\n`,
        `if (${pathVarName} !== undefined) {\n`,
        `pm.test(${JSON.stringify(`[${pmOperation.method.toUpperCase()}]${split}${pmOperation.path} - Content check if value for '${keyLabel}' '${cleanAssertLabel}'`)}, function() {\n`,
        `  pm.expect(${sourceData}${keyValue}).${cleanAssert};\n`,
        `})};\n`
      ].join('')
    }

    if (pmJsonData !== '') writeOperationTestScript(pmOperation, pmJsonData)
    if (pmHelperContains !== '') writeOperationTestScript(pmOperation, pmHelperContains)
    if (pmMappedData !== '') writeOperationTestScript(pmOperation, pmMappedData)
    if (pmTestKey !== '') writeOperationTestScript(pmOperation, pmTestKey)
    if (pmTestValue !== '') writeOperationTestScript(pmOperation, pmTestValue)
    if (pmTestContains !== '') writeOperationTestScript(pmOperation, pmTestContains)
    if (pmTestOneOf !== '') writeOperationTestScript(pmOperation, pmTestOneOf)
    if (pmTestLength !== '') writeOperationTestScript(pmOperation, pmTestLength)
    if (pmTestMinLength !== '') writeOperationTestScript(pmOperation, pmTestMinLength)
    if (pmTestMaxLength !== '') writeOperationTestScript(pmOperation, pmTestMaxLength)
    if (pmTestAssert !== '') writeOperationTestScript(pmOperation, pmTestAssert)
  })

  return pmOperation
}
