import { getPostmanMappedOperation } from '../../../__tests__/testUtils/getPostmanMappedOperation'
import { testResponseTime } from '../../application'
import { PostmanMappedOperation } from '../../postman'

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
})
