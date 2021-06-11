import { testResponseTime } from 'application'
import { OasMappedOperation } from 'oas'
import { PostmanMappedOperation } from 'postman'
import { getOasMappedOperation } from 'testUtils/getOasMappedOperation'
import { getPostmanMappedOperation } from 'testUtils/getPostmanMappedOperation'

describe('testResponseTime', () => {
  let oasOperation: OasMappedOperation
  let pmOperation: PostmanMappedOperation

  beforeEach(async () => {
    oasOperation = await getOasMappedOperation()
    pmOperation = await getPostmanMappedOperation()
  })

  it('should add test for response time', async () => {
    pmOperation = testResponseTime({ enabled: true, maxMs: 300 }, pmOperation, oasOperation)
    const pmTest = pmOperation.getTests()
    expect(pmTest.script.exec).toMatchSnapshot()
  })
})
