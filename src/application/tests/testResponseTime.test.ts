import { getPostmanMappedOperation } from '../../../__tests__/testUtils/getPostmanMappedOperation'
import { testResponseTime } from '../../application'
import { PostmanMappedOperation } from '../../postman'
import { GlobalConfig } from '../../types'

describe('testResponseTime', () => {
  let pmOperation: PostmanMappedOperation

  beforeEach(async () => {
    pmOperation = await getPostmanMappedOperation()
  })

  it('should add test for response time', async () => {
    pmOperation = testResponseTime({ enabled: true, maxMs: 300 }, pmOperation)
    const pmTest = pmOperation.getTests()
    expect(pmTest.script.exec).toMatchSnapshot()
  })

  it('should add test with separator symbol for response time', async () => {
    const globalConfig = { separatorSymbol: '==' } as GlobalConfig
    pmOperation = testResponseTime({ enabled: true, maxMs: 300 }, pmOperation, globalConfig)
    const pmTest = pmOperation.getTests()
    expect(pmTest.script.exec).toMatchSnapshot()
  })
})
