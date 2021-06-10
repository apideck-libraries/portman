import { OasMappedOperation } from 'lib/oas/OasMappedOperation'
import { PostmanMappedOperation } from 'lib/postman/PostmanMappedOperation'
import { writeOperationTestScript } from './writeOperationTestScript'

export const testResponseContentType = (
  contentType: string,
  pmOperation: PostmanMappedOperation,
  _aOperation: OasMappedOperation
): PostmanMappedOperation => {
  // Check - Response content-type check
  const pmTest: string = [
    `// Validate if response header has matching content-type\n`,
    `pm.test("[${pmOperation.method.toUpperCase()}]::${pmOperation.path}`,
    ` - Content-Type is ${contentType}", function () {\n`,
    `   pm.expect(pm.response.headers.get("Content-Type")).to.include("${contentType}");\n`,
    `});\n`
  ].join('')

  writeOperationTestScript(pmOperation, pmTest)

  return pmOperation
}
