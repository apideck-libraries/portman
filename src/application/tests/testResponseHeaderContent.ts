import { testResponseHeader, writeOperationTestScript } from '../../application'
import { PostmanMappedOperation } from '../../postman'
import { ResponseHeaderTest } from '../../types'

export const testResponseHeaderContent = (
  ResponseHeaderTests: ResponseHeaderTest[],
  pmOperation: PostmanMappedOperation
): PostmanMappedOperation => {
  ResponseHeaderTests.map(check => {
    let pmTestValue = ''
    let pmTestContains = ''
    let pmTestOneOf = ''
    let pmTestLength = ''
    let pmTestMinLength = ''
    let pmTestMaxLength = ''

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
        `// Response header should have value "${check.value}" for "${check.key}"\n`,
        `pm.test("[${pmOperation.method.toUpperCase()}]::${pmOperation.path}`,
        ` - Content check if header value for '${check.key}' matches '${check.value}'", function() {\n`,
        `  pm.expect(pm.response.headers.get("${check.key}")).to.eql(${checkValue});\n`,
        `});\n`
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
        `// Response header should contain value "${check.contains}" for "${check.key}"\n`,
        `pm.test("[${pmOperation.method.toUpperCase()}]::${pmOperation.path}`,
        ` - Content check if header value for '${check.key}' contains '${check.contains}'", function() {\n`,
        `  pm.expect(pm.response.headers.get("${check.key}")).to.include(${checkContains});\n`,
        `});\n`
      ].join('')
    }

    if (check.oneOf) {
      if (Array.isArray(check.oneOf)) {
        // Make items safe to inject into test
        const safeOneOf = check.oneOf.map(item => {
          // Quote string value
          return `"${item}"`
        })

        pmTestOneOf = [
          `// Response header should be one of the values "${check.oneOf}" for "${check.key}"\n`,
          `pm.test("[${pmOperation.method.toUpperCase()}]::${pmOperation.path}`,
          ` - Content check if header value for '${check.key}' is matching one of: '${check.oneOf}'", function() {\n`,
          `  pm.expect(pm.response.headers.get("${check.key}")).to.be.oneOf([${safeOneOf}]);\n`,
          `});\n`
        ].join('')
      }
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
        `// Response header should have a length of "${check.length}" for "${check.key}"\n`,
        `pm.test("[${pmOperation.method.toUpperCase()}]::${pmOperation.path}`,
        ` - Content check if header value of '${check.key}' has a length of '${check.length}'", function() {\n`,
        `  pm.expect(pm.response.headers.get("${check.key}")).to.have.lengthOf(${checkLength});\n`,
        `});\n`
      ].join('')
    }

    if (check.minLength) {
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
        `// Response header should have a minimum length of "${check.minLength}" for "${check.key}"\n`,
        `pm.test("[${pmOperation.method.toUpperCase()}]::${pmOperation.path}`,
        ` - Content check if header value of '${check.key}' has a minimum length of '${check.minLength}'", function() {\n`,
        `  pm.expect(pm.response.headers.get("${check.key}").length).is.at.least(${checkMinLength});\n`,
        `});\n`
      ].join('')
    }

    if (check.maxLength) {
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
        `// Response header should have a maximum length of "${check.maxLength}" for "${check.key}"\n`,
        `pm.test("[${pmOperation.method.toUpperCase()}]::${pmOperation.path}`,
        ` - Content check if header value of '${check.key}' has a maximum length of '${check.maxLength}'", function() {\n`,
        `  pm.expect(pm.response.headers.get("${check.key}").length).is.at.most(${checkMaxLength});\n`,
        `});\n`
      ].join('')
    }

    if (check?.key) testResponseHeader(check.key, pmOperation, null)
    if (pmTestValue !== '') writeOperationTestScript(pmOperation, pmTestValue)
    if (pmTestContains !== '') writeOperationTestScript(pmOperation, pmTestContains)
    if (pmTestOneOf !== '') writeOperationTestScript(pmOperation, pmTestOneOf)
    if (pmTestLength !== '') writeOperationTestScript(pmOperation, pmTestLength)
    if (pmTestMinLength !== '') writeOperationTestScript(pmOperation, pmTestMinLength)
    if (pmTestMaxLength !== '') writeOperationTestScript(pmOperation, pmTestMaxLength)
  })

  return pmOperation
}
