import fs from 'fs-extra'
import { Collection } from 'postman-collection'
import { stripResponseExamples, TestSuite } from '../../application'
import { getConfig } from '../../lib'
import { OpenApiParser } from '../../oas'
import { PostmanParser } from '../../postman'

describe('stripResponseExamples', () => {
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
    postmanParser = new PostmanParser({
      collection: new Collection(postmanObj),
      oasParser: oasParser
    })
    const config = await getConfig(postmanConfigFile)
    testSuiteService = new TestSuite({ oasParser, postmanParser, config })
    testSuiteService.generateContractTests()
  })

  it('should remove response examples from the collection', async () => {
    const collection = stripResponseExamples(testSuiteService.collection)
    expect(collection).toMatchSnapshot()
  })
})
