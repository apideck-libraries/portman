import { writeOperationTestScript } from '../../application'
import { PostmanMappedOperation } from '../../postman'
import { GlobalConfig, ResponseTime } from '../../types'

export const testResponseTime = (
  responseTime: ResponseTime,
  pmOperation: PostmanMappedOperation,
  config?: GlobalConfig
  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
): PostmanMappedOperation => {
  // Early exit if no maxMs defined
  if (!responseTime?.maxMs) return pmOperation

  // Separator
  const split = config?.separatorSymbol ?? '::'

  const { maxMs } = responseTime

  // Check - Response time
  const pmTest: string = [
    `// Validate response time \n`,
    `pm.test("[${pmOperation.method.toUpperCase()}]${split}${pmOperation.path}`,
    ` - Response time is less than ${maxMs}ms", function () {\n`,
    `    pm.expect(pm.response.responseTime).to.be.below(${maxMs});\n`,
    `});\n`
  ].join('')

  writeOperationTestScript(pmOperation, pmTest)

  return pmOperation
}
