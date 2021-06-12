import { testResponseJsonBody } from 'application'
import { OasMappedOperation } from 'oas'
import { PostmanMappedOperation } from 'postman'
import { getOasMappedOperation } from 'testUtils/getOasMappedOperation'
import { getPostmanMappedOperation } from 'testUtils/getPostmanMappedOperation'

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
