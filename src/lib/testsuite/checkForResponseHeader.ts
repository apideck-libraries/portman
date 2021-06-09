import { OasMappedOperation } from 'lib/oas/OasMappedOperation'
import { PostmanMappedOperation } from 'lib/postman/PostmanMappedOperation'
import { setTestScript } from './setTestScript'

export const checkForResponseHeader = (
  headerName: string,
  pmOperation: PostmanMappedOperation,
  _aOperation: OasMappedOperation
): PostmanMappedOperation => {
  // Check - Response header check
  const pmTest: string = [
    `// Validate if response header is present \n`,
    `pm.test("[${pmOperation.method.toUpperCase()}]::${pmOperation.path}`,
    ` - Response header ${headerName} is present", function () {\n`,
    `   pm.response.to.have.header("${headerName}");\n`,
    `});\n`
  ].join('')

  setTestScript(pmOperation, pmTest)

  return pmOperation
}
