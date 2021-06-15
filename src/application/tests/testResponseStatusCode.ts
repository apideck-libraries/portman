import { writeOperationTestScript } from '../../application'
import { OasMappedOperation } from '../../oas'
import { PostmanMappedOperation } from '../../postman'
import { StatusCode } from '../../types'

export const testResponseStatusCode = (
  statusCode: StatusCode,
  pmOperation: PostmanMappedOperation,
  _oaOperation: OasMappedOperation
  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
): PostmanMappedOperation => {
  // Early exit if no code defined
  if (!statusCode?.code) return pmOperation

  const { code } = statusCode

  // Check - Response time
  const pmTest: string = [
    `// Validate response status code \n`,
    `pm.test("[${pmOperation.method.toUpperCase()}]::${pmOperation.path}`,
    ` - Response status code time is ${code}", function () {\n`,
    `    pm.expect(pm.response.code).to.equal(${code});\n`,
    `});\n`
  ].join('')

  writeOperationTestScript(pmOperation, pmTest)

  return pmOperation
}
