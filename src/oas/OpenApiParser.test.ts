import { OpenAPI } from 'openapi-types'
import { OpenApiParser } from './OpenApiParser'

describe('OpenApiParser', () => {
  let oas: OpenAPI.Document
  let oas31: OpenAPI.Document
  const oasParser = new OpenApiParser()
  const oasParser31 = new OpenApiParser()
  // Happy Path for OAS Parsing
  describe('convert', () => {
    beforeEach(async () => {
      const oasYml = '__tests__/fixtures/crm.yml'
      const oas31Yml = '__tests__/fixtures/crm31.yml'
      oas = await oasParser.convert({ inputFile: oasYml })
      oas31 = await oasParser31.convert({ inputFile: oas31Yml })
    })

    it('should parse an openapispec.yml and return an OpenAPI.Document', () => {
      expect(oas.info.title).toStrictEqual('CRM API')
      expect(oas31.info.title).toStrictEqual('CRM API')
      expect(oas).toMatchSnapshot()
    })

    it(`provides an public instance to it's OpenApiSpec`, () => {
      expect(oasParser.oas.info.title).toStrictEqual('CRM API')
      expect(oasParser31.oas.info.title).toStrictEqual('CRM API')
    })
  })

  describe('getOperationById', () => {
    it('should be able to retrieve a OasMappedOperation by operationId', async () => {
      const operation = oasParser.getOperationById('usersAll')
      expect(operation?.id).toStrictEqual('usersAll')
      expect(operation?.schema).toMatchSnapshot()

      const operation31 = oasParser31.getOperationById('usersAll')
      expect(operation31?.id).toStrictEqual('usersAll')
      expect(operation31?.schema).toMatchSnapshot()
    })

    it('should be fail gracefully if not found', async () => {
      const operation = oasParser.getOperationById('notAnOperation')
      expect(operation).toStrictEqual(null)

      const operation31 = oasParser31.getOperationById('notAnOperation')
      expect(operation31).toStrictEqual(null)
    })
  })

  describe('getOperationByPath', () => {
    it('should be able to retrieve a read OasMappedOperation by pathRef', async () => {
      const operation = oasParser.getOperationByPath('GET::/crm/companies/{id}')
      expect(operation?.id).toStrictEqual('companiesOne')
      expect(operation?.schema).toMatchSnapshot()

      const operation31 = oasParser31.getOperationByPath('GET::/crm/companies/{id}')
      expect(operation31?.id).toStrictEqual('companiesOne')
      expect(operation31?.schema).toMatchSnapshot()
    })

    it('should be able to retrieve a OasMappedOperation by pathRef with path param', async () => {
      const operation = oasParser.getOperationByPath('POST::/crm/companies')
      expect(operation?.id).toStrictEqual('companiesAdd')
      expect(operation?.schema).toMatchSnapshot()

      const operation31 = oasParser31.getOperationByPath('POST::/crm/companies')
      expect(operation31?.id).toStrictEqual('companiesAdd')
      expect(operation31?.schema).toMatchSnapshot()
    })

    it('should be fail gracefully if not found', async () => {
      const operation = oasParser.getOperationByPath('GET::/crm/notAResource')
      expect(operation).toStrictEqual(null)

      const operation31 = oasParser31.getOperationByPath('GET::/crm/notAResource')
      expect(operation31).toStrictEqual(null)
    })
  })

  describe('getOperationsByIds', () => {
    it('should be able to retrieve OasMappedOperations by operationIds', async () => {
      const operations = oasParser.getOperationsByIds(['usersAll', 'companiesOne'])
      expect(operations.map(({ id }) => id)).toEqual(['companiesOne', 'usersAll'])

      const operations31 = oasParser31.getOperationsByIds(['usersAll', 'companiesOne'])
      expect(operations31.map(({ id }) => id)).toEqual(['companiesOne', 'usersAll'])
    })

    it('should be fail gracefully if not found', async () => {
      const operations = oasParser.getOperationsByIds(['notAnOperation'])
      expect(operations).toStrictEqual([])

      const operations31 = oasParser31.getOperationsByIds(['notAnOperation'])
      expect(operations31).toStrictEqual([])
    })
  })

  describe('getOperationsByPath', () => {
    it('should be able to retrieve OasMappedOperations by pathRef', async () => {
      const operations = oasParser.getOperationsByPath('GET::/crm/companies')
      expect(operations.map(({ id }) => id)).toEqual(['companiesAll'])

      const operations31 = oasParser31.getOperationsByPath('GET::/crm/companies')
      expect(operations31.map(({ id }) => id)).toEqual(['companiesAll'])
    })

    it('should be able to retrieve OasMappedOperations via wildcarded pathRef', async () => {
      const operations = oasParser.getOperationsByPath('*::/crm/companies/*')
      expect(operations.map(({ id }) => id)).toEqual([
        'companiesOne',
        'companiesUpdate',
        'companiesDelete'
      ])

      const operations31 = oasParser31.getOperationsByPath('*::/crm/companies/*')
      expect(operations31.map(({ id }) => id)).toEqual([
        'companiesOne',
        'companiesUpdate',
        'companiesDelete'
      ])
    })

    it('should be able to retrieve OasMappedOperations by pathRef with wildcard method', async () => {
      const operations = oasParser.getOperationsByPath('*::/crm/companies')
      expect(operations.map(({ id }) => id)).toEqual(['companiesAll', 'companiesAdd'])

      const operations31 = oasParser31.getOperationsByPath('*::/crm/companies')
      expect(operations31.map(({ id }) => id)).toEqual(['companiesAll', 'companiesAdd'])
    })
  })
})
