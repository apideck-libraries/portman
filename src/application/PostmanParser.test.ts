import fs from 'fs-extra'
import { OpenApiParser } from './OpenApiParser'
import { PostmanParser } from './PostmanParser'

describe('PostmanParser', () => {
  let postmanParser: PostmanParser
  let oasParser: OpenApiParser

  const postmanJson = '__tests__/fixtures/crm.postman.json'
  const oasYml = '__tests__/fixtures/crm.yml'

  beforeEach(async () => {
    oasParser = new OpenApiParser()
    await oasParser.convert({ inputFile: oasYml })
    const postmanObj = JSON.parse(fs.readFileSync(postmanJson).toString())
    postmanParser = new PostmanParser({ postmanObj: postmanObj, oasParser: oasParser })
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
})
