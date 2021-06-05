import { OasMappedOperation } from 'lib/oas/OasMappedOperation'
import { PostmanMappedOperation } from 'lib/postman/PostmanMappedOperation'
import { append } from './append'

export const checkForResponseHeader = (
  headerName: string,
  pmOperation: PostmanMappedOperation,
  _aOperation: OasMappedOperation
): PostmanMappedOperation => {
  // Check - Response header check
  const pmTest: string = [
    `// Validate header \n`,
    `pm.test("[${pmOperation.method.toUpperCase()}]::${pmOperation.path}`,
    ` - Response header ${headerName} is present", function () {\n`,
    `   pm.response.to.have.header("${headerName}");\\n`,
    `});\n`
  ].join('')

  append(pmOperation, pmTest)

  return pmOperation
}
