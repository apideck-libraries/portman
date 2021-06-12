import fs from 'fs-extra'
import { TestSuite } from '../application'
import { getConfig } from '../lib'
import { OpenApiParser } from '../oas'
import { PostmanParser } from '../postman'

describe('TestSuite', () => {
  let postmanParser: PostmanParser
  let oasParser: OpenApiParser
  let testSuiteService: TestSuite

  const postmanJson = '__tests__/fixtures/crm.postman.json'
  const oasYml = '__tests__/fixtures/crm.yml'
  const postmanConfigFile = '__tests__/fixtures/portman.crm.json'

  beforeEach(async () => {
    oasParser = new OpenApiParser()
    await oasParser.convert({ inputFile: oasYml })
    const postmanObj = JSON.parse(fs.readFileSync(postmanJson).toString())
    const config = await getConfig(postmanConfigFile)
    postmanParser = new PostmanParser({ postmanObj: postmanObj, oasParser: oasParser })

    testSuiteService = new TestSuite({ oasParser, postmanParser, config })
  })

  it('should generateAutomatedTests', async () => {
    testSuiteService.generateAutomatedTests()
    // dig down to specific test as postman injects unique ids making snapshots  meh
    expect(postmanParser.mappedOperations[0].getTests().script.exec).toMatchSnapshot()
  })

  it('should injectContentTests', async () => {
    testSuiteService.injectContentTests()
    expect(postmanParser.mappedOperations[0].getTests().script.exec).toMatchSnapshot()
  })

  it('should injectAssignVariables', async () => {
    testSuiteService.injectAssignVariables()
    expect(postmanParser.mappedOperations[0].getTests().script.exec).toMatchSnapshot()
  })

  it('should injectExtendedTests', async () => {
    testSuiteService.injectExtendedTests()
    expect(postmanParser.mappedOperations[0].getTests().script.exec).toMatchSnapshot()
  })

  describe('injectOverwrites', () => {
    it('should overwriteRequestBody', async () => {
      testSuiteService.injectOverwrites()
      expect(postmanParser.mappedOperations[1].item.request.body).toMatchSnapshot()
    })

    it('should overwriteRequestQueryParams', async () => {
      testSuiteService.injectOverwrites()

      expect(postmanParser.mappedOperations[0].item.request.url.query).toMatchSnapshot()
    })

    it('should overwriteRequestPathVariables', async () => {
      testSuiteService.injectOverwrites()

      expect(postmanParser.mappedOperations[3].item.request.url.variables).toMatchSnapshot()
    })

    it('should overwriteRequestHeaders', async () => {
      testSuiteService.injectOverwrites()

      expect(postmanParser.mappedOperations[3].item.request.headers).toMatchSnapshot()
    })
  })
})
