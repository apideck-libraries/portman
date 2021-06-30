import fs from 'fs-extra'
import { TestSuite, VariationWriter } from '../application'
import { getConfig } from '../lib'
import { OpenApiParser } from '../oas'
import { PostmanParser } from '../postman'
import { omitKeys } from '../utils'

describe('TestSuite Variations', () => {
  let postmanParser: PostmanParser
  let oasParser: OpenApiParser
  let testSuite: TestSuite

  const postmanJson = '__tests__/fixtures/crm.postman.json'
  const oasYml = '__tests__/fixtures/crm.yml'
  const postmanConfigFile = '__tests__/fixtures/portman-variations.crm.json'

  beforeEach(async () => {
    oasParser = new OpenApiParser()
    await oasParser.convert({ inputFile: oasYml })
    const postmanObj = JSON.parse(fs.readFileSync(postmanJson).toString())
    const config = await getConfig(postmanConfigFile)
    postmanParser = new PostmanParser({ postmanObj: postmanObj, oasParser: oasParser })

    testSuite = new TestSuite({ oasParser, postmanParser, config })
    testSuite.variationWriter = new VariationWriter({ testSuite: testSuite })
  })

  it('should generateVariationTests for variations', () => {
    testSuite.generateVariationTests()
    expect(omitKeys(testSuite.collection.toJSON(), ['id', '_postman_id'])).toMatchSnapshot()
  })
})
