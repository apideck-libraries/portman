import { OpenAPIV3 } from 'openapi-types'
import { OasMappedOperation, PostmanMappedOperation } from '..'
import { getOasMappedOperation } from '../../../__tests__/getOasMappedOperation'
import { getPostmanMappedOperation } from '../../../__tests__/getPostmanMappedOperation'
import { checkForResponseJsonSchema } from './checkForResponseJsonSchema'

describe('checkForResponseJsonSchema', () => {
  let oasOperation: OasMappedOperation
  let pmOperation: PostmanMappedOperation

  beforeEach(async () => {
    oasOperation = await getOasMappedOperation()
    pmOperation = await getPostmanMappedOperation()
  })

  it('should add test for valid json schema', async () => {
    const schema = (oasOperation.schema?.responses?.['200'] as OpenAPIV3.ResponseObject)?.content
    pmOperation = checkForResponseJsonSchema(schema, pmOperation, oasOperation)
    const pmTest = pmOperation.getTests()
    expect(pmTest.script.exec).toMatchSnapshot()
  })
})
