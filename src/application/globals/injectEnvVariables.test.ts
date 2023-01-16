import * as Either from 'fp-ts/lib/Either'
import fs from 'fs-extra'
import { Collection } from 'postman-collection'
import { injectEnvVariables, TestSuite } from '../../application'
import { getConfig } from '../../lib'
import { OpenApiParser } from '../../oas'
import { PostmanParser } from '../../postman'
import { PortmanError } from '../../utils'

describe('injectEnvVariables', () => {
  let postmanParser: PostmanParser
  let oasParser: OpenApiParser
  let testSuiteService: TestSuite

  const postmanJson = '__tests__/fixtures/crm.postman.json'
  const oasYml = '__tests__/fixtures/crm.yml'
  const portmanConfigFile = '__tests__/fixtures/portman.crm.json'
  const envFile = '__tests__/fixtures/.crm.env'

  beforeEach(async () => {
    oasParser = new OpenApiParser()
    await oasParser.convert({ inputFile: oasYml })
    const postmanObj = JSON.parse(fs.readFileSync(postmanJson).toString())
    postmanParser = new PostmanParser({
      collection: new Collection(postmanObj),
      oasParser: oasParser
    })
    const configResult = await getConfig(portmanConfigFile)

    if (Either.isLeft(configResult)) {
      return PortmanError.render(configResult.left)
    }

    const config = configResult.right

    testSuiteService = new TestSuite({ oasParser, postmanParser, config })
    testSuiteService.generateContractTests()
  })

  it('should add environment variables to collection variables', async () => {
    const collection = injectEnvVariables(testSuiteService.collection.toJSON(), envFile, undefined)
    expect(collection?.variable).toMatchSnapshot()
  })

  it('should add environment variables to collection variables without overwriting original baseUrl', async () => {
    const coll = testSuiteService.collection.toJSON()
    coll.variable = [
      {
        description: {
          content: 'the API URL',
          type: 'text/plain'
        },
        type: 'any',
        value: 'https://api.example.com',
        key: 'url'
      },
      {
        type: 'string',
        value: '{{url}}/content',
        key: 'baseUrl'
      }
    ]
    const collection = injectEnvVariables(coll, envFile, undefined)
    expect(collection?.variable).toMatchSnapshot()
  })

  it('should add environment variables to collection variables with overwriting original baseUrl', async () => {
    const coll = testSuiteService.collection.toJSON()
    coll.variable = [
      {
        description: {
          content: 'the API URL',
          type: 'text/plain'
        },
        type: 'any',
        value: 'https://api.example.com',
        key: 'url'
      },
      {
        type: 'string',
        value: '{{url}}/content',
        key: 'baseUrl'
      }
    ]
    const collection = injectEnvVariables(coll, envFile, 'https://api.foo.bar')
    expect(collection?.variable).toMatchSnapshot()
  })
})
