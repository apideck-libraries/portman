import { OasMappedOperation } from 'lib/oas/OasMappedOperation'
import { PostmanMappedOperation } from 'lib/postman/PostmanMappedOperation'
import { inRange } from '../../utils/inRange'
import { append } from './append'

export const generateForSuccessStatus = (
  pmOperation: PostmanMappedOperation,
  oaOperation: OasMappedOperation
): PostmanMappedOperation => {
  // Add status success check
  if (!oaOperation.schema?.responses) return pmOperation

  for (const [code] of Object.entries(oaOperation.schema.responses)) {
    // // Only support 2xx response checks - Happy path
    if (!inRange(parseInt(code), 200, 299)) {
      continue // skip this response
    }
    // Check - Success 2xx response checks
    const pmTest: string[] = []
    pmTest.push('// Validate status 2xx \n')
    pmTest.push('pm.test("[' + pmOperation.method.toUpperCase() + '] ' + pmOperation.path)
    pmTest.push(' - Status code is 2xx", function () {\n')
    pmTest.push('   pm.response.to.be.success;\n')
    pmTest.push('});\n')

    append(pmOperation, pmTest.join(''))
  }

  return pmOperation
}
