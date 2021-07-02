import fs from 'fs-extra'
import { Collection } from 'postman-collection'
import { OpenApiParser } from '../oas'
import { PostmanParser } from '../postman'

describe('PostmanParser', () => {
  let postmanParser: PostmanParser
  let oasParser: OpenApiParser

  const postmanJson = '__tests__/fixtures/crm.postman.json'
  const oasYml = '__tests__/fixtures/crm.yml'

  beforeEach(async () => {
    oasParser = new OpenApiParser()
    await oasParser.convert({ inputFile: oasYml })
    const postmanObj = JSON.parse(fs.readFileSync(postmanJson).toString())
    postmanParser = new PostmanParser({
      collection: new Collection(postmanObj),
      oasParser: oasParser
    })
  })

  describe('constructor', () => {
    it('should load from json input file and set PostmanCollection', () => {
      expect(postmanParser.collection).toBeDefined()
    })
  })

  describe('getOperationById', () => {
    it('should be able to retrieve a OasMappedOperation by operationId', async () => {
      const operation = postmanParser.getOperationById('usersAll')
      expect(operation?.id).toStrictEqual('usersAll')
    })

    it('should be fail gracefully if not found', async () => {
      const operation = postmanParser.getOperationById('notAnOperation')
      expect(operation).toStrictEqual(null)
    })
  })

  describe('getOperationByPath', () => {
    it('should be able to retrieve a read PostmanMappedOperation by pathRef', async () => {
      const operation = postmanParser.getOperationByPath('GET::/crm/companies/{id}')
      expect(operation?.id).toStrictEqual('companiesOne')
    })

    it('should be able to retrieve a PostmanMappedOperation by pathRef with path param', async () => {
      const operation = postmanParser.getOperationByPath('POST::/crm/companies')
      expect(operation?.id).toStrictEqual('companiesAdd')
    })

    it('should be fail gracefully if not found', async () => {
      const operation = postmanParser.getOperationByPath('GET::/crm/notAResource')
      expect(operation).toStrictEqual(null)
    })
  })

  describe('getOperationsByIds', () => {
    it('should be able to retrieve PostmanMappedOperations by operationIds', async () => {
      const operations = postmanParser.getOperationsByIds(['usersAll', 'companiesOne'])
      expect(operations.map(({ id }) => id)).toEqual(['companiesOne', 'usersAll'])
    })

    it('should be fail gracefully if not found', async () => {
      const operations = postmanParser.getOperationsByIds(['notAnOperation'])
      expect(operations).toStrictEqual([])
    })
  })

  describe('getOperationsByPath', () => {
    it('should be able to retrieve PostmanMappedOperations by pathRef', async () => {
      const operations = postmanParser.getOperationsByPath('GET::/crm/companies')
      expect(operations.map(({ id }) => id)).toEqual(['companiesAll'])
    })

    it('should be able to retrieve PostmanMappedOperations by pathRef with a variable in oas format', async () => {
      const operations = postmanParser.getOperationsByPath('GET::/crm/companies/{id}')
      expect(operations.map(({ id }) => id)).toEqual(['companiesOne'])
    })

    it('should be able to retrieve PostmanMappedOperations by pathRef with a variable in postman format', async () => {
      const operations = postmanParser.getOperationsByPath('GET::/crm/companies/:id')
      expect(operations.map(({ id }) => id)).toEqual(['companiesOne'])
    })

    it('should be able to retrieve PostmanMappedOperations via wildcarded pathRef', async () => {
      const operations = postmanParser.getOperationsByPath('*::/crm/companies/*')
      expect(operations.map(({ id }) => id)).toEqual([
        'companiesOne',
        'companiesUpdate',
        'companiesDelete'
      ])
    })

    it('should be able to retrieve PostmanMappedOperations by pathRef with wildcard method', async () => {
      const operations = postmanParser.getOperationsByPath('*::/crm/companies')
      expect(operations.map(({ id }) => id)).toEqual(['companiesAll', 'companiesAdd'])
    })
  })
})
