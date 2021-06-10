import { PostmanMappedOperation } from 'lib/postman/PostmanMappedOperation'
import { ExtendTestsConfig } from 'types/PortmanConfig'
import { writeOperationTestScript } from './writeOperationTestScript'

/**
 * Extend the Portman tests with additional Postman tests
 * @param extSetting
 * @param pmOperation
 */
export const extendTest = (
  extSetting: ExtendTestsConfig,
  pmOperation: PostmanMappedOperation
  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
): PostmanMappedOperation => {
  // Early exit if tests are not defined
  if (!extSetting.tests) return pmOperation

  const pmTests = extSetting.tests.join('\n')

  writeOperationTestScript(pmOperation, pmTests, extSetting.overwrite, extSetting.append)

  return pmOperation
}
