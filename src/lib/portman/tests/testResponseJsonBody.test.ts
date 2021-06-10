import { OasMappedOperation, PostmanMappedOperation } from '../../'
import { getOasMappedOperation } from '../../../../__tests__/getOasMappedOperation'
import { getPostmanMappedOperation } from '../../../../__tests__/getPostmanMappedOperation'
import { testResponseJsonBody } from './testResponseJsonBody'

describe('testResponseJsonBody', () => {
  let oasOperation: OasMappedOperation
  let pmOperation: PostmanMappedOperation

  beforeEach(async () => {
    oasOperation = await getOasMappedOperation()
    pmOperation = await getPostmanMappedOperation()
  })

  it('should add test for json body', async () => {
    pmOperation = testResponseJsonBody(pmOperation, oasOperation)
    const pmTest = pmOperation.getTests()
    expect(pmTest.script.exec).toMatchSnapshot()
  })
})
