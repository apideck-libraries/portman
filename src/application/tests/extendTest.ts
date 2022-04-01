import fs from 'fs'
import { writeOperationTestScript } from '../../application'
import { PostmanMappedOperation } from '../../postman'
import { ExtendTestsConfig } from '../../types'

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

  const scriptContents = extSetting.tests.map(tst => {
    if (tst.startsWith('file:')) {
      return getScriptContent(tst.replace('file:', ''))
    } else {
      return `${tst}`
    }
  })

  const pmTests = scriptContents.join('\n')

  writeOperationTestScript(pmOperation, pmTests, extSetting.overwrite, extSetting.append)

  return pmOperation
}

function getScriptContent(scriptPath: string): string {
  try {
    return fs.readFileSync(scriptPath, { encoding: 'utf8', flag: 'r' })
  } catch (ex) {
    console.error(
      '\x1b[31m',
      `Config extended test script file error - no such file or directory "${scriptPath}"`
    )
    process.exit(1)
  }
}
