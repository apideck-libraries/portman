import { OasMappedOperation } from 'lib/oas/OasMappedOperation'
import { PostmanMappedOperation } from 'lib/postman/PostmanMappedOperation'
import { append } from './append'

export const checkForResponseContentType = (
  contentType: string,
  pmOperation: PostmanMappedOperation,
  _aOperation: OasMappedOperation
): PostmanMappedOperation => {
  // Check - Response content-type check
  const pmTest: string = [
    `// Validate content-type \n`,
    `pm.test("[${pmOperation.method.toUpperCase()}]::${pmOperation.path}`,
    ` - Content-Type is ${contentType}", function () {\n`,
    `   pm.expect(pm.response.headers.get("Content-Type")).to.include("${contentType}");\n`,
    `});\n`
  ].join('')

  append(pmOperation, pmTest)

  return pmOperation
}
