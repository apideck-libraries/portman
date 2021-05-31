import { OpenAPI } from 'openapi-types'
import { OpenApiParser } from './OpenApiParser'

describe('OpenApiParser', () => {
  let oas: OpenAPI.Document
  const parser = new OpenApiParser()
  // Happy Path for OAS Parsing
  describe('convert', () => {
    beforeEach(async () => {
      const oasYml = '__tests__/fixtures/crm.yml'
      oas = await parser.convert({ inputFile: oasYml })
    })

    it('should parse an openapispec.yml and return an OpenAPI.Document', () => {
      expect(oas.info.title).toStrictEqual('CRM API')
      expect(oas).toMatchSnapshot()
    })

    it(`provides an public instance to it's OpenApiSpec`, () => {
      expect(parser.oas.info.title).toStrictEqual('CRM API')
    })
  })

  describe('getOperationById', () => {
    it('should be able to retrieve an operation by operationId', async () => {
      const operation = parser.getOperationById('usersAll')
      expect(operation?.operationId).toStrictEqual('usersAll')
    })

    it('should be fail gracefully if not found', async () => {
      const operation = parser.getOperationById('notAnOperation')
      expect(operation).toStrictEqual(null)
    })
  })

  describe('getOperationByPath', () => {
    it('should be able to retrieve an operation by operationId', async () => {
      const operation = parser.getOperationByPath('GET::/crm/companies')
      expect(operation?.operationId).toStrictEqual('companiesAll')
    })

    it('should be fail gracefully if not found', async () => {
      const operation = parser.getOperationByPath('GET::/crm/notAResource')
      expect(operation).toStrictEqual(null)
    })
  })
})
