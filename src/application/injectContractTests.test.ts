import * as Either from 'fp-ts/lib/Either'
import fs from 'fs-extra'
import { Collection, CollectionDefinition } from 'postman-collection'
import { TestSuite } from '../application'
import { getConfig } from '../lib'
import { OasMappedOperation, OpenApiParser } from '../oas'
import { PostmanMappedOperation, PostmanParser } from '../postman'
import { PortmanError } from '../utils/PortmanError'
import { PortmanConfig } from '../types'
import { omitKeys } from '../utils'

describe('injectContractTests', () => {
  let postmanParser: PostmanParser
  let oasParser: OpenApiParser
  let testSuite: TestSuite
  let config: PortmanConfig
  let postmanObj: CollectionDefinition
  const exclKeys = ['id', 'type', 'listen', 'reference', 'Type']

  const path = 'GET::/crm/leads'
  let pmOperationOne: PostmanMappedOperation
  let oaOperationOne: OasMappedOperation

  const postmanJson = '__tests__/fixtures/crm_compact.postman.json'
  const oasYml = '__tests__/fixtures/crm_compact.yml'
  const portmanConfigFile = '__tests__/fixtures/portman.crm.json'

  beforeEach(async () => {
    oasParser = new OpenApiParser()
    await oasParser.convert({ inputFile: oasYml })
    postmanObj = JSON.parse(fs.readFileSync(postmanJson).toString())
    const configResult = await getConfig(portmanConfigFile)

    if (Either.isLeft(configResult)) {
      return PortmanError.render(configResult.left)
    }
    config = configResult.right

    postmanParser = new PostmanParser({
      collection: new Collection(postmanObj),
      oasParser: oasParser
    })
    testSuite = new TestSuite({ oasParser, postmanParser, config })

    pmOperationOne = postmanParser.getOperationByPath(path) as PostmanMappedOperation
    oaOperationOne = oasParser.getOperationByPath(pmOperationOne.pathRef) as OasMappedOperation
  })

  it('should inject status check', async () => {
    const contractTest = {
      openApiOperation: path,
      statusSuccess: {
        enabled: true
      }
    }

    // Inject response tests
    testSuite.injectContractTests(pmOperationOne, oaOperationOne, contractTest, '200')
    expect(omitKeys(pmOperationOne.item.events, exclKeys)).toMatchSnapshot()
  })

  it('should inject status code check', async () => {
    const contractTest = {
      openApiOperation: path,
      statusCode: {
        enabled: true,
        code: 400
      }
    }

    // Inject response tests
    testSuite.injectContractTests(pmOperationOne, oaOperationOne, contractTest, '200')
    expect(omitKeys(pmOperationOne.item.events, exclKeys)).toMatchSnapshot()
  })

  it('should inject responseTime check, with default response time', async () => {
    const contractTest = {
      openApiOperation: path,
      responseTime: {
        enabled: true,
        maxMs: 300
      }
    }

    // Inject response tests
    testSuite.injectContractTests(pmOperationOne, oaOperationOne, contractTest, '200')
    expect(omitKeys(pmOperationOne.item.events, exclKeys)).toMatchSnapshot()
  })

  it('should inject responseTime check, with specific response time', async () => {
    const contractTest = {
      openApiOperation: path,
      responseTime: {
        enabled: true,
        maxMs: 600
      }
    }

    // Inject response tests
    testSuite.injectContractTests(pmOperationOne, oaOperationOne, contractTest, '200')
    expect(omitKeys(pmOperationOne.item.events, exclKeys)).toMatchSnapshot()
  })

  it('should inject content-type check', async () => {
    const contractTest = {
      openApiOperation: path,
      contentType: {
        enabled: true
      }
    }

    // Inject response tests
    testSuite.injectContractTests(pmOperationOne, oaOperationOne, contractTest, '200')
    expect(omitKeys(pmOperationOne.item.events, exclKeys)).toMatchSnapshot()
  })

  it('should inject JSON body check', async () => {
    const contractTest = {
      openApiOperation: path,
      jsonBody: {
        enabled: true
      }
    }

    // Inject response tests
    testSuite.injectContractTests(pmOperationOne, oaOperationOne, contractTest, '200')
    expect(omitKeys(pmOperationOne.item.events, exclKeys)).toMatchSnapshot()
  })

  it('should not inject JSON body check, when not content-type JSON', async () => {
    const contractTest = {
      openApiOperation: path,
      jsonBody: {
        enabled: true
      }
    }

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const schema = oaOperationOne.schema.responses[200].content['application/json']
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    oaOperationOne?.schema.responses[200].content['plain/text'] = schema
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    delete oaOperationOne.schema.responses[200].content['application/json']

    // Inject response tests
    testSuite.injectContractTests(pmOperationOne, oaOperationOne, contractTest, '200')
    expect(omitKeys(pmOperationOne.item.events, exclKeys)).toMatchSnapshot()
  })

  it('should inject header check', async () => {
    const contractTest = {
      openApiOperation: path,
      headersPresent: {
        enabled: true
      }
    }

    // Inject response tests
    testSuite.injectContractTests(pmOperationOne, oaOperationOne, contractTest, '200')
    expect(omitKeys(pmOperationOne.item.events, exclKeys)).toMatchSnapshot()
  })

  it('should inject schemaValidation check', async () => {
    const contractTest = {
      openApiOperation: path,
      schemaValidation: {
        enabled: true
      }
    }

    // Inject response tests
    testSuite.injectContractTests(pmOperationOne, oaOperationOne, contractTest, '200')
    expect(omitKeys(pmOperationOne.item.events, exclKeys)).toMatchSnapshot()
  })

  it('should inject schemaValidation check, without additionalProperties set to false', async () => {
    const contractTest = {
      openApiOperation: path,
      schemaValidation: {
        enabled: true,
        additionalProperties: false
      }
    }

    // Inject response tests
    testSuite.injectContractTests(pmOperationOne, oaOperationOne, contractTest, '200')
    expect(omitKeys(pmOperationOne.item.events, exclKeys)).toMatchSnapshot()
  })

  it('should not inject schemaValidation check, when not content-type JSON', async () => {
    const contractTest = {
      openApiOperation: path,
      schemaValidation: {
        enabled: true
      }
    }

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const schema = oaOperationOne.schema.responses[200].content['application/json']
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    oaOperationOne?.schema.responses[200].content['plain/text'] = schema
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    delete oaOperationOne.schema.responses[200].content['application/json']

    // Inject response tests
    testSuite.injectContractTests(pmOperationOne, oaOperationOne, contractTest, '200')
    expect(omitKeys(pmOperationOne.item.events, exclKeys)).toMatchSnapshot()
  })

  it('should not inject schemaValidation check, when no content-type', async () => {
    const contractTest = {
      openApiOperation: path,
      schemaValidation: {
        enabled: true
      }
    }

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    delete oaOperationOne.schema.responses[200].content['application/json']

    // Inject response tests
    testSuite.injectContractTests(pmOperationOne, oaOperationOne, contractTest, '200')
    expect(omitKeys(pmOperationOne.item.events, exclKeys)).toMatchSnapshot()
  })
})
