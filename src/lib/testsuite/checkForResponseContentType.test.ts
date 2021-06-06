import { OasMappedOperation, PostmanMappedOperation } from '..'
import { getOasMappedOperation } from '../../../__tests__/getOasMappedOperation'
import { getPostmanMappedOperation } from '../../../__tests__/getPostmanMappedOperation'
import { checkForResponseContentType } from './checkForResponseContentType'

describe('checkForResponseContentType', () => {
  let oasOperation: OasMappedOperation
  let pmOperation: PostmanMappedOperation

  beforeEach(async () => {
    oasOperation = await getOasMappedOperation()
    pmOperation = await getPostmanMappedOperation()
  })

  it('should add test for content type', async () => {
    pmOperation = checkForResponseContentType('application/json', pmOperation, oasOperation)
    const pmTest = pmOperation.getTests()
    expect(pmTest.script.exec).toMatchSnapshot()
  })
})
