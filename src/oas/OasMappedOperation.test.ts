import { OpenAPIV3, OpenAPIV3_1 } from 'openapi-types'
import { OasMappedOperation, OpenApiParser } from '../oas'

describe('OasMappedOperation', () => {
  let specOperation: OpenAPIV3.OperationObject
  let specOperation31: OpenAPIV3_1.OperationObject
  let mappedOperation: OasMappedOperation
  let mappedOperation31: OasMappedOperation

  const oasYml = '__tests__/fixtures/crm.yml'
  const oas31Yml = '__tests__/fixtures/crm31.yml'
  const parser = new OpenApiParser()
  const parser31 = new OpenApiParser()

  const path = '/crm/companies'
  const method = 'post'

  beforeEach(async () => {
    await parser.convert({ inputFile: oasYml })
    const paths = parser.oas?.paths as OpenAPIV3.PathsObject
    expect(paths).toBeDefined()

    specOperation = Object.values(paths)?.[0]?.['post'] || ({} as OpenAPIV3.OperationObject)
    expect(specOperation).toBeDefined()
    mappedOperation = new OasMappedOperation(path, method, specOperation)

    await parser31.convert({ inputFile: oas31Yml })
    const paths31 = parser.oas?.paths as OpenAPIV3_1.PathsObject
    expect(paths31).toBeDefined()

    specOperation31 = Object.values(paths31)?.[0]?.['post'] || {}
    expect(specOperation31).toBeDefined()
    mappedOperation31 = new OasMappedOperation(path, method, specOperation31)
  })

  it(`should set itself up using operation and params`, () => {
    expect(mappedOperation).toMatchSnapshot()
  })

  it('should handle operationId not present', () => {
    const { operationId, ...operation } = specOperation
    mappedOperation = new OasMappedOperation(path, method, operation)
    expect(mappedOperation.id).not.toBeDefined()
  })

  it('should handle operationId not present in OpenAPI 3.1', () => {
    const { operationId, ...operation } = specOperation31
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
      let requestBodySchema = mappedOperation.requestBodySchema(mediaType)
      expect(requestBodySchema).not.toBeDefined()

      requestBodySchema = mappedOperation31.requestBodySchema(mediaType)
      expect(requestBodySchema).not.toBeDefined()
    })

    it('should return null when no requestBody schema exists', () => {
      const mediaType = 'application/xml'
      const { requestBody, ...operation } = specOperation
      mappedOperation = new OasMappedOperation(path, method, operation)

      const requestBodySchema = mappedOperation.requestBodySchema(mediaType)
      expect(requestBodySchema).not.toBeDefined()
    })

    it('should return null when no requestBody schema exists in OpenAPI 3.1', () => {
      const mediaType = 'application/xml'
      const { requestBody, ...operation } = specOperation31
      mappedOperation31 = new OasMappedOperation(path, method, operation)

      const requestBodySchema = mappedOperation31.requestBodySchema(mediaType)
      expect(requestBodySchema).not.toBeDefined()
    })
  })
})
