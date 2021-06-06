import fs from 'fs-extra'
import { OpenApiParser, PostmanParser, TestSuiteService } from '../../application'
import { injectEnvVariables } from './injectEnvVariables'

describe('injectEnvVariables', () => {
  let postmanParser: PostmanParser
  let oasParser: OpenApiParser
  let testSuiteService: TestSuiteService

  const postmanJson = '__tests__/fixtures/crm.postman.json'
  const oasYml = '__tests__/fixtures/crm.yml'
  const testSuiteConfigFile = '__tests__/fixtures/postman-testsuite.crm.json'
  const envFile = '__tests__/fixtures/.crm.env'

  beforeEach(async () => {
    oasParser = new OpenApiParser()
    await oasParser.convert({ inputFile: oasYml })
    const postmanObj = JSON.parse(fs.readFileSync(postmanJson).toString())
    postmanParser = new PostmanParser({ postmanObj: postmanObj, oasParser: oasParser })
    testSuiteService = new TestSuiteService({ oasParser, postmanParser, testSuiteConfigFile })
    testSuiteService.generateAutomatedTests()
  })

  it('should add script to skip tests if status returned is Not Implemented', async () => {
    const collection = injectEnvVariables(testSuiteService.collection.toJSON(), envFile, undefined)
    expect(collection?.variable).toMatchSnapshot()
  })
})
