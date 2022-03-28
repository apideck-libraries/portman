import * as Either from 'fp-ts/lib/Either'
import fs from 'fs-extra'
import { Collection } from 'postman-collection'
import { IntegrationTestWriter, TestSuite } from '../application'
import { getConfig } from '../lib'
import { OpenApiParser } from '../oas'
import { PostmanParser } from '../postman'
import { omitKeys } from '../utils'
import { PortmanError } from '../utils/PortmanError'

describe('IntegrationTestWriter', () => {
  let postmanParser: PostmanParser
  let oasParser: OpenApiParser
  let testSuite: TestSuite
  let integrationTestWriter: IntegrationTestWriter
  let integrationTests

  const postmanJson = '__tests__/fixtures/crm.postman.json'
  const oasYml = '__tests__/fixtures/crm.yml'
  const portmanConfigFile = '__tests__/fixtures/portman.crm.json'

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

    integrationTestWriter = new IntegrationTestWriter({
      testSuite: testSuite,
      integrationTestFolderName: 'Integration Tests'
    })

    integrationTests = config?.tests?.integrationTests

    const integrationTest = integrationTests[0]
    integrationTestWriter.add(integrationTest)
  })

  it(`should add postman items to its own collection`, () => {
    expect(
      omitKeys(integrationTestWriter.integrationTestCollection.toJSON(), ['id', '_postman_id'])
    ).toMatchSnapshot()
  })

  it(`should merge it's own collection to one provided`, () => {
    integrationTestWriter.mergeToCollection(testSuite.collection)
    expect(omitKeys(testSuite.collection.toJSON(), ['id', '_postman_id'])).toMatchSnapshot()
  })
})
