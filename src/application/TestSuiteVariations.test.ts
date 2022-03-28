import * as Either from 'fp-ts/lib/Either'
import fs from 'fs-extra'
import { Collection } from 'postman-collection'
import { TestSuite, VariationWriter } from '../application'
import { getConfig } from '../lib'
import { OpenApiParser } from '../oas'
import { PostmanParser } from '../postman'
import { omitKeys, PortmanError } from '../utils'

describe('TestSuite Variations', () => {
  let postmanParser: PostmanParser
  let oasParser: OpenApiParser
  let testSuite: TestSuite

  const postmanJson = '__tests__/fixtures/crm.postman.json'
  const oasYml = '__tests__/fixtures/crm.yml'
  const portmanConfigFile = '__tests__/fixtures/portman-variations.crm.json'

  beforeEach(async () => {
    oasParser = new OpenApiParser()
    await oasParser.convert({ inputFile: oasYml })
    const postmanObj = JSON.parse(fs.readFileSync(postmanJson).toString())
    const configResult = await getConfig(portmanConfigFile)

    if (Either.isLeft(configResult)) {
      return PortmanError.render(configResult.left)
    }

    const config = configResult.right

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

  it('should generateVariationTests for variations', () => {
    testSuite.generateVariationTests()
    expect(omitKeys(testSuite.collection.toJSON(), ['id', '_postman_id'])).toMatchSnapshot()
  })
})
