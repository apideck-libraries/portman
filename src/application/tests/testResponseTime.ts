import { writeOperationTestScript } from '../../application'
import { PostmanMappedOperation } from '../../postman'
import { ResponseTime } from '../../types'

export const testResponseTime = (
  responseTime: ResponseTime,
  pmOperation: PostmanMappedOperation
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
