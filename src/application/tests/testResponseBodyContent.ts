import { writeOperationTestScript } from '../../application'
import { PostmanMappedOperation } from '../../postman'
import { ResponseBodyTest } from '../../types'
import { renderBracketPath, renderChainPath } from '../../utils'
import { camelCase } from 'camel-case'

export const testResponseBodyContent = (
  responseBodyTests: ResponseBodyTest[],
  pmOperation: PostmanMappedOperation
): PostmanMappedOperation => {
  responseBodyTests.map(check => {
    let pmJsonData = ''
    let pmMappedData = ''
    let pmTestKey = ''
    let pmTestValue = ''
    let pmTestContains = ''
    let pmTestOneOf = ''
    let pmTestLength = ''
    let pmTestMinLength = ''
    let pmTestMaxLength = ''
    let pmTestAssert = ''

    // Detect if target is ROOT element/array or property
    const isRoot = check.key === '.'
    const isArray = check.key.startsWith('[')
    const keyLabel = isRoot ? `ROOT` : `${check.key}`
    const keySafeValue = renderBracketPath(check.key)
    const keyValue = isRoot
      ? ``
      : isArray || keySafeValue.startsWith('[')
      ? `${keySafeValue}`
      : `.${keySafeValue}`
    const keyPath = `${renderChainPath(`jsonData${keyValue}`)}`
    const pathVarName = `_${camelCase(`res${keyValue.replace(/\[/g, '')}`)}`

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
        `// Response body should ${label} "${keyLabel}"\n`,
        `pm.test("[${pmOperation.method.toUpperCase()}]::${pmOperation.path}`,
        ` - Content check if '${keyLabel}' ${negateLabel}", function() {\n`,
        `   pm.expect(${pathVarName} ${negate} undefined).to.be.true;\n`,
        `});\n`
      ].join('')
    }

    if (check.hasOwnProperty('value')) {
      let checkValue = check.value
      if (typeof check.value === 'string') {
        // Quote string value
        checkValue = `"${check.value}"`
        // Get collection variables
        if (check.value.includes('{{') && check.value.includes('}}')) {
          checkValue = `pm.collectionVariables.get("${check.value.replace(/{{|}}/g, '')}")`
        }
      }

      pmTestValue = [
        `// Response body should have value "${check.value}" for "${keyLabel}"\n`,
        `if (${pathVarName} !== undefined) {\n`,
        `pm.test("[${pmOperation.method.toUpperCase()}]::${pmOperation.path}`,
        ` - Content check if value for '${keyLabel}' matches '${check.value}'", function() {\n`,
        `  pm.expect(jsonData${keyValue}).to.eql(${checkValue});\n`,
        `})};\n`
      ].join('')
    }

    if (check.hasOwnProperty('contains')) {
      let checkContains = check.contains
      if (typeof check.contains === 'string') {
        // Quote string value
        checkContains = `"${check.contains}"`
        // Get collection variables
        if (check.contains.includes('{{') && check.contains.includes('}}')) {
          checkContains = `pm.collectionVariables.get("${check.contains.replace(/{{|}}/g, '')}")`
        }
      }

      pmTestContains = [
        `// Response body should contain value "${check.contains}" for "${keyLabel}"\n`,
        `if (${pathVarName} !== undefined) {\n`,
        `pm.test("[${pmOperation.method.toUpperCase()}]::${pmOperation.path}`,
        ` - Content check if value for '${keyLabel}' contains '${check.contains}'", function() {\n`,
        `  pm.expect(jsonData${keyValue}).to.include(${checkContains});\n`,
        `})};\n`
      ].join('')
    }

    if (check.hasOwnProperty('oneOf')) {
      if (Array.isArray(check.oneOf)) {
        // Make items safe to inject into test
        const safeOneOf = check.oneOf.map(item => {
          if (typeof item === 'string') {
            // Quote string value
            return `"${item}"`
          }
          return item
        })

        pmTestOneOf = [
          `// Response body should be one of the values "${check.oneOf}" for "${keyLabel}"\n`,
          `if (${pathVarName} !== undefined) {\n`,
          `pm.test("[${pmOperation.method.toUpperCase()}]::${pmOperation.path}`,
          ` - Content check if value for '${keyLabel}' is matching one of: '${check.oneOf}'", function() {\n`,
          `  pm.expect(jsonData${keyValue}).to.be.oneOf([${safeOneOf}]);\n`,
          `})};\n`
        ].join('')
      }
    }

    if (check.hasOwnProperty('length')) {
      let checkLength = check.length
      if (typeof check.length === 'string') {
        // Quote string value
        checkLength = `"${check.length}"`
        // Get collection variables
        if (check.length.includes('{{') && check.length.includes('}}')) {
          checkLength = `pm.collectionVariables.get("${check.length.replace(/{{|}}/g, '')}")`
        }
      }

      pmTestLength = [
        `// Response body should have a length of "${check.length}" for "${keyLabel}"\n`,
        `if (${pathVarName} !== undefined) {\n`,
        `pm.test("[${pmOperation.method.toUpperCase()}]::${pmOperation.path}`,
        ` - Content check if value of '${keyLabel}' has a length of '${check.length}'", function() {\n`,
        `  pm.expect(jsonData${keyValue}.length).to.equal(${checkLength});\n`,
        `})};\n`
      ].join('')
    }

    if (check.hasOwnProperty('minLength')) {
      let checkMinLength = check.minLength
      if (typeof check.minLength === 'string') {
        // Quote string value
        checkMinLength = `"${check.minLength}"`
        // Get collection variables
        if (check.minLength.includes('{{') && check.minLength.includes('}}')) {
          checkMinLength = `pm.collectionVariables.get("${check.minLength.replace(/{{|}}/g, '')}")`
        }
      }

      pmTestMinLength = [
        `// Response body should have a minimum length of "${check.minLength}" for "${keyLabel}"\n`,
        `if (${pathVarName} !== undefined) {\n`,
        `pm.test("[${pmOperation.method.toUpperCase()}]::${pmOperation.path}`,
        ` - Content check if value of '${keyLabel}' has a minimum length of '${check.minLength}'", function() {\n`,
        `  pm.expect(jsonData${keyValue}.length).is.at.least(${checkMinLength});\n`,
        `})};\n`
      ].join('')
    }

    if (check.hasOwnProperty('maxLength')) {
      let checkMaxLength = check.maxLength
      if (typeof check.maxLength === 'string') {
        // Quote string value
        checkMaxLength = `"${check.maxLength}"`
        // Get collection variables
        if (check.maxLength.includes('{{') && check.maxLength.includes('}}')) {
          checkMaxLength = `pm.collectionVariables.get("${check.maxLength.replace(/{{|}}/g, '')}")`
        }
      }

      pmTestMaxLength = [
        `// Response body should have a maximum length of "${check.maxLength}" for "${keyLabel}"\n`,
        `if (${pathVarName} !== undefined) {\n`,
        `pm.test("[${pmOperation.method.toUpperCase()}]::${pmOperation.path}`,
        ` - Content check if value of '${keyLabel}' has a maximum length of '${check.maxLength}'", function() {\n`,
        `  pm.expect(jsonData${keyValue}.length).is.at.most(${checkMaxLength});\n`,
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
        `// Response body value for "${keyLabel}" "${cleanAssert}"\n`,
        `if (${pathVarName} !== undefined) {\n`,
        `pm.test("[${pmOperation.method.toUpperCase()}]::${pmOperation.path}`,
        ` - Content check if value for '${keyLabel}' '${cleanAssertLabel}'", function() {\n`,
        `  pm.expect(jsonData${keyValue}).${cleanAssert};\n`,
        `})};\n`
      ].join('')
    }

    if (pmJsonData !== '') writeOperationTestScript(pmOperation, pmJsonData)
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
