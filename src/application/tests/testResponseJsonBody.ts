import { writeOperationTestScript } from '../../application'
import { PostmanMappedOperation } from '../../postman'
import { GlobalConfig } from 'types'

export const testResponseJsonBody = (
  pmOperation: PostmanMappedOperation,
  config?: GlobalConfig
): PostmanMappedOperation => {
  // Separator
  const split = config?.separatorSymbol || '::'
  // Check - Response json body check
  const pmTest: string = [
    `// Validate if response has JSON Body \n`,
    `pm.test("[${pmOperation.method.toUpperCase()}]${split}${pmOperation.path}`,
    ` - Response has JSON Body", function () {\n`,
    `    pm.response.to.have.jsonBody();\n`,
    `});\n`
  ].join('')

  writeOperationTestScript(pmOperation, pmTest)

  return pmOperation
}
