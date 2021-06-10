import { OasMappedOperation } from 'lib/oas/OasMappedOperation'
import { PostmanMappedOperation } from 'lib/postman/PostmanMappedOperation'
import { ResponseTime } from 'types/PortmanConfig'
import { writeOperationTestScript } from './writeOperationTestScript'

export const testResponseTime = (
  responseTime: ResponseTime,
  pmOperation: PostmanMappedOperation,
  _oaOperation: OasMappedOperation
  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
): PostmanMappedOperation => {
  // Early exit if no maxMs defined
  if (!responseTime?.maxMs) return pmOperation

  const { maxMs } = responseTime

  // Check - Response time
  const pmTest: string = [
    `// Validate response time \n`,
    `pm.test("[${pmOperation.method.toUpperCase()}]::${pmOperation.path}`,
    ` - Response time is less than ${maxMs}ms", function () {\n`,
    `    pm.expect(pm.response.responseTime).to.be.below(${maxMs});\n`,
    `});\n`
  ].join('')

  writeOperationTestScript(pmOperation, pmTest)

  return pmOperation
}
