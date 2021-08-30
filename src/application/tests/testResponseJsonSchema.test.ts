import { OpenAPIV3 } from 'openapi-types'
import { getOasMappedOperation } from '../../../__tests__/testUtils/getOasMappedOperation'
import { getPostmanMappedOperation } from '../../../__tests__/testUtils/getPostmanMappedOperation'
import { testResponseJsonSchema } from '../../application'
import { OasMappedOperation } from '../../oas'
import { PostmanMappedOperation } from '../../postman'

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

  it('should remove maxItems on items levels, for valid json schema', async () => {
    const schema = {
      type: 'array',
      items: {
        required: ['name'],
        properties: {
          id: {
            type: 'integer',
            example: 10
          },
          name: {
            type: 'string',
            example: 'doggie'
          },
          status: {
            type: 'string',
            description: 'pet status in the store',
            enum: ['available']
          }
        },
        type: 'object'
      },
      maxItems: 2
    }
    pmOperation = testResponseJsonSchema(schema, pmOperation, oasOperation)
    const pmTest = pmOperation.getTests()
    expect(pmTest.script.exec).toMatchSnapshot()
  })
})
