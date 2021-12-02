import fs from 'fs-extra'
import { Collection } from 'postman-collection'
import { TestSuite, VariationWriter } from '../application'
import { getConfig } from '../lib'
import { OpenApiParser } from '../oas'
import { PostmanMappedOperation, PostmanParser } from '../postman'
import { omitKeys } from '../utils'

describe('TestSuite', () => {
  let postmanParser: PostmanParser
  let oasParser: OpenApiParser
  let testSuite: TestSuite

  const postmanJson = '__tests__/fixtures/crm_compact.postman.json'
  const oasYml = '__tests__/fixtures/crm_compact.yml'
  const postmanConfigFile = '__tests__/fixtures/portman.crm.json'

  beforeEach(async () => {
    oasParser = new OpenApiParser()
    await oasParser.convert({ inputFile: oasYml })
    const postmanObj = JSON.parse(fs.readFileSync(postmanJson).toString())
    const config = await getConfig(postmanConfigFile)
    postmanParser = new PostmanParser({
      collection: new Collection(postmanObj),
      oasParser: oasParser
    })

    testSuite = new TestSuite({ oasParser, postmanParser, config })
    testSuite.variationWriter = new VariationWriter({
      testSuite: testSuite,
      variationFolderName: 'Variation Tests'
    })
  })

  it('should generateContractTests', () => {
    testSuite.generateContractTests()
    expect(omitKeys(testSuite.collection.toJSON(), ['id', '_postman_id'])).toMatchSnapshot()
  })

  it('should injectContentTests', () => {
    testSuite.injectContentTests()
    expect(omitKeys(testSuite.collection.toJSON(), ['id', '_postman_id'])).toMatchSnapshot()
  })

  it('should injectAssignVariables', () => {
    testSuite.injectAssignVariables()
    expect(omitKeys(testSuite.collection.toJSON(), ['id', '_postman_id'])).toMatchSnapshot()
  })

  it('should injectExtendedTests', () => {
    testSuite.injectExtendedTests()
    expect(omitKeys(testSuite.collection.toJSON(), ['id', '_postman_id'])).toMatchSnapshot()
  })

  it('should generateVariationTests', () => {
    testSuite.generateVariationTests()
    expect(omitKeys(testSuite.collection.toJSON(), ['id', '_postman_id'])).toMatchSnapshot()
  })

  describe('injectOverwrites', () => {
    it('should overwriteRequestBody', () => {
      testSuite.injectOverwrites()
      expect(postmanParser.mappedOperations[1].item.request.body).toMatchSnapshot()
    })

    it('should overwriteRequestQueryParams', () => {
      testSuite.injectOverwrites()

      expect(postmanParser.mappedOperations[0].item.request.url.query).toMatchSnapshot()
    })

    it('should overwriteRequestPathVariables', () => {
      testSuite.injectOverwrites()

      expect(postmanParser.mappedOperations[3].item.request.url.variables).toMatchSnapshot()
    })

    it('should overwriteRequestHeaders', () => {
      testSuite.injectOverwrites()

      expect(postmanParser.mappedOperations[3].item.request.headers).toMatchSnapshot()
    })

    it('should return all operations for getOperationsFromSetting', async () => {
      const contractTest = {
        openApiOperation: '*::/crm/*',
        excludeForOperations: ['GET::/crm/companies'],
        statusSuccess: {
          enabled: true
        }
      }
      const ops = testSuite.getOperationsFromSetting(contractTest) as PostmanMappedOperation[]
      const result = ops.map(o => o.path)
      expect(result).toMatchSnapshot()
    })

    it('should return all operations for getOperationsFromSetting without the excludeForOperations based on pathRef', async () => {
      const contractTest = {
        openApiOperation: '*::/crm/*',
        excludeForOperations: ['GET::/crm/companies'],
        statusSuccess: {
          enabled: true
        }
      }
      const ops = testSuite.getOperationsFromSetting(contractTest) as PostmanMappedOperation[]
      const result = ops.map(o => o.method + o.path)
      expect(result).toMatchSnapshot()
    })

    it('should return all operations for getOperationsFromSetting without the excludeForOperations based on operationId', async () => {
      const contractTest = {
        openApiOperation: '*::/crm/*',
        excludeForOperations: ['companiesAll', 'companiesOne'],
        statusSuccess: {
          enabled: true
        }
      }
      const ops = testSuite.getOperationsFromSetting(contractTest) as PostmanMappedOperation[]
      const result = ops.map(o => o.method + o.path)
      expect(result).toMatchSnapshot()
    })
  })
})
