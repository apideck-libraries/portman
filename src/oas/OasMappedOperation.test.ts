import { OpenAPIV3 } from 'openapi-types'
import { OasMappedOperation, OpenApiParser } from '../oas'

describe('OasMappedOperation', () => {
  let specOperation: OpenAPIV3.OperationObject
  let mappedOperation: OasMappedOperation

  const oasYml = '__tests__/fixtures/crm.yml'
  const parser = new OpenApiParser()

  const path = '/crm/companies'
  const method = 'post'

  beforeEach(async () => {
    await parser.convert({ inputFile: oasYml })
    const paths = parser.oas?.paths
    expect(paths).toBeDefined()

    specOperation = Object.values(paths)?.[0]?.['post'] || {}
    expect(specOperation).toBeDefined()
    mappedOperation = new OasMappedOperation(path, method, specOperation)
  })

  it(`should set itself up using operation and params`, () => {
    expect(mappedOperation).toMatchSnapshot()
  })

  it('should handle operationId not present', () => {
    const { operationId, ...operation } = specOperation
    mappedOperation = new OasMappedOperation(path, method, operation)
    expect(mappedOperation.id).not.toBeDefined()
  })

  describe('requestBodySchema', () => {
    it('should have access to the requestBody for mediaType', () => {
      const mediaType = 'application/json'
      const requestBody = mappedOperation.requestBodySchema(mediaType)
      expect(requestBody).toMatchSnapshot()
    })

    it('should return null for unknown mediaType', () => {
      const mediaType = 'application/xml'
      const requestBodySchema = mappedOperation.requestBodySchema(mediaType)
      expect(requestBodySchema).not.toBeDefined()
    })

    it('should return null when no requestBody schema exists', () => {
      const mediaType = 'application/xml'
      const { requestBody, ...operation } = specOperation
      mappedOperation = new OasMappedOperation(path, method, operation)

      const requestBodySchema = mappedOperation.requestBodySchema(mediaType)
      expect(requestBodySchema).not.toBeDefined()
    })
  })
})
