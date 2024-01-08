import { writeOperationTestScript } from '../../application'
import { OasMappedOperation } from '../../oas'
import { PostmanMappedOperation } from '../../postman'
import { GlobalConfig } from 'types'

export const testResponseBodyEmpty = (
  pmOperation: PostmanMappedOperation,
  _aOperation: OasMappedOperation,
  config?: GlobalConfig
): PostmanMappedOperation => {
  // Separator
  const split = config?.separatorSymbol || '::'
  // Check - Response empty body check
  const pmTest: string = [
    `// Validate if response has empty Body \n`,
    `pm.test("[${pmOperation.method.toUpperCase()}]${split}${pmOperation.path}`,
    ` - Response has empty Body", function () {\n`,
    `    pm.response.to.not.be.withBody;\n`,
    `});\n`
  ].join('')

  writeOperationTestScript(pmOperation, pmTest)

  return pmOperation
}
