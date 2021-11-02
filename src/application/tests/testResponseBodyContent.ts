import { writeOperationTestScript } from '../../application'
import { PostmanMappedOperation } from '../../postman'
import { ResponseBodyTest } from '../../types'

export const testResponseBodyContent = (
  responseBodyTests: ResponseBodyTest[],
  pmOperation: PostmanMappedOperation
): PostmanMappedOperation => {
  responseBodyTests.map(check => {
    let pmJsonData = ''
    let pmTestKey = ''
    let pmTestValue = ''
    let pmTestContains = ''
    let pmTestLength = ''

    // Only set the jsonData once
    if (!pmOperation.testJsonDataInjected) {
      pmJsonData = [
        `// Set response object as internal variable\n`,
        `let jsonData = {};\n`,
        `try {jsonData = pm.response.json();}catch(e){}\n`
        // `let jsonData = pm.response.json();\n`
      ].join('')
      // sets pmResponseJsonVarInjected on TestSuite
      pmOperation.testJsonDataInjected = true
    }

    if (check.key) {
      pmTestKey = [
        `// Response body should have property "${check.key}"\n`,
        `pm.test("[${pmOperation.method.toUpperCase()}]::${pmOperation.path}`,
        ` - Content check if property '${check.key}' exists", function() {\n`,
        `   pm.expect((typeof jsonData.${check.key} !== "undefined")).to.be.true;\n`,
        `});\n`
      ].join('')
    }

    if (check.value) {
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
        `// Response body should have value "${check.value}" for "${check.key}"\n`,
        `if (jsonData?.${check.key}) {\n`,
        `pm.test("[${pmOperation.method.toUpperCase()}]::${pmOperation.path}`,
        ` - Content check if value for '${check.key}' matches '${check.value}'", function() {\n`,
        `  pm.expect(jsonData.${check.key}).to.eql(${checkValue});\n`,
        `})};\n`
      ].join('')
    }

    if (check.contains) {
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
        `// Response body should contain value "${check.contains}" for "${check.key}"\n`,
        `if (jsonData?.${check.key}) {\n`,
        `pm.test("[${pmOperation.method.toUpperCase()}]::${pmOperation.path}`,
        ` - Content check if value for '${check.key}' contains '${check.contains}'", function() {\n`,
        `  pm.expect(jsonData.${check.key}).to.include(${checkContains});\n`,
        `})};\n`
      ].join('')
    }

    if (check.length) {
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
        `// Response body should have a length of "${check.length}" for "${check.key}"\n`,
        `if (jsonData?.${check.key}) {\n`,
        `pm.test("[${pmOperation.method.toUpperCase()}]::${pmOperation.path}`,
        ` - Content check if value of '${check.key}' has a length of '${check.length}'", function() {\n`,
        `  pm.expect(jsonData.${check.key}).to.have.lengthOf(${checkLength});\n`,
        `})};\n`
      ].join('')
    }

    if (pmJsonData !== '') writeOperationTestScript(pmOperation, pmJsonData)
    if (pmTestKey !== '') writeOperationTestScript(pmOperation, pmTestKey)
    if (pmTestValue !== '') writeOperationTestScript(pmOperation, pmTestValue)
    if (pmTestContains !== '') writeOperationTestScript(pmOperation, pmTestContains)
    if (pmTestLength !== '') writeOperationTestScript(pmOperation, pmTestLength)
  })

  return pmOperation
}
