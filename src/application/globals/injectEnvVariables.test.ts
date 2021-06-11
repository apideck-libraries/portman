import { injectEnvVariables, TestSuite } from 'application'
import fs from 'fs-extra'
import { getConfig } from 'lib'
import { OpenApiParser } from 'oas'
import { PostmanParser } from 'postman'

describe('injectEnvVariables', () => {
  let postmanParser: PostmanParser
  let oasParser: OpenApiParser
  let testSuiteService: TestSuite

  const postmanJson = '__tests__/fixtures/crm.postman.json'
  const oasYml = '__tests__/fixtures/crm.yml'
  const postmanConfigFile = '__tests__/fixtures/portman.crm.json'
  const envFile = '__tests__/fixtures/.crm.env'

  beforeEach(async () => {
    oasParser = new OpenApiParser()
    await oasParser.convert({ inputFile: oasYml })
    const postmanObj = JSON.parse(fs.readFileSync(postmanJson).toString())
    postmanParser = new PostmanParser({ postmanObj: postmanObj, oasParser: oasParser })
    const config = await getConfig(postmanConfigFile)
    testSuiteService = new TestSuite({ oasParser, postmanParser, config })
    testSuiteService.generateAutomatedTests()
  })

  it('should add script to skip tests if status returned is Not Implemented', async () => {
    const collection = injectEnvVariables(testSuiteService.collection.toJSON(), envFile, undefined)
    expect(collection?.variable).toMatchSnapshot()
  })
})
