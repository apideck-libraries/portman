import { OasMappedOperation } from 'lib/oas/OasMappedOperation'
import { PostmanMappedOperation } from 'lib/postman/PostmanMappedOperation'
import { setTestScript } from './setTestScript'

export const checkForResponseStatusSuccess = (
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

  setTestScript(pmOperation, pmTest)

  return pmOperation
}
