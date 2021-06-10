import { OasMappedOperation, PostmanMappedOperation } from '../../'
import { getOasMappedOperation } from '../../../../__tests__/getOasMappedOperation'
import { getPostmanMappedOperation } from '../../../../__tests__/getPostmanMappedOperation'
import { testResponseContentType } from './testResponseContentType'

describe('testResponseContentType', () => {
  let oasOperation: OasMappedOperation
  let pmOperation: PostmanMappedOperation

  beforeEach(async () => {
    oasOperation = await getOasMappedOperation()
    pmOperation = await getPostmanMappedOperation()
  })

  it('should add test for content type', async () => {
    pmOperation = testResponseContentType('application/json', pmOperation, oasOperation)
    const pmTest = pmOperation.getTests()
    expect(pmTest.script.exec).toMatchSnapshot()
  })
})
