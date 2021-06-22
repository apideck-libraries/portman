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
    // Only set the jsonData once
    if (!pmOperation.testJsonDataInjected) {
      pmJsonData = [
        `// Set response object as internal variable\n`,
        `let jsonData = pm.response.json();\n`
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
        `if (typeof jsonData.${check.key} !== "undefined") {\n`,
        `pm.test("[${pmOperation.method.toUpperCase()}]::${pmOperation.path}`,
        ` - Content check if value for '${check.key}' matches '${check.value}'", function() {\n`,
        `  pm.expect(jsonData.${check.key}).to.eql(${checkValue});\n`,
        `})};`
      ].join('')
    }
    writeOperationTestScript(pmOperation, pmJsonData)
    writeOperationTestScript(pmOperation, pmTestKey)
    writeOperationTestScript(pmOperation, pmTestValue)
  })

  return pmOperation
}
