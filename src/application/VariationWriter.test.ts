import fs from 'fs-extra'
import { TestSuite, VariationWriter } from '../application'
import { getConfig } from '../lib'
import { OpenApiParser } from '../oas'
import { PostmanParser } from '../postman'
import { omitKeys } from '../utils'

describe('VariationWriter', () => {
  let postmanParser: PostmanParser
  let oasParser: OpenApiParser
  let testSuite: TestSuite
  let variationWriter: VariationWriter
  let variationTests

  const postmanJson = '__tests__/fixtures/crm.postman.json'
  const oasYml = '__tests__/fixtures/crm.yml'
  const postmanConfigFile = '__tests__/fixtures/portman.crm.json'

  beforeEach(async () => {
    oasParser = new OpenApiParser()
    await oasParser.convert({ inputFile: oasYml })
    const postmanObj = JSON.parse(fs.readFileSync(postmanJson).toString())
    const config = await getConfig(postmanConfigFile)
    postmanParser = new PostmanParser({ postmanObj: postmanObj, oasParser: oasParser })
    testSuite = new TestSuite({ oasParser, postmanParser, config })
    variationWriter = new VariationWriter({ testSuite: testSuite })
    variationTests = config?.tests?.variationTests

    const variationTest = variationTests[0]
    const pmOperations = testSuite.getOperationsFromSetting(variationTest)
    const pmOperation = pmOperations[0]

    const oaOperation = oasParser.getOperationByPath(pmOperation.pathRef)
    variationWriter.add(pmOperation, oaOperation, variationTest.variations)
  })

  it(`should add postman items to its own collection`, () => {
    expect(
      omitKeys(variationWriter.variationCollection.toJSON(), ['id', '_postman_id'])
    ).toMatchSnapshot()
  })

  it(`should merge it's own collection to one provided`, () => {
    variationWriter.mergeToCollection(testSuite.collection)
    expect(omitKeys(testSuite.collection.toJSON(), ['id', '_postman_id'])).toMatchSnapshot()
  })

  it(`should keep a reference to it's variations`, () => {
    variationWriter.mergeToCollection(testSuite.collection)
    expect(variationWriter.overwriteMap).toMatchSnapshot()
  })
})
