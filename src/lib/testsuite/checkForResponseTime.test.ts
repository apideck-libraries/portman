import { OasMappedOperation, PostmanMappedOperation } from '..'
import { getOasMappedOperation } from '../../../__tests__/getOasMappedOperation'
import { getPostmanMappedOperation } from '../../../__tests__/getPostmanMappedOperation'
import { checkForResponseTime } from './checkForResponseTime'

describe('checkForResponseTime', () => {
  let oasOperation: OasMappedOperation
  let pmOperation: PostmanMappedOperation

  beforeEach(async () => {
    oasOperation = await getOasMappedOperation()
    pmOperation = await getPostmanMappedOperation()
  })

  it('should add test for response time', async () => {
    pmOperation = checkForResponseTime({ responseTime: { maxMs: 300 } }, pmOperation, oasOperation)
    const pmTest = pmOperation.getTests()
    expect(pmTest.script.exec).toMatchSnapshot()
  })
})
