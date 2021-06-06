import fs from 'fs-extra'
import { OpenApiParser } from './OpenApiParser'
import { PostmanParser } from './PostmanParser'
import { TestSuiteService } from './TestSuiteService'

describe('TestSuiteService', () => {
  let postmanParser: PostmanParser
  let oasParser: OpenApiParser
  let testSuiteService: TestSuiteService

  const postmanJson = '__tests__/fixtures/crm.postman.json'
  const oasYml = '__tests__/fixtures/crm.yml'
  const testSuiteConfigFile = '__tests__/fixtures/postman-testsuite.crm.json'

  beforeEach(async () => {
    oasParser = new OpenApiParser()
    await oasParser.convert({ inputFile: oasYml })
    const postmanObj = JSON.parse(fs.readFileSync(postmanJson).toString())
    postmanParser = new PostmanParser({ postmanObj: postmanObj, oasParser: oasParser })

    testSuiteService = new TestSuiteService({ oasParser, postmanParser, testSuiteConfigFile })
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should generateAutomatedTests', async () => {
    testSuiteService.generateAutomatedTests()
    // dig down to specific test as postman injects unique ids making snapshots  meh
    expect(postmanParser.mappedOperations[0].getTests().script.exec).toMatchSnapshot()
  })
})
