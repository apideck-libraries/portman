import { OasMappedOperation } from 'lib/oas/OasMappedOperation'
import { PostmanMappedOperation } from 'lib/postman/PostmanMappedOperation'
import { writeOperationTestScript } from './writeOperationTestScript'

export const testResponseStatusSuccess = (
  pmOperation: PostmanMappedOperation,
  _oaOperation: OasMappedOperation
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
