import { writeOperationTestScript } from '../../application'
import { PostmanMappedOperation } from '../../postman'

export const testResponseStatusSuccess = (
  pmOperation: PostmanMappedOperation
): PostmanMappedOperation => {
  // Check - Success 2xx response checks
  const pmTest: string = [
    '// Validate status 2xx \n',
    `pm.test("[${pmOperation.method.toUpperCase()}]::${pmOperation.path}`,
    ' - Status code is 2xx", function () {\n',
    '   pm.response.to.be.success;\n',
    '});\n'
  ].join('')

  writeOperationTestScript(pmOperation, pmTest)

  return pmOperation
}
