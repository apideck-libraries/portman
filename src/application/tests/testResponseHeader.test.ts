import { testResponseHeader } from 'application'
import { OasMappedOperation } from 'oas'
import { PostmanMappedOperation } from 'postman'
import { getOasMappedOperation } from 'testUtils/getOasMappedOperation'
import { getPostmanMappedOperation } from 'testUtils/getPostmanMappedOperation'

describe('testResponseHeader', () => {
  let oasOperation: OasMappedOperation
  let pmOperation: PostmanMappedOperation

  beforeEach(async () => {
    oasOperation = await getOasMappedOperation()
    pmOperation = await getPostmanMappedOperation()
  })

  it('should add test for response header', async () => {
    pmOperation = testResponseHeader('x-unify-request-id', pmOperation, oasOperation)
    const pmTest = pmOperation.getTests()
    expect(pmTest.script.exec).toMatchSnapshot()
  })
})
