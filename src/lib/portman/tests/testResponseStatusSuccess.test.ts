import { OasMappedOperation, PostmanMappedOperation } from '../../'
import { getOasMappedOperation } from '../../../../__tests__/getOasMappedOperation'
import { getPostmanMappedOperation } from '../../../../__tests__/getPostmanMappedOperation'
import { testResponseStatusSuccess } from './testResponseStatusSuccess'

describe('testResponseStatusSuccess', () => {
  let oasOperation: OasMappedOperation
  let pmOperation: PostmanMappedOperation

  beforeEach(async () => {
    oasOperation = await getOasMappedOperation()
    pmOperation = await getPostmanMappedOperation()
  })

  it('should add test for status success', async () => {
    pmOperation = testResponseStatusSuccess(pmOperation, oasOperation)
    const pmTest = pmOperation.getTests()
    expect(pmTest.script.exec).toMatchSnapshot()
  })
})
