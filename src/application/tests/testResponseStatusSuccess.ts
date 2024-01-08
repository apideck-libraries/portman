import { writeOperationTestScript } from '../../application'
import { PostmanMappedOperation } from '../../postman'
import { GlobalConfig } from 'types'

export const testResponseStatusSuccess = (
  pmOperation: PostmanMappedOperation,
  config?: GlobalConfig
): PostmanMappedOperation => {
  // Separator
  const split = config?.separatorSymbol || '::'

  // Check - Success 2xx response checks
  const pmTest: string = [
    '// Validate status 2xx \n',
    `pm.test("[${pmOperation.method.toUpperCase()}]${split}${pmOperation.path}`,
    ' - Status code is 2xx", function () {\n',
    '   pm.response.to.be.success;\n',
    '});\n'
  ].join('')

  writeOperationTestScript(pmOperation, pmTest)

  return pmOperation
}
