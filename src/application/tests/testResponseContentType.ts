import { writeOperationTestScript } from '../../application'
import { OasMappedOperation } from '../../oas'
import { PostmanMappedOperation } from '../../postman'
import { GlobalConfig } from 'types'

export const testResponseContentType = (
  contentType: string,
  pmOperation: PostmanMappedOperation,
  _aOperation: OasMappedOperation,
  config?: GlobalConfig
): PostmanMappedOperation => {
  // Separator
  const split = config?.separatorSymbol ?? '::'
  // Check - Response content-type check
  const pmTest: string = [
    `// Validate if response header has matching content-type\n`,
    `pm.test("[${pmOperation.method.toUpperCase()}]${split}${pmOperation.path}`,
    ` - Content-Type is ${contentType}", function () {\n`,
    `   pm.expect(pm.response.headers.get("Content-Type")).to.include("${contentType}");\n`,
    `});\n`
  ].join('')

  writeOperationTestScript(pmOperation, pmTest)

  return pmOperation
}
