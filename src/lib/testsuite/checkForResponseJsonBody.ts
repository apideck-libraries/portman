import { OasMappedOperation } from 'lib/oas/OasMappedOperation'
import { PostmanMappedOperation } from 'lib/postman/PostmanMappedOperation'
import { setTestScript } from './setTestScript'

export const checkForResponseJsonBody = (
  pmOperation: PostmanMappedOperation,
  _aOperation: OasMappedOperation
): PostmanMappedOperation => {
  // Check - Response json body check
  const pmTest: string = [
    `// Validate if response has JSON Body \n`,
    `pm.test("[${pmOperation.method.toUpperCase()}]::${pmOperation.path}`,
    ` - Response has JSON Body", function () {\n`,
    `    pm.response.to.have.jsonBody();`,
    `});\n`
  ].join('')

  setTestScript(pmOperation, pmTest)

  return pmOperation
}
