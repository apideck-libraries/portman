import { OasMappedOperation, PostmanMappedOperation } from '../../'
import { getOasMappedOperation } from '../../../../__tests__/getOasMappedOperation'
import { getPostmanMappedOperation } from '../../../../__tests__/getPostmanMappedOperation'
import { testResponseTime } from './testResponseTime'

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
