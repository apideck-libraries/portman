import fs from 'fs-extra'
import { OpenApiParser, PostmanParser, TestSuiteService } from '../../application'
import { skip501s } from './skip501s'

describe('skip501s', () => {
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
    testSuiteService.generateAutomatedTests()
  })

  it('should add script to skip tests if status returned is Not Implemented', async () => {
    const collection = skip501s(testSuiteService.collection.toJSON())
    expect(collection.item[0].item[0].event[0].script.exec).toMatchSnapshot()
  })
})
