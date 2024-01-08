import { getPostmanMappedOperation } from '../../../__tests__/testUtils/getPostmanMappedOperation'
import { testResponseStatusCode } from '../../application'
import { PostmanMappedOperation } from '../../postman'
import { GlobalConfig } from '../../types'

describe('testResponseStatusCode', () => {
  let pmOperation: PostmanMappedOperation

  beforeEach(async () => {
    pmOperation = await getPostmanMappedOperation()
  })

  it('should add test for status code', async () => {
    pmOperation = testResponseStatusCode({ enabled: true, code: 400 }, pmOperation)
    const pmTest = pmOperation.getTests()
    expect(pmTest.script.exec).toMatchSnapshot()
  })

  it('should add test with separator symbol for status code', async () => {
    const globalConfig = { separatorSymbol: '==' } as GlobalConfig
    pmOperation = testResponseStatusCode({ enabled: true, code: 400 }, pmOperation, globalConfig)
    const pmTest = pmOperation.getTests()
    expect(pmTest.script.exec).toMatchSnapshot()
  })
})
