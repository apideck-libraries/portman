import { OasMappedOperation, PostmanMappedOperation } from '..'
import { getOasMappedOperation } from '../../../__tests__/getOasMappedOperation'
import { getPostmanMappedOperation } from '../../../__tests__/getPostmanMappedOperation'
import { checkForResponseStatusSuccess } from './checkForResponseStatusSuccess'

describe('checkForResponseStatusSuccess', () => {
  let oasOperation: OasMappedOperation
  let pmOperation: PostmanMappedOperation

  beforeEach(async () => {
    oasOperation = await getOasMappedOperation()
    pmOperation = await getPostmanMappedOperation()
  })

  it('should add test for status success', async () => {
    pmOperation = checkForResponseStatusSuccess(pmOperation, oasOperation)
    const pmTest = pmOperation.getTests()
    expect(pmTest.script.exec).toMatchSnapshot()
  })
})
