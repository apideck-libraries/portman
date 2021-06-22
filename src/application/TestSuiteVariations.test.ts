import fs from 'fs-extra'
import { TestSuite } from '../application'
import { getConfig } from '../lib'
import { OpenApiParser } from '../oas'
import { PostmanParser } from '../postman'
import { omitKeys } from '../utils'

describe('TestSuite Variations', () => {
  let postmanParser: PostmanParser
  let oasParser: OpenApiParser
  let testSuiteService: TestSuite

  const postmanJson = '__tests__/fixtures/crm.postman.json'
  const oasYml = '__tests__/fixtures/crm.yml'
  const postmanConfigFile = '__tests__/fixtures/portman-variations.crm.json'

  beforeEach(async () => {
    oasParser = new OpenApiParser()
    await oasParser.convert({ inputFile: oasYml })
    const postmanObj = JSON.parse(fs.readFileSync(postmanJson).toString())
    const config = await getConfig(postmanConfigFile)
    postmanParser = new PostmanParser({ postmanObj: postmanObj, oasParser: oasParser })

    testSuiteService = new TestSuite({ oasParser, postmanParser, config })
  })

  /*it('should generateContractTests for variations', () => {
    testSuiteService.generateContractTests()
    expect(omitKeys(testSuiteService.collection.toJSON(), ['id', '_postman_id'])).toMatchSnapshot()
  })

  it('should injectContentTests for variations', () => {
    testSuiteService.injectContentTests()
    expect(omitKeys(testSuiteService.collection.toJSON(), ['id', '_postman_id'])).toMatchSnapshot()
  })

  it('should injectAssignVariables for variations', () => {
    testSuiteService.injectAssignVariables()
    expect(omitKeys(testSuiteService.collection.toJSON(), ['id', '_postman_id'])).toMatchSnapshot()
  })

  it('should injectExtendedTests for variations', () => {
    testSuiteService.injectExtendedTests()
    expect(omitKeys(testSuiteService.collection.toJSON(), ['id', '_postman_id'])).toMatchSnapshot()
  })*/

  it('should generateVariationTests for variations', () => {
    testSuiteService.generateVariationTests()
    expect(omitKeys(testSuiteService.collection.toJSON(), ['id', '_postman_id'])).toMatchSnapshot()
  })

  /*describe('injectOverwrites for variations', () => {
    it('should overwriteRequestBody', () => {
      testSuiteService.injectOverwrites()
      expect(postmanParser.mappedOperations[1].item.request.body).toMatchSnapshot()
    })

    it('should overwriteRequestQueryParams for variations', () => {
      testSuiteService.injectOverwrites()

      expect(postmanParser.mappedOperations[0].item.request.url.query).toMatchSnapshot()
    })

    it('should overwriteRequestPathVariables for variations', () => {
      testSuiteService.injectOverwrites()

      expect(postmanParser.mappedOperations[3].item.request.url.variables).toMatchSnapshot()
    })

    it('should overwriteRequestHeaders for variations', () => {
      testSuiteService.injectOverwrites()

      expect(postmanParser.mappedOperations[3].item.request.headers).toMatchSnapshot()
    })
  })*/
})
