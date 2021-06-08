import { PostmanMappedOperation } from 'lib/postman/PostmanMappedOperation'
import { append } from './append'
import { ResponseBodyTest } from 'types/TestSuiteConfig'
import { TestSuiteService } from 'application'

export const checkForContentInResponseBody = (
  contentTests: ResponseBodyTest[],
  pmOperation: PostmanMappedOperation,
  context: TestSuiteService
): PostmanMappedOperation => {
  // const pmTest: string[] = []

  contentTests.map(check => {
    let pmJsonData = ''
    let pmTestKey = ''
    let pmTestValue = ''
    // Only set the jsonData once
    if (!context.pmResponseJsonVarInjected) {
      pmJsonData = [
        `// Set response object as internal variable\n`,
        `let jsonData = pm.response.json();\n`
      ].join('')
      // sets pmResponseJsonVarInjected on TestSuite
      context.pmResponseJsonVarInjected = true
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
        // Get environment variables
        if (check.value.includes('{{') && check.value.includes('}}')) {
          checkValue = `pm.environment.get("${check.value.replace(/{{|}}/g, '')}")`
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
    append(pmOperation, pmJsonData)
    append(pmOperation, pmTestKey)
    append(pmOperation, pmTestValue)
  })

  return pmOperation
}
