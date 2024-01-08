import { writeOperationTestScript } from '../../application'
import { OasMappedOperation } from '../../oas'
import { PostmanMappedOperation } from '../../postman'
import { GlobalConfig } from 'types'

export const testResponseHeader = (
  headerName: string,
  pmOperation: PostmanMappedOperation,
  _aOperation: OasMappedOperation | null,
  config?: GlobalConfig
): PostmanMappedOperation => {
  // Separator
  const split = config?.separatorSymbol || '::'
  // Check - Response header check
  const pmTest: string = [
    `// Validate if response header is present \n`,
    `pm.test("[${pmOperation.method.toUpperCase()}]${split}${pmOperation.path}`,
    ` - Response header ${headerName} is present", function () {\n`,
    `   pm.response.to.have.header("${headerName}");\n`,
    `});\n`
  ].join('')

  writeOperationTestScript(pmOperation, pmTest)

  return pmOperation
}
