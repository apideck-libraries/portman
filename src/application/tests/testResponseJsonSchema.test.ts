import { testResponseJsonSchema } from 'application'
import { OasMappedOperation } from 'oas'
import { OpenAPIV3 } from 'openapi-types'
import { PostmanMappedOperation } from 'postman'
import { getOasMappedOperation } from 'testUtils/getOasMappedOperation'
import { getPostmanMappedOperation } from 'testUtils/getPostmanMappedOperation'

describe('testResponseJsonSchema', () => {
  let oasOperation: OasMappedOperation
  let pmOperation: PostmanMappedOperation

  beforeEach(async () => {
    oasOperation = await getOasMappedOperation()
    pmOperation = await getPostmanMappedOperation()
  })

  it('should add test for valid json schema', async () => {
    const schema = (oasOperation.schema?.responses?.['200'] as OpenAPIV3.ResponseObject)?.content
    pmOperation = testResponseJsonSchema(schema, pmOperation, oasOperation)
    const pmTest = pmOperation.getTests()
    expect(pmTest.script.exec).toMatchSnapshot()
  })
})
