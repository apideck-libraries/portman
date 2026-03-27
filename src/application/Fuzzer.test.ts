import * as Either from 'fp-ts/lib/Either'
import fs from 'fs-extra'
import { OpenAPIV3 } from 'openapi-types'
import { Collection } from 'postman-collection'
import { TestSuite, VariationWriter } from '../application'
import { getConfig } from '../lib'
import { OpenApiParser } from '../oas'
import { PostmanParser } from '../postman'
import { FuzzingSchemaItems, PortmanFuzzTypes } from '../types'
import { PortmanError } from '../utils/PortmanError'
import { Fuzzer } from './Fuzzer'

describe('Fuzzer', () => {
  let postmanParser: PostmanParser
  let oasParser: OpenApiParser
  let testSuite: TestSuite
  let variationWriter: VariationWriter
  let variationTests
  let variationTest
  let variationMeta
  let fuzzer: Fuzzer
  let pmOps
  let pmOpBody
  let pmOpQuery
  let pmOpHeader
  let oaOpBody
  let oaOpQuery
  let oaOpHeader

  const postmanJson = '__tests__/fixtures/crm.postman.json'
  const oasYml = '__tests__/fixtures/crm-fuzzing.yml'
  const portmanConfigFile = '__tests__/fixtures/portman-fuzzing.crm.json'

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
    variationWriter = new VariationWriter({
      testSuite: testSuite,
      variationFolderName: 'Variation Tests'
    })

    fuzzer = new Fuzzer({ testSuite: testSuite, variationWriter })

    variationTests = config?.tests?.variationTests
    variationTest = variationTests[0]
    variationMeta = variationTest.variationMeta

    pmOps = testSuite.getOperationsFromSetting(variationTest)
    pmOpBody = pmOps[11] // POST Leads operation
    pmOpQuery = pmOps[10] // GET Leads operation
    pmOpHeader = pmOps[10] // GET Leads operation
    oaOpBody = oasParser.getOperationByPath(pmOpBody.pathRef)
    oaOpQuery = oasParser.getOperationByPath(pmOpQuery.pathRef)
    oaOpHeader = oasParser.getOperationByPath(pmOpHeader.pathRef)
  })

  it('should not fuzz when no OpenAPI fuzzable properties are detected', async () => {
    const fuzzItems = {
      fuzzType: PortmanFuzzTypes.requestBody,
      requiredFields: [],
      minimumNumberFields: [],
      maximumNumberFields: [],
      minLengthFields: [],
      maxLengthFields: []
    } as FuzzingSchemaItems

    fuzzer.injectFuzzRequiredVariation(pmOpBody, oaOpBody, variationTest, variationMeta, fuzzItems)

    const result = fuzzer.fuzzVariations[0]
    expect(result).toBeUndefined()
  })

  it('should fuzz the required prop of the request body', async () => {
    const fuzzItems = {
      fuzzType: PortmanFuzzTypes.requestBody,
      requiredFields: ['name'],
      minimumNumberFields: [],
      maximumNumberFields: [],
      minLengthFields: [],
      maxLengthFields: []
    } as FuzzingSchemaItems

    fuzzer.injectFuzzRequiredVariation(pmOpBody, oaOpBody, variationTest, variationMeta, fuzzItems)

    const result = fuzzer.fuzzVariations[0]
    expect(result.item.request?.body?.raw).toMatchSnapshot()
  })

  it('should fuzz required fields using matching request body examples', async () => {
    const fuzzItems = {
      fuzzType: PortmanFuzzTypes.requestBody,
      requiredFields: ['name'],
      minimumNumberFields: [],
      maximumNumberFields: [],
      minLengthFields: [],
      maxLengthFields: []
    } as FuzzingSchemaItems

    const requestBodyExamples = [
      { device_id: 'a15e3ff0-fb5b-4026-a7d4-a65aa02bbfb8' },
      { name: 'Ada Lovelace', provider: 'apple' }
    ]

    fuzzer.injectFuzzRequiredVariation(
      pmOpBody,
      oaOpBody,
      variationTest,
      variationMeta,
      fuzzItems,
      requestBodyExamples
    )

    expect(fuzzer.fuzzVariations).toHaveLength(1)
    const result = fuzzer.fuzzVariations[0]
    expect(result.item.request?.body?.raw).toMatchSnapshot()
  })

  it('should fuzz required fields for array examples with nested paths', async () => {
    const fuzzItems = {
      fuzzType: PortmanFuzzTypes.requestBody,
      requiredFields: ['[0].to.device_token'],
      minimumNumberFields: [],
      maximumNumberFields: [],
      minLengthFields: [],
      maxLengthFields: []
    } as FuzzingSchemaItems

    const requestBodyExamples = [
      [
        {
          reference: 'ref-123',
          to: { device_id: 'a15e3ff0-fb5b-4026-a7d4-a65aa02bbfb8' }
        }
      ],
      [
        {
          reference: 'ref-123',
          to: { device_token: 'ed2576bfb93a2e7abc26', provider: 'apple' }
        }
      ]
    ]

    fuzzer.injectFuzzRequiredVariation(
      pmOpBody,
      oaOpBody,
      variationTest,
      variationMeta,
      fuzzItems,
      requestBodyExamples
    )

    expect(fuzzer.fuzzVariations).toHaveLength(1)
    const result = fuzzer.fuzzVariations[0]
    const rawBody = result.item.request?.body?.raw as string
    expect(JSON.parse(rawBody)).toEqual([{ reference: 'ref-123', to: { provider: 'apple' } }])
  })

  it('should select matching examples for anyOf without discriminator', async () => {
    const schema: OpenAPIV3.SchemaObject = {
      type: 'object',
      anyOf: [
        {
          type: 'object',
          required: ['a'],
          properties: {
            a: { type: 'string' },
            common: { type: 'string' }
          }
        },
        {
          type: 'object',
          required: ['b'],
          properties: {
            b: { type: 'string' },
            common: { type: 'string' }
          }
        }
      ]
    }

    const fuzzItems = fuzzer.analyzeFuzzJsonSchema(schema) as FuzzingSchemaItems
    const requestBodyExamples = [
      { a: 'first', common: 'alpha' },
      { b: 'second', common: 'beta' }
    ]

    fuzzer.injectFuzzRequiredVariation(
      pmOpBody,
      oaOpBody,
      variationTest,
      variationMeta,
      fuzzItems,
      requestBodyExamples
    )

    expect(fuzzer.fuzzVariations).toHaveLength(2)

    const requiredA = fuzzer.fuzzVariations.find(variation =>
      variation.item.name.includes('[required a]')
    )
    const requiredB = fuzzer.fuzzVariations.find(variation =>
      variation.item.name.includes('[required b]')
    )

    expect(requiredA).toBeDefined()
    expect(requiredB).toBeDefined()

    const bodyA = JSON.parse(requiredA.item.request?.body?.raw as string)
    const bodyB = JSON.parse(requiredB.item.request?.body?.raw as string)

    expect(bodyA).toEqual({ common: 'alpha' })
    expect(bodyB).toEqual({ common: 'beta' })
  })

  it('should select matching examples for anyOf with discriminator', async () => {
    const schema: OpenAPIV3.SchemaObject = {
      type: 'object',
      anyOf: [
        {
          type: 'object',
          required: ['type', 'name'],
          properties: {
            type: { enum: ['person'] },
            name: { type: 'string' }
          }
        },
        {
          type: 'object',
          required: ['type', 'company'],
          properties: {
            type: { enum: ['company'] },
            company: { type: 'string' }
          }
        }
      ],
      discriminator: {
        propertyName: 'type'
      }
    }

    const fuzzItems = fuzzer.analyzeFuzzJsonSchema(schema) as FuzzingSchemaItems
    const requestBodyExamples = [
      { type: 'person', name: 'Ada' },
      { type: 'company', company: 'ACME' }
    ]

    fuzzer.injectFuzzRequiredVariation(
      pmOpBody,
      oaOpBody,
      variationTest,
      variationMeta,
      fuzzItems,
      requestBodyExamples
    )

    const requiredName = fuzzer.fuzzVariations.find(variation =>
      variation.item.name.includes('[required name]')
    )
    const requiredCompany = fuzzer.fuzzVariations.find(variation =>
      variation.item.name.includes('[required company]')
    )

    expect(requiredName).toBeDefined()
    expect(requiredCompany).toBeDefined()

    const bodyName = JSON.parse(requiredName.item.request?.body?.raw as string)
    const bodyCompany = JSON.parse(requiredCompany.item.request?.body?.raw as string)

    expect(bodyName).toEqual({ type: 'person' })
    expect(bodyCompany).toEqual({ type: 'company' })
  })

  it('should skip fuzzing when no matching request body example exists', async () => {
    const schema: OpenAPIV3.SchemaObject = {
      type: 'object',
      required: ['name'],
      properties: {
        name: { type: 'string' }
      }
    }

    const fuzzItems = fuzzer.analyzeFuzzJsonSchema(schema) as FuzzingSchemaItems
    const requestBodyExamples = [{ device_id: 'a15e3ff0-fb5b-4026-a7d4-a65aa02bbfb8' }]
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined)

    fuzzer.injectFuzzRequiredVariation(
      pmOpBody,
      oaOpBody,
      variationTest,
      variationMeta,
      fuzzItems,
      requestBodyExamples
    )

    expect(fuzzer.fuzzVariations).toHaveLength(0)
    expect(warnSpy).toHaveBeenCalled()
    warnSpy.mockRestore()
  })

  it('should fuzz the 2nd required props of the request body', async () => {
    const fuzzItems = {
      fuzzType: PortmanFuzzTypes.requestBody,
      requiredFields: ['name', 'company_name'],
      minimumNumberFields: [],
      maximumNumberFields: [],
      minLengthFields: [],
      maxLengthFields: []
    } as FuzzingSchemaItems

    fuzzer.injectFuzzRequiredVariation(pmOpBody, oaOpBody, variationTest, variationMeta, fuzzItems)

    const result = fuzzer.fuzzVariations[1]
    expect(result.item.request?.body?.raw).toMatchSnapshot()
  })

  it('should fuzz the value of a prop of the request body below the defined minimum', async () => {
    const fuzzItems = {
      fuzzType: PortmanFuzzTypes.requestBody,
      requiredFields: [],
      minimumNumberFields: [{ path: 'monetary_amount', field: 'monetary_amount', value: 100 }],
      maximumNumberFields: [],
      minLengthFields: [],
      maxLengthFields: []
    } as FuzzingSchemaItems

    fuzzer.injectFuzzMinimumVariation(pmOpBody, oaOpBody, variationTest, variationMeta, fuzzItems)

    const result = fuzzer.fuzzVariations[0]
    expect(result.item.request?.body?.raw).toMatchSnapshot()
  })

  it('should fuzz the value of a prop of the request body to zero minimum', async () => {
    const fuzzItems = {
      fuzzType: PortmanFuzzTypes.requestBody,
      requiredFields: [],
      minimumNumberFields: [{ path: 'monetary_amount', field: 'monetary_amount', value: 1 }],
      maximumNumberFields: [],
      minLengthFields: [],
      maxLengthFields: []
    } as FuzzingSchemaItems

    fuzzer.injectFuzzMinimumVariation(pmOpBody, oaOpBody, variationTest, variationMeta, fuzzItems)

    const result = fuzzer.fuzzVariations[0]
    expect(result.item.request?.body?.raw).toContain('"monetary_amount": 0,')
  })

  it('should fuzz the value of a prop of the request body to a negative minimum', async () => {
    const fuzzItems = {
      fuzzType: PortmanFuzzTypes.requestBody,
      requiredFields: [],
      minimumNumberFields: [{ path: 'monetary_amount', field: 'monetary_amount', value: 0 }],
      maximumNumberFields: [],
      minLengthFields: [],
      maxLengthFields: []
    } as FuzzingSchemaItems

    fuzzer.injectFuzzMinimumVariation(pmOpBody, oaOpBody, variationTest, variationMeta, fuzzItems)

    const result = fuzzer.fuzzVariations[0]
    expect(result.item.request?.body?.raw).toContain('"monetary_amount": -1,')
  })

  it('should fuzz the value of a prop of the request body above the defined maximum', async () => {
    const fuzzItems = {
      fuzzType: PortmanFuzzTypes.requestBody,
      requiredFields: [],
      minimumNumberFields: [],
      maximumNumberFields: [{ path: 'monetary_amount', field: 'monetary_amount', value: 300 }],
      minLengthFields: [],
      maxLengthFields: []
    } as FuzzingSchemaItems

    fuzzer.injectFuzzMaximumVariation(pmOpBody, oaOpBody, variationTest, variationMeta, fuzzItems)

    const result = fuzzer.fuzzVariations[0]
    expect(result.item.request?.body?.raw).toMatchSnapshot()
  })

  it('should fuzz the value of a prop of the request body to zero maximum', async () => {
    const fuzzItems = {
      fuzzType: PortmanFuzzTypes.requestBody,
      requiredFields: [],
      minimumNumberFields: [],
      maximumNumberFields: [{ path: 'monetary_amount', field: 'monetary_amount', value: -1 }],
      minLengthFields: [],
      maxLengthFields: []
    } as FuzzingSchemaItems

    fuzzer.injectFuzzMaximumVariation(pmOpBody, oaOpBody, variationTest, variationMeta, fuzzItems)

    const result = fuzzer.fuzzVariations[0]
    expect(result.item.request?.body?.raw).toContain('"monetary_amount": 0,')
  })

  it('should fuzz the value of a prop of the request body above the defined minimum in float format', async () => {
    const fuzzItems = {
      fuzzType: PortmanFuzzTypes.requestBody,
      requiredFields: [],
      minimumNumberFields: [{ path: 'monetary_amount', field: 'monetary_amount', value: 100.1 }],
      maximumNumberFields: [],
      minLengthFields: [],
      maxLengthFields: []
    } as FuzzingSchemaItems

    fuzzer.injectFuzzMinimumVariation(pmOpBody, oaOpBody, variationTest, variationMeta, fuzzItems)

    const result = fuzzer.fuzzVariations[0]
    expect(result.item.request?.body?.raw).toMatchSnapshot()
  })

  it('should fuzz the value of a prop of the request body above the defined maximum in float format', async () => {
    const fuzzItems = {
      fuzzType: PortmanFuzzTypes.requestBody,
      requiredFields: [],
      minimumNumberFields: [],
      maximumNumberFields: [{ path: 'monetary_amount', field: 'monetary_amount', value: 300.67 }],
      minLengthFields: [],
      maxLengthFields: []
    } as FuzzingSchemaItems

    fuzzer.injectFuzzMaximumVariation(pmOpBody, oaOpBody, variationTest, variationMeta, fuzzItems)

    const result = fuzzer.fuzzVariations[0]
    expect(result.item.request?.body?.raw).toMatchSnapshot()
  })

  it('should fuzz the request body to empty when minimum length is 1', async () => {
    const fuzzItems = {
      fuzzType: PortmanFuzzTypes.requestBody,
      requiredFields: [],
      minimumNumberFields: [],
      maximumNumberFields: [],
      minLengthFields: [{ path: 'first_name', field: 'first_name', value: 1 }],
      maxLengthFields: []
    } as FuzzingSchemaItems

    fuzzer.injectFuzzMinLengthVariation(pmOpBody, oaOpBody, variationTest, variationMeta, fuzzItems)

    const result = fuzzer.fuzzVariations[0]
    expect(result.item.request?.body?.raw).toMatchSnapshot()
  })

  it('should fuzz the request body array to empty when minimum length is 1', async () => {
    const fuzzItems = {
      fuzzType: PortmanFuzzTypes.requestBody,
      requiredFields: [],
      minimumNumberFields: [],
      maximumNumberFields: [],
      minLengthFields: [{ path: 'addresses', field: 'addresses', value: 1 }],
      maxLengthFields: []
    } as FuzzingSchemaItems

    fuzzer.injectFuzzMinLengthVariation(pmOpBody, oaOpBody, variationTest, variationMeta, fuzzItems)

    const result = fuzzer.fuzzVariations[0]
    expect(result.item.request?.body?.raw).toMatchSnapshot()
  })

  it('should fuzz the request body array to 1 when the minimum length of 2', async () => {
    const fuzzItems = {
      fuzzType: PortmanFuzzTypes.requestBody,
      requiredFields: [],
      minimumNumberFields: [],
      maximumNumberFields: [],
      minLengthFields: [{ path: 'addresses', field: 'addresses', value: 2 }],
      maxLengthFields: []
    } as FuzzingSchemaItems

    fuzzer.injectFuzzMinLengthVariation(pmOpBody, oaOpBody, variationTest, variationMeta, fuzzItems)

    const result = fuzzer.fuzzVariations[0]
    expect(result.item.request?.body?.raw).toMatchSnapshot()
  })

  it.skip('should fuzz the request body object to 1 when the minimum length of 2', async () => {
    const fuzzItems = {
      fuzzType: PortmanFuzzTypes.requestBody,
      requiredFields: [],
      minimumNumberFields: [],
      maximumNumberFields: [],
      minLengthFields: [{ path: 'websites[0]', field: 'websites[0]', value: 2 }],
      maxLengthFields: []
    } as FuzzingSchemaItems

    fuzzer.injectFuzzMinLengthVariation(pmOpBody, oaOpBody, variationTest, variationMeta, fuzzItems)

    const result = fuzzer.fuzzVariations[0]
    expect(result.item.request?.body?.raw).toMatchSnapshot()
  })

  it('should fuzz the length of a string prop of the request body above the defined negative minimum', async () => {
    const fuzzItems = {
      fuzzType: PortmanFuzzTypes.requestBody,
      requiredFields: [],
      minimumNumberFields: [],
      maximumNumberFields: [],
      minLengthFields: [{ path: 'first_name', field: 'first_name', value: -1 }],
      maxLengthFields: []
    } as FuzzingSchemaItems

    fuzzer.injectFuzzMinLengthVariation(pmOpBody, oaOpBody, variationTest, variationMeta, fuzzItems)

    const result = fuzzer.fuzzVariations[0]
    expect(result.item.request?.body?.raw).toMatchSnapshot()
  })

  it('should fuzz the length of a string prop of the request body above the defined minimum length of 2', async () => {
    const fuzzItems = {
      fuzzType: PortmanFuzzTypes.requestBody,
      requiredFields: [],
      minimumNumberFields: [],
      maximumNumberFields: [],
      minLengthFields: [{ path: 'first_name', field: 'first_name', value: 2 }],
      maxLengthFields: []
    } as FuzzingSchemaItems

    fuzzer.injectFuzzMinLengthVariation(pmOpBody, oaOpBody, variationTest, variationMeta, fuzzItems)

    const result = fuzzer.fuzzVariations[0]
    expect(result.item.request?.body?.raw).toMatchSnapshot()
  })

  it('should fuzz the length of a number prop of the request body below the defined minimum length of 1', async () => {
    const fuzzItems = {
      fuzzType: PortmanFuzzTypes.requestBody,
      requiredFields: [],
      minimumNumberFields: [],
      maximumNumberFields: [],
      minLengthFields: [{ path: 'monetary_amount', field: 'monetary_amount', value: 1 }],
      maxLengthFields: []
    } as FuzzingSchemaItems

    fuzzer.injectFuzzMinLengthVariation(pmOpBody, oaOpBody, variationTest, variationMeta, fuzzItems)

    const result = fuzzer.fuzzVariations[0]
    expect(result.item.request?.body?.raw).toMatchSnapshot()
  })

  it('should fuzz the length of a number prop of the request body below the defined minimum length of 2', async () => {
    const fuzzItems = {
      fuzzType: PortmanFuzzTypes.requestBody,
      requiredFields: [],
      minimumNumberFields: [],
      maximumNumberFields: [],
      minLengthFields: [{ path: 'monetary_amount', field: 'monetary_amount', value: 2 }],
      maxLengthFields: []
    } as FuzzingSchemaItems

    fuzzer.injectFuzzMinLengthVariation(pmOpBody, oaOpBody, variationTest, variationMeta, fuzzItems)

    const result = fuzzer.fuzzVariations[0]
    expect(result.item.request?.body?.raw).toMatchSnapshot()
  })

  it('should fuzz the length of a string prop of the request body above the defined maximum', async () => {
    const fuzzItems = {
      fuzzType: PortmanFuzzTypes.requestBody,
      requiredFields: [],
      minimumNumberFields: [],
      maximumNumberFields: [],
      minLengthFields: [],
      maxLengthFields: [{ path: 'first_name', field: 'first_name', value: 10 }]
    } as FuzzingSchemaItems

    fuzzer.injectFuzzMaxLengthVariation(pmOpBody, oaOpBody, variationTest, variationMeta, fuzzItems)

    const result = fuzzer.fuzzVariations[0]
    expect(result.item.request?.body?.raw).toMatchSnapshot()
  })

  it('should fuzz the length of a number prop of the request body above the defined maximum', async () => {
    const fuzzItems = {
      fuzzType: PortmanFuzzTypes.requestBody,
      requiredFields: [],
      minimumNumberFields: [],
      maximumNumberFields: [],
      minLengthFields: [],
      maxLengthFields: [{ path: 'monetary_amount', field: 'monetary_amount', value: 10 }]
    } as FuzzingSchemaItems

    fuzzer.injectFuzzMaxLengthVariation(pmOpBody, oaOpBody, variationTest, variationMeta, fuzzItems)

    const result = fuzzer.fuzzVariations[0]
    expect(result.item.request?.body?.raw).toMatchSnapshot()
  })

  it('should fuzz the request body array to maximum length above the defined maximum', async () => {
    const fuzzItems = {
      fuzzType: PortmanFuzzTypes.requestBody,
      requiredFields: [],
      minimumNumberFields: [],
      maximumNumberFields: [],
      minLengthFields: [],
      maxLengthFields: [{ path: 'addresses', field: 'addresses', value: 3 }]
    } as FuzzingSchemaItems

    fuzzer.injectFuzzMaxLengthVariation(pmOpBody, oaOpBody, variationTest, variationMeta, fuzzItems)

    const result = fuzzer.fuzzVariations[0]
    expect(result.item.request?.body?.raw).toMatchSnapshot()
  })

  it.skip('should fuzz the request body object to maximum length above the defined maximum', async () => {
    const fuzzItems = {
      fuzzType: PortmanFuzzTypes.requestBody,
      requiredFields: [],
      minimumNumberFields: [],
      maximumNumberFields: [],
      minLengthFields: [],
      maxLengthFields: [{ path: 'websites.[0]', field: 'websites.[0]', value: 5 }]
    } as FuzzingSchemaItems

    fuzzer.injectFuzzMaxLengthVariation(pmOpBody, oaOpBody, variationTest, variationMeta, fuzzItems)

    const result = fuzzer.fuzzVariations[0]
    expect(result.item.request?.body?.raw).toMatchSnapshot()
  })

  it('should fuzz the required prop of the request query params', async () => {
    const fuzzItems = {
      fuzzType: PortmanFuzzTypes.requestQueryParam,
      requiredFields: ['cursor'],
      minimumNumberFields: [],
      maximumNumberFields: [],
      minLengthFields: [],
      maxLengthFields: []
    } as FuzzingSchemaItems

    fuzzer.injectFuzzRequiredVariation(
      pmOpQuery,
      oaOpQuery,
      variationTest,
      variationMeta,
      fuzzItems
    )

    const result = fuzzer.fuzzVariations[0]
    expect(result.item.request?.url?.query?.members).toMatchSnapshot()
  })

  it('should fuzz the multiple required props of the request query params', async () => {
    const fuzzItems = {
      fuzzType: PortmanFuzzTypes.requestQueryParam,
      requiredFields: ['raw', 'cursor'],
      minimumNumberFields: [],
      maximumNumberFields: [],
      minLengthFields: [],
      maxLengthFields: []
    } as FuzzingSchemaItems

    fuzzer.injectFuzzRequiredVariation(
      pmOpQuery,
      oaOpQuery,
      variationTest,
      variationMeta,
      fuzzItems
    )

    const result = fuzzer.fuzzVariations[1]
    expect(result.item.request?.url?.query?.members).toMatchSnapshot()
  })

  it('should fuzz the value of a prop of the request query params below the defined minimum', async () => {
    const fuzzItems = {
      fuzzType: PortmanFuzzTypes.requestQueryParam,
      requiredFields: [],
      minimumNumberFields: [{ path: 'limit', field: 'limit', value: 10 }],
      maximumNumberFields: [],
      minLengthFields: [],
      maxLengthFields: []
    } as FuzzingSchemaItems

    fuzzer.injectFuzzMinimumVariation(pmOpQuery, oaOpQuery, variationTest, variationMeta, fuzzItems)

    const result = fuzzer.fuzzVariations[0]
    expect(result.item.request?.url?.query?.members).toMatchSnapshot()
  })

  it('should fuzz the value of a prop of the request query params above the defined maximum', async () => {
    const fuzzItems = {
      fuzzType: PortmanFuzzTypes.requestQueryParam,
      requiredFields: [],
      minimumNumberFields: [],
      maximumNumberFields: [{ path: 'limit', field: 'limit', value: 100 }],
      minLengthFields: [],
      maxLengthFields: []
    } as FuzzingSchemaItems

    fuzzer.injectFuzzMaximumVariation(pmOpQuery, oaOpQuery, variationTest, variationMeta, fuzzItems)

    const result = fuzzer.fuzzVariations[0]
    expect(result.item.request?.url?.query?.members).toMatchSnapshot()
  })

  it('should fuzz the value of a prop of the request query params above the defined minimum in float format', async () => {
    const fuzzItems = {
      fuzzType: PortmanFuzzTypes.requestQueryParam,
      requiredFields: [],
      minimumNumberFields: [{ path: 'limit', field: 'limit', value: 100.1 }],
      maximumNumberFields: [],
      minLengthFields: [],
      maxLengthFields: []
    } as FuzzingSchemaItems

    fuzzer.injectFuzzMinimumVariation(pmOpBody, oaOpBody, variationTest, variationMeta, fuzzItems)

    const result = fuzzer.fuzzVariations[0]
    expect(result.item.request?.url?.query?.members).toMatchSnapshot()
  })

  it('should fuzz the value of a prop of the request query params above the defined maximum in float format', async () => {
    const fuzzItems = {
      fuzzType: PortmanFuzzTypes.requestQueryParam,
      requiredFields: [],
      minimumNumberFields: [],
      maximumNumberFields: [{ path: 'limit', field: 'limit', value: 300.67 }],
      minLengthFields: [],
      maxLengthFields: []
    } as FuzzingSchemaItems

    fuzzer.injectFuzzMaximumVariation(pmOpBody, oaOpBody, variationTest, variationMeta, fuzzItems)

    const result = fuzzer.fuzzVariations[0]
    expect(result.item.request?.url?.query?.members).toMatchSnapshot()
  })

  it('should fuzz the request query params to empty when minimum length is 1', async () => {
    const fuzzItems = {
      fuzzType: PortmanFuzzTypes.requestQueryParam,
      requiredFields: [],
      minimumNumberFields: [],
      maximumNumberFields: [],
      minLengthFields: [{ path: 'filter[first_name]', field: 'filter[first_name]', value: 1 }],
      maxLengthFields: []
    } as FuzzingSchemaItems

    fuzzer.injectFuzzMinLengthVariation(
      pmOpQuery,
      oaOpQuery,
      variationTest,
      variationMeta,
      fuzzItems
    )

    const result = fuzzer.fuzzVariations[0]
    expect(result.item.request?.url?.query?.members).toMatchSnapshot()
  })

  it('should fuzz the length of a string prop of the request query params above the defined below the defined minimum length of 2', async () => {
    const fuzzItems = {
      fuzzType: PortmanFuzzTypes.requestQueryParam,
      requiredFields: [],
      minimumNumberFields: [],
      maximumNumberFields: [],
      minLengthFields: [{ path: 'filter[first_name]', field: 'filter[first_name]', value: 2 }],
      maxLengthFields: []
    } as FuzzingSchemaItems

    fuzzer.injectFuzzMinLengthVariation(
      pmOpQuery,
      oaOpQuery,
      variationTest,
      variationMeta,
      fuzzItems
    )

    const result = fuzzer.fuzzVariations[0]
    expect(result.item.request?.url?.query?.members).toMatchSnapshot()
  })

  it('should fuzz the length of a number prop of the request query params above the defined below the defined minimum length of 1', async () => {
    const fuzzItems = {
      fuzzType: PortmanFuzzTypes.requestQueryParam,
      requiredFields: [],
      minimumNumberFields: [],
      maximumNumberFields: [],
      minLengthFields: [{ path: 'limit', field: 'limit', value: 1 }],
      maxLengthFields: []
    } as FuzzingSchemaItems

    fuzzer.injectFuzzMinLengthVariation(
      pmOpQuery,
      oaOpQuery,
      variationTest,
      variationMeta,
      fuzzItems
    )

    const result = fuzzer.fuzzVariations[0]
    expect(result.item.request?.url?.query?.members).toMatchSnapshot()
  })

  it('should fuzz the length of a string prop of the request query params above the defined maximum', async () => {
    const fuzzItems = {
      fuzzType: PortmanFuzzTypes.requestQueryParam,
      requiredFields: [],
      minimumNumberFields: [],
      maximumNumberFields: [],
      minLengthFields: [],
      maxLengthFields: [{ path: 'filter[first_name]', field: 'filter[first_name]', value: 10 }]
    } as FuzzingSchemaItems

    fuzzer.injectFuzzMaxLengthVariation(
      pmOpQuery,
      oaOpQuery,
      variationTest,
      variationMeta,
      fuzzItems
    )

    const result = fuzzer.fuzzVariations[0]
    expect(result.item.request?.url?.query?.members).toMatchSnapshot()
  })

  it('should fuzz the length of a number prop of the request query params above the defined maximum', async () => {
    const fuzzItems = {
      fuzzType: PortmanFuzzTypes.requestQueryParam,
      requiredFields: [],
      minimumNumberFields: [],
      maximumNumberFields: [],
      minLengthFields: [],
      maxLengthFields: [{ path: 'limit', field: 'limit', value: 10 }]
    } as FuzzingSchemaItems

    fuzzer.injectFuzzMaxLengthVariation(
      pmOpQuery,
      oaOpQuery,
      variationTest,
      variationMeta,
      fuzzItems
    )

    const result = fuzzer.fuzzVariations[0]
    expect(result.item.request?.url?.query?.members).toMatchSnapshot()
  })

  it('should fuzz the length of a PM dynamic variable in the request query params above the defined minimum', async () => {
    const fuzzItems = {
      fuzzType: PortmanFuzzTypes.requestQueryParam,
      requiredFields: [],
      minimumNumberFields: [],
      maximumNumberFields: [],
      minLengthFields: [{ path: 'raw', field: 'raw', value: 2 }],
      maxLengthFields: []
    } as FuzzingSchemaItems

    // Postman dynamic variable
    pmOpQuery.item.request.url.query.members[0].value = '{{$randomIntTest}}'

    fuzzer.injectFuzzMinLengthVariation(
      pmOpQuery,
      oaOpQuery,
      variationTest,
      variationMeta,
      fuzzItems
    )

    const result = fuzzer.fuzzVariations[0]
    expect(result.item.request?.url?.query?.members).toMatchSnapshot()
  })

  it('should fuzz the length of a PM dynamic variable in the request query params above the defined maximum', async () => {
    const fuzzItems = {
      fuzzType: PortmanFuzzTypes.requestQueryParam,
      requiredFields: [],
      minimumNumberFields: [],
      maximumNumberFields: [],
      minLengthFields: [],
      maxLengthFields: [{ path: 'raw', field: 'raw', value: 10 }]
    } as FuzzingSchemaItems

    // Postman dynamic variable
    pmOpQuery.item.request.url.query.members[0].value = '{{$randomIntTest}}'

    fuzzer.injectFuzzMaxLengthVariation(
      pmOpQuery,
      oaOpQuery,
      variationTest,
      variationMeta,
      fuzzItems
    )

    const result = fuzzer.fuzzVariations[0]
    expect(result.item.request?.url?.query?.members).toMatchSnapshot()
  })

  it('should not fuzz if plain Postman variable in the request query', async () => {
    const fuzzItems = {
      fuzzType: PortmanFuzzTypes.requestQueryParam,
      requiredFields: [],
      minimumNumberFields: [],
      maximumNumberFields: [],
      minLengthFields: [],
      maxLengthFields: [{ path: 'raw', field: 'raw', value: 10 }]
    } as FuzzingSchemaItems

    // Postman dynamic variable
    pmOpQuery.item.request.url.query.members[0].value = '{{fooBar}}'

    fuzzer.injectFuzzMaxLengthVariation(
      pmOpQuery,
      oaOpQuery,
      variationTest,
      variationMeta,
      fuzzItems
    )

    const result = fuzzer.fuzzVariations[0]
    expect(result).toBeUndefined()
  })

  it('should fuzz the required prop of the request header', async () => {
    const fuzzItems = {
      fuzzType: PortmanFuzzTypes.requestHeader,
      requiredFields: ['x-apideck-app-id'],
      minimumNumberFields: [],
      maximumNumberFields: [],
      minLengthFields: [],
      maxLengthFields: []
    } as FuzzingSchemaItems

    fuzzer.injectFuzzRequiredVariation(
      pmOpHeader,
      oaOpHeader,
      variationTest,
      variationMeta,
      fuzzItems
    )

    const result = fuzzer.fuzzVariations[0]
    expect(result.item.request?.headers?.members).toMatchSnapshot()
  })

  it('should fuzz the multiple required props of the request header', async () => {
    const fuzzItems = {
      fuzzType: PortmanFuzzTypes.requestHeader,
      requiredFields: ['x-apideck-app-id', 'x-apideck-consumer-id'],
      minimumNumberFields: [],
      maximumNumberFields: [],
      minLengthFields: [],
      maxLengthFields: []
    } as FuzzingSchemaItems

    fuzzer.injectFuzzRequiredVariation(
      pmOpHeader,
      oaOpHeader,
      variationTest,
      variationMeta,
      fuzzItems
    )

    const result = fuzzer.fuzzVariations[1]
    expect(result.item.request?.headers?.members).toMatchSnapshot()
  })

  it('should fuzz the value of a prop of the request header below the defined minimum', async () => {
    const fuzzItems = {
      fuzzType: PortmanFuzzTypes.requestHeader,
      requiredFields: [],
      minimumNumberFields: [{ path: 'x-apideck-app-id', field: 'x-apideck-app-id', value: 10 }],
      maximumNumberFields: [],
      minLengthFields: [],
      maxLengthFields: []
    } as FuzzingSchemaItems

    fuzzer.injectFuzzMinimumVariation(pmOpQuery, oaOpQuery, variationTest, variationMeta, fuzzItems)

    const result = fuzzer.fuzzVariations[0]
    expect(result.item.request?.headers?.members).toMatchSnapshot()
  })

  it('should fuzz the value of a prop of the request header above the defined maximum', async () => {
    const fuzzItems = {
      fuzzType: PortmanFuzzTypes.requestHeader,
      requiredFields: [],
      minimumNumberFields: [],
      maximumNumberFields: [{ path: 'x-apideck-app-id', field: 'x-apideck-app-id', value: 100 }],
      minLengthFields: [],
      maxLengthFields: []
    } as FuzzingSchemaItems

    fuzzer.injectFuzzMaximumVariation(pmOpQuery, oaOpQuery, variationTest, variationMeta, fuzzItems)

    const result = fuzzer.fuzzVariations[0]
    expect(result.item.request?.headers?.members).toMatchSnapshot()
  })

  it('should fuzz the value of a prop of the request header above the defined minimum in float format', async () => {
    const fuzzItems = {
      fuzzType: PortmanFuzzTypes.requestHeader,
      requiredFields: [],
      minimumNumberFields: [{ path: 'x-apideck-app-id', field: 'x-apideck-app-id', value: 100.1 }],
      maximumNumberFields: [],
      minLengthFields: [],
      maxLengthFields: []
    } as FuzzingSchemaItems

    fuzzer.injectFuzzMinimumVariation(pmOpBody, oaOpBody, variationTest, variationMeta, fuzzItems)

    const result = fuzzer.fuzzVariations[0]
    expect(result.item.request?.headers?.members).toMatchSnapshot()
  })

  it('should fuzz the value of a prop of the request header above the defined maximum in float format', async () => {
    const fuzzItems = {
      fuzzType: PortmanFuzzTypes.requestHeader,
      requiredFields: [],
      minimumNumberFields: [],
      maximumNumberFields: [{ path: 'x-apideck-app-id', field: 'x-apideck-app-id', value: 300.67 }],
      minLengthFields: [],
      maxLengthFields: []
    } as FuzzingSchemaItems

    fuzzer.injectFuzzMaximumVariation(pmOpBody, oaOpBody, variationTest, variationMeta, fuzzItems)

    const result = fuzzer.fuzzVariations[0]
    expect(result.item.request?.headers?.members).toMatchSnapshot()
  })

  it('should fuzz the request header to empty when minimum length is 1', async () => {
    const fuzzItems = {
      fuzzType: PortmanFuzzTypes.requestHeader,
      requiredFields: [],
      minimumNumberFields: [],
      maximumNumberFields: [],
      minLengthFields: [{ path: 'x-apideck-app-id', field: 'x-apideck-app-id', value: 1 }],
      maxLengthFields: []
    } as FuzzingSchemaItems

    fuzzer.injectFuzzMinLengthVariation(
      pmOpHeader,
      oaOpHeader,
      variationTest,
      variationMeta,
      fuzzItems
    )

    const result = fuzzer.fuzzVariations[0]
    expect(result.item.request?.headers?.members).toMatchSnapshot()
  })

  it('should fuzz the length of a string prop of the request header above the defined below the defined minimum length of 2', async () => {
    const fuzzItems = {
      fuzzType: PortmanFuzzTypes.requestHeader,
      requiredFields: [],
      minimumNumberFields: [],
      maximumNumberFields: [],
      minLengthFields: [{ path: 'x-apideck-app-id', field: 'x-apideck-app-id', value: 2 }],
      maxLengthFields: []
    } as FuzzingSchemaItems

    fuzzer.injectFuzzMinLengthVariation(
      pmOpHeader,
      oaOpHeader,
      variationTest,
      variationMeta,
      fuzzItems
    )

    const result = fuzzer.fuzzVariations[0]
    expect(result.item.request?.headers?.members).toMatchSnapshot()
  })

  it('should fuzz the length of a number prop of the request header above the defined below the defined minimum length of 1', async () => {
    const fuzzItems = {
      fuzzType: PortmanFuzzTypes.requestHeader,
      requiredFields: [],
      minimumNumberFields: [],
      maximumNumberFields: [],
      minLengthFields: [
        { path: 'x-apideck-consumer-id', field: 'x-apideck-consumer-id', value: 1 }
      ],
      maxLengthFields: []
    } as FuzzingSchemaItems

    fuzzer.injectFuzzMinLengthVariation(
      pmOpHeader,
      oaOpHeader,
      variationTest,
      variationMeta,
      fuzzItems
    )

    const result = fuzzer.fuzzVariations[0]
    expect(result.item.request?.headers?.members).toMatchSnapshot()
  })

  it('should fuzz the length of a string prop of the request header above the defined maximum', async () => {
    const fuzzItems = {
      fuzzType: PortmanFuzzTypes.requestHeader,
      requiredFields: [],
      minimumNumberFields: [],
      maximumNumberFields: [],
      minLengthFields: [],
      maxLengthFields: [{ path: 'x-apideck-app-id', field: 'x-apideck-app-id', value: 10 }]
    } as FuzzingSchemaItems

    fuzzer.injectFuzzMaxLengthVariation(
      pmOpHeader,
      oaOpHeader,
      variationTest,
      variationMeta,
      fuzzItems
    )

    const result = fuzzer.fuzzVariations[0]
    expect(result.item.request?.headers?.members).toMatchSnapshot()
  })

  it('should fuzz the length of a number prop of the request header above the defined maximum', async () => {
    const fuzzItems = {
      fuzzType: PortmanFuzzTypes.requestHeader,
      requiredFields: [],
      minimumNumberFields: [],
      maximumNumberFields: [],
      minLengthFields: [],
      maxLengthFields: [
        { path: 'x-apideck-consumer-id', field: 'x-apideck-consumer-id', value: 100 }
      ]
    } as FuzzingSchemaItems

    fuzzer.injectFuzzMaxLengthVariation(
      pmOpHeader,
      oaOpHeader,
      variationTest,
      variationMeta,
      fuzzItems
    )

    const result = fuzzer.fuzzVariations[0]
    expect(result.item.request?.headers?.members).toMatchSnapshot()
  })

  it('should fuzz the length of a PM dynamic variable in the request header above the defined minimum', async () => {
    const fuzzItems = {
      fuzzType: PortmanFuzzTypes.requestHeader,
      requiredFields: [],
      minimumNumberFields: [],
      maximumNumberFields: [],
      minLengthFields: [{ path: 'x-apideck-app-id', field: 'x-apideck-app-id', value: 2 }],
      maxLengthFields: []
    } as FuzzingSchemaItems

    // Postman dynamic variable
    pmOpQuery.item.request.headers.members[1].value = '{{$randomIntTest}}'

    fuzzer.injectFuzzMinLengthVariation(
      pmOpHeader,
      oaOpHeader,
      variationTest,
      variationMeta,
      fuzzItems
    )

    const result = fuzzer.fuzzVariations[0]
    expect(result.item.request?.headers?.members).toMatchSnapshot()
  })

  it('should fuzz the length of a PM dynamic variable in the request header above the defined maximum', async () => {
    const fuzzItems = {
      fuzzType: PortmanFuzzTypes.requestHeader,
      requiredFields: [],
      minimumNumberFields: [],
      maximumNumberFields: [],
      minLengthFields: [],
      maxLengthFields: [{ path: 'x-apideck-app-id', field: 'x-apideck-app-id', value: 100 }]
    } as FuzzingSchemaItems

    // Postman dynamic variable
    pmOpQuery.item.request.headers.members[1].value = '{{$randomIntTest}}'

    fuzzer.injectFuzzMaxLengthVariation(
      pmOpHeader,
      oaOpHeader,
      variationTest,
      variationMeta,
      fuzzItems
    )

    const result = fuzzer.fuzzVariations[0]
    expect(result.item.request?.headers?.members).toMatchSnapshot()
  })

  it('should not fuzz if plain Postman variable in the request header', async () => {
    const fuzzItems = {
      fuzzType: PortmanFuzzTypes.requestHeader,
      requiredFields: [],
      minimumNumberFields: [],
      maximumNumberFields: [],
      minLengthFields: [],
      maxLengthFields: [{ path: 'x-apideck-app-id', field: 'x-apideck-app-id', value: 10 }]
    } as FuzzingSchemaItems

    // Postman dynamic variable
    pmOpQuery.item.request.headers.members[1].value = '{{fooBar}}'

    fuzzer.injectFuzzMaxLengthVariation(
      pmOpHeader,
      oaOpHeader,
      variationTest,
      variationMeta,
      fuzzItems
    )

    const result = fuzzer.fuzzVariations[0]
    expect(result).toBeUndefined()
  })

  it('should analyse JSON schema of request body for fuzz detection', async () => {
    // Analyse JSON schema
    const reqBody = oaOpBody?.schema?.requestBody as unknown as OpenAPIV3.RequestBodyObject
    const schema = reqBody?.content?.['application/json']?.schema as OpenAPIV3.SchemaObject

    const result = fuzzer.analyzeFuzzJsonSchema(schema)
    expect(result).toMatchSnapshot()
  })

  it('should analyse JSON nested schema for fuzz detection', async () => {
    // Analyse JSON schema
    const schema = {
      properties: {
        container: {
          properties: {
            value: {
              minimum: 0,
              type: 'number'
            }
          },
          required: ['value'],
          type: 'object'
        }
      },
      required: ['container'],
      type: 'object'
    } as OpenAPIV3.SchemaObject
    const expected = {
      fuzzType: 'requestBody',
      requiredFields: ['container', 'container.value'],
      requiredFieldContexts: [
        { path: 'container', branchPath: undefined },
        { path: 'container.value', branchPath: undefined }
      ],
      minimumNumberFields: [
        {
          path: 'container.value',
          field: 'value',
          value: 0
        }
      ],
      maximumNumberFields: [],
      minLengthFields: [],
      maxLengthFields: []
    }

    const result = fuzzer.analyzeFuzzJsonSchema(schema)
    expect(result).toEqual(expected)
  })

  it('should analyse an array of numbers for fuzz detection', async () => {
    // Analyse JSON schema
    const schema = {
      description: 'Holds an array of numbers.',
      properties: {
        numbers: {
          description: 'An array of numbers.',
          items: {
            minimum: -366,
            type: 'integer'
          },
          type: 'array'
        }
      },
      type: 'object'
    } as OpenAPIV3.SchemaObject
    const expected = [
      {
        path: 'numbers[0]',
        field: '[0]',
        value: -366
      }
    ]

    const result = fuzzer.analyzeFuzzJsonSchema(schema)
    expect(result?.minimumNumberFields).toEqual(expected)
  })

  it('should analyse JSON schema of request body for fuzz detection with zero values', async () => {
    // Analyse JSON schema
    const schema = {
      type: 'object',
      properties: {
        numberField: {
          type: 'number',
          minimum: 0,
          maximum: 0
        },
        stringField: {
          type: 'string',
          minLength: 0,
          maxLength: 0
        }
      },
      required: ['numberField', 'stringField']
    } as OpenAPIV3.SchemaObject

    const result = fuzzer.analyzeFuzzJsonSchema(schema)
    expect(result).toMatchSnapshot()
  })

  it.skip('should analyse JSON schema of request body with top level object for fuzz detection', async () => {
    // Analyse JSON schema with nested properties
    const schema = {
      type: 'object',
      minLength: 1,
      maxLength: 5,
      properties: {
        level1: {
          required: ['code'],
          properties: {
            code: {
              type: 'number',
              example: 1,
              minimum: 1,
              maximum: 100
            }
          }
        }
      }
    } as OpenAPIV3.SchemaObject

    const result = fuzzer.analyzeFuzzJsonSchema(schema)
    expect(result).toMatchSnapshot()
  })

  it('should analyse JSON schema of request body with deeply object nesting for fuzz detection', async () => {
    // Analyse JSON schema with nested properties
    const schema = {
      properties: {
        nestedOb: {
          type: 'object',
          properties: {
            level1: {
              type: 'object',
              properties: {
                level2: {
                  type: 'object',
                  required: ['code'],
                  properties: {
                    code: {
                      type: 'number',
                      example: 1,
                      minimum: 1,
                      maximum: 100,
                      minLength: 1,
                      maxLength: 5
                    }
                  }
                }
              }
            }
          }
        }
      }
    } as OpenAPIV3.SchemaObject

    const result = fuzzer.analyzeFuzzJsonSchema(schema)
    expect(result).toMatchSnapshot()
  })

  it('should analyse JSON schema of request body with deeply object nesting for fuzz detection with nullable property', async () => {
    // Analyse JSON schema with nested properties
    const schema = {
      properties: {
        nestedOb: {
          type: 'object',
          properties: {
            level1: {
              type: 'object',
              properties: {
                level2: {
                  type: 'object',
                  required: ['code'],
                  properties: {
                    code: {
                      type: 'number',
                      example: 1,
                      minimum: 1,
                      maximum: 100,
                      minLength: 1,
                      maxLength: 5,
                      nullable: true
                    }
                  }
                }
              }
            }
          }
        }
      }
    } as OpenAPIV3.SchemaObject

    const result = fuzzer.analyzeFuzzJsonSchema(schema)
    expect(result).toMatchSnapshot()
  })

  it('should analyse JSON schema of request body with deeply object nesting for fuzz detection with minimum length object', async () => {
    // Analyse JSON schema with nested properties
    const schema = {
      nestedOb: {
        minLength: 1,
        maxLength: 100,
        type: 'object',
        properties: {
          level1: {
            type: 'object',
            minLength: 1,
            maxLength: 100,
            properties: {
              level2: {
                type: 'object',
                minLength: 1,
                maxLength: 100,
                properties: {
                  code: {
                    type: 'number',
                    example: 1
                  }
                }
              }
            }
          }
        }
      }
    } as OpenAPIV3.SchemaObject

    const result = fuzzer.analyzeFuzzJsonSchema(schema)
    expect(result).toMatchSnapshot()
  })

  it('should analyse JSON schema of request body with deeply array nesting for fuzz detection', async () => {
    // Analyse JSON schema with nested properties
    const schema = {
      properties: {
        nestedArray: {
          type: 'array',
          items: {
            level1: {
              type: 'array',
              items: {
                level2: {
                  type: 'array',
                  items: {
                    type: 'object',
                    required: ['code'],
                    properties: {
                      code: {
                        type: 'number',
                        example: 1,
                        minimum: 1,
                        maximum: 100,
                        minLength: 1,
                        maxLength: 5
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    } as OpenAPIV3.SchemaObject

    const result = fuzzer.analyzeFuzzJsonSchema(schema)
    expect(result).toMatchSnapshot()
  })

  it('should analyse JSON schema of request body with deeply array nesting for fuzz detection with nullable property', async () => {
    // Analyse JSON schema with nested properties
    const schema = {
      properties: {
        nestedArray: {
          type: 'array',
          items: {
            level1: {
              type: 'array',
              items: {
                level2: {
                  type: 'array',
                  items: {
                    type: 'object',
                    required: ['code'],
                    properties: {
                      code: {
                        type: 'number',
                        example: 1,
                        minimum: 1,
                        maximum: 100,
                        minLength: 1,
                        maxLength: 5,
                        nullable: true
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    } as OpenAPIV3.SchemaObject

    const result = fuzzer.analyzeFuzzJsonSchema(schema)
    expect(result).toMatchSnapshot()
  })

  it('should analyse JSON schema of request body with deeply array nesting with items prop for fuzz detection', async () => {
    // Analyse JSON schema with nested properties
    const schema = {
      properties: {
        nestedArray: {
          type: 'array',
          items: {
            type: 'object',
            required: ['items'],
            properties: {
              items: {
                type: 'number',
                example: 1,
                minimum: 1,
                maximum: 100,
                minLength: 1,
                maxLength: 5
              }
            }
          }
        }
      }
    } as OpenAPIV3.SchemaObject

    const result = fuzzer.analyzeFuzzJsonSchema(schema)
    expect(result).toMatchSnapshot()
  })

  it('should analyse JSON schema of request body with deeply array nesting with items prop for fuzz detection with nullable property', async () => {
    // Analyse JSON schema with nested properties
    const schema = {
      properties: {
        nestedArray: {
          type: 'array',
          items: {
            type: 'object',
            required: ['items'],
            properties: {
              items: {
                type: 'number',
                example: 1,
                minimum: 1,
                maximum: 100,
                minLength: 1,
                maxLength: 5,
                nullable: true
              }
            }
          }
        }
      }
    } as OpenAPIV3.SchemaObject

    const result = fuzzer.analyzeFuzzJsonSchema(schema)
    expect(result).toMatchSnapshot()
  })

  it('should analyse JSON schema of request body with deeply array nesting with properties prop for fuzz detection', async () => {
    // Analyse JSON schema with nested properties
    const schema = {
      properties: {
        nestedArray: {
          type: 'array',
          items: {
            type: 'object',
            required: ['nestedProperties'],
            properties: {
              nestedProperties: {
                type: 'number',
                example: 1,
                minimum: 1,
                maximum: 100,
                minLength: 1,
                maxLength: 5
              }
            }
          }
        }
      }
    } as OpenAPIV3.SchemaObject

    const result = fuzzer.analyzeFuzzJsonSchema(schema)
    expect(result).toMatchSnapshot()
  })

  it('should analyse JSON schema of request body with deeply array nesting with properties prop for fuzz detection with nullable property', async () => {
    // Analyse JSON schema with nested properties
    const schema = {
      properties: {
        nestedArray: {
          type: 'array',
          items: {
            type: 'object',
            required: ['nestedProperties'],
            properties: {
              nestedProperties: {
                type: 'number',
                example: 1,
                minimum: 1,
                maximum: 100,
                minLength: 1,
                maxLength: 5,
                nullable: true
              }
            }
          }
        }
      }
    } as OpenAPIV3.SchemaObject

    const result = fuzzer.analyzeFuzzJsonSchema(schema)
    expect(result).toMatchSnapshot()
  })

  it('should analyse JSON schema of request body with array of objects for fuzz detection', async () => {
    // Analyse JSON schema with nested properties
    const schema = {
      items: {
        type: 'object',
        required: ['code'],
        properties: {
          code: {
            type: 'number',
            example: 1,
            minimum: 1,
            maximum: 100,
            minLength: 1,
            maxLength: 5
          }
        }
      }
    } as OpenAPIV3.SchemaObject

    const result = fuzzer.analyzeFuzzJsonSchema(schema)
    expect(result).toMatchSnapshot()
  })

  it('should analyse JSON schema of request body with array of objects for fuzz detection with nullable property', async () => {
    // Analyse JSON schema with nested properties
    const schema = {
      items: {
        type: 'object',
        required: ['code'],
        properties: {
          code: {
            type: 'number',
            example: 1,
            minimum: 1,
            maximum: 100,
            minLength: 1,
            maxLength: 5,
            nullable: true
          }
        }
      }
    } as OpenAPIV3.SchemaObject

    const result = fuzzer.analyzeFuzzJsonSchema(schema)
    expect(result).toMatchSnapshot()
  })

  it('should analyse JSON schema of request body with a mix of nested items for fuzz detection', async () => {
    // Analyse JSON schema with nested properties
    const schema = {
      items: {
        type: 'object',
        required: ['code', 'nestedArray'],
        properties: {
          code: {
            type: 'number',
            example: 1,
            minimum: 1,
            maximum: 100,
            minLength: 1,
            maxLength: 5
          },
          nestedArray: {
            type: 'array',
            items: {
              type: 'object',
              required: ['code2'],
              properties: {
                code2: {
                  type: 'number',
                  example: 1,
                  minimum: 1,
                  maximum: 100,
                  minLength: 1,
                  maxLength: 5
                }
              }
            }
          }
        }
      }
    } as OpenAPIV3.SchemaObject

    const result = fuzzer.analyzeFuzzJsonSchema(schema)
    expect(result).toMatchSnapshot()
  })

  it('should analyse JSON schema of request body with a mix of nested items for fuzz detection with nullable property', async () => {
    // Analyse JSON schema with nested properties
    const schema = {
      items: {
        type: 'object',
        required: ['code', 'nestedArray'],
        properties: {
          code: {
            type: 'number',
            example: 1,
            minimum: 1,
            maximum: 100,
            minLength: 1,
            maxLength: 5,
            nullable: true
          },
          nestedArray: {
            type: 'array',
            items: {
              type: 'object',
              required: ['code2'],
              properties: {
                code2: {
                  type: 'number',
                  example: 1,
                  minimum: 1,
                  maximum: 100,
                  minLength: 1,
                  maxLength: 5,
                  nullable: true
                }
              }
            }
          }
        }
      }
    } as OpenAPIV3.SchemaObject

    const result = fuzzer.analyzeFuzzJsonSchema(schema)
    expect(result).toMatchSnapshot()
  })

  it('should analyse allOf JSON schema of request body with a mix of nested items for fuzz detection with nullable property', async () => {
    // Analyse JSON schema with nested properties
    const schema = {
      allOf: [
        {
          description: 'Definition of base properties.',
          properties: {
            array: {
              description: 'A collection.',
              items: {
                description: 'My Object.',
                properties: {
                  id: {
                    description: 'The identifier.',
                    example: '112223333',
                    maxLength: 100,
                    minLength: 1,
                    type: 'string'
                  },
                  scheme: {
                    description: 'The scheme.',
                    example: 'FOO',
                    maxLength: 50,
                    minLength: 1,
                    type: 'string'
                  }
                },
                required: ['id', 'scheme'],
                type: 'object'
              },
              type: 'array',
              maxItems: 2,
              minItems: 2
            },
            name: {
              description: 'Name.',
              example: 'My Name',
              maxLength: 120,
              minLength: 1,
              type: 'string'
            }
          },
          type: 'object'
        }
      ],
      description: 'Definition of properties for creating an item.',
      required: ['name']
    } as OpenAPIV3.SchemaObject

    const result = fuzzer.analyzeFuzzJsonSchema(schema)
    expect(result).toMatchSnapshot()
  })

  it('should analyse anyOf JSON schema of request body with a mix of nested items for fuzz detection with nullable property', async () => {
    // Analyse JSON schema with nested properties
    const schema = {
      anyOf: [
        {
          description: 'Definition of base properties.',
          properties: {
            array: {
              description: 'A collection.',
              items: {
                description: 'My Object.',
                properties: {
                  id: {
                    description: 'The identifier.',
                    example: '112223333',
                    maxLength: 100,
                    minLength: 1,
                    type: 'string'
                  },
                  scheme: {
                    description: 'The scheme.',
                    example: 'FOO',
                    maxLength: 50,
                    minLength: 1,
                    type: 'string'
                  }
                },
                required: ['id', 'scheme'],
                type: 'object'
              },
              type: 'array',
              maxItems: 2,
              minItems: 2
            },
            name: {
              description: 'Name.',
              example: 'My Name',
              maxLength: 120,
              minLength: 1,
              type: 'string'
            }
          },
          type: 'object'
        }
      ],
      description: 'Definition of properties for creating an item.',
      required: ['name']
    } as OpenAPIV3.SchemaObject

    const result = fuzzer.analyzeFuzzJsonSchema(schema)
    expect(result).toMatchSnapshot()
  })

  it('should analyse oneOf JSON schema of request body with a mix of nested items for fuzz detection with nullable property', async () => {
    // Analyse JSON schema with nested properties
    const schema = {
      oneOf: [
        {
          description: 'Definition of base properties.',
          properties: {
            array: {
              description: 'A collection.',
              items: {
                description: 'My Object.',
                properties: {
                  id: {
                    description: 'The identifier.',
                    example: '112223333',
                    maxLength: 100,
                    minLength: 1,
                    type: 'string'
                  },
                  scheme: {
                    description: 'The scheme.',
                    example: 'FOO',
                    maxLength: 50,
                    minLength: 1,
                    type: 'string'
                  }
                },
                required: ['id', 'scheme'],
                type: 'object'
              },
              type: 'array',
              maxItems: 2,
              minItems: 2
            },
            name: {
              description: 'Name.',
              example: 'My Name',
              maxLength: 120,
              minLength: 1,
              type: 'string'
            }
          },
          type: 'object'
        }
      ],
      description: 'Definition of properties for creating an item.',
      required: ['name']
    } as OpenAPIV3.SchemaObject

    const result = fuzzer.analyzeFuzzJsonSchema(schema)
    expect(result).toMatchSnapshot()
  })

  it('should analyse nested allOf JSON schema of request body with a mix of nested items for fuzz detection', async () => {
    // Analyse JSON schema with nested properties
    const schema = {
      type: 'object',
      properties: {
        payload: {
          type: 'object',
          properties: {
            order: {
              type: 'object',
              properties: {
                address: {
                  allOf: [
                    {
                      type: 'object',
                      properties: {
                        street: {
                          type: 'string',
                          minLength: 5,
                          title: 'street'
                        },
                        streetNumber: {
                          type: 'number',
                          minimum: 1,
                          title: 'street number'
                        },
                        cityName: {
                          type: 'string',
                          title: 'cityName'
                        }
                      },
                      required: ['street', 'cityName'],
                      title: 'Address'
                    }
                  ],
                  minLength: 1,
                  maxLength: 10
                }
              },
              required: ['address'],
              title: 'order'
            }
          },
          required: ['order']
        }
      },
      required: ['payload']
    } as OpenAPIV3.SchemaObject

    const result = fuzzer.analyzeFuzzJsonSchema(schema)
    expect(result).toMatchSnapshot()
  })

  it('should analyse nested anyOf JSON schema of request body with a mix of nested items for fuzz detection', async () => {
    // Analyse JSON schema with nested properties
    const schema = {
      type: 'object',
      properties: {
        payload: {
          type: 'object',
          properties: {
            order: {
              type: 'object',
              properties: {
                address: {
                  anyOf: [
                    {
                      type: 'object',
                      properties: {
                        street: {
                          type: 'string',
                          minLength: 5,
                          title: 'street'
                        },
                        streetNumber: {
                          type: 'number',
                          minimum: 1,
                          title: 'street number'
                        },
                        cityName: {
                          type: 'string',
                          title: 'cityName'
                        }
                      },
                      required: ['street', 'cityName'],
                      title: 'Address'
                    }
                  ],
                  minLength: 1,
                  maxLength: 10
                }
              },
              required: ['address'],
              title: 'order'
            }
          },
          required: ['order']
        }
      },
      required: ['payload']
    } as OpenAPIV3.SchemaObject

    const result = fuzzer.analyzeFuzzJsonSchema(schema)
    expect(result).toMatchSnapshot()
  })

  it('should analyse nested oneOf JSON schema of request body with a mix of nested items for fuzz detection', async () => {
    // Analyse JSON schema with nested properties
    const schema = {
      type: 'object',
      properties: {
        payload: {
          type: 'object',
          properties: {
            order: {
              type: 'object',
              properties: {
                address: {
                  oneOf: [
                    {
                      type: 'object',
                      properties: {
                        street: {
                          type: 'string',
                          minLength: 5,
                          title: 'street'
                        },
                        streetNumber: {
                          type: 'number',
                          minimum: 1,
                          title: 'street number'
                        },
                        cityName: {
                          type: 'string',
                          title: 'cityName'
                        }
                      },
                      required: ['street', 'cityName'],
                      title: 'Address'
                    }
                  ],
                  minLength: 1,
                  maxLength: 10
                }
              },
              required: ['address'],
              title: 'order'
            }
          },
          required: ['order']
        }
      },
      required: ['payload']
    } as OpenAPIV3.SchemaObject

    const result = fuzzer.analyzeFuzzJsonSchema(schema)
    expect(result).toMatchSnapshot()
  })

  it('should analyse JSON schema of request body with properties named after reserved words for fuzz detection', async () => {
    // Analyse JSON schema with properties that use reserved words
    const schema = {
      properties: {
        nullable: {
          type: 'object',
          properties: {
            nullable: {
              type: 'boolean',
              example: true
            }
          }
        },
        required: {
          type: 'object',
          properties: {
            nullable: {
              type: 'boolean',
              example: true
            }
          }
        },
        maximum: {
          type: 'object',
          properties: {
            nullable: {
              type: 'boolean',
              example: true
            }
          }
        },
        minimum: {
          type: 'object',
          properties: {
            nullable: {
              type: 'boolean',
              example: true
            }
          }
        },
        maxLength: {
          type: 'object',
          properties: {
            nullable: {
              type: 'boolean',
              example: true
            }
          }
        },
        minLength: {
          type: 'object',
          properties: {
            nullable: {
              type: 'boolean',
              example: true
            }
          }
        }
      },
      required: ['nullable', 'required', 'maximum', 'minimum', 'maxLength', 'minLength']
    } as OpenAPIV3.SchemaObject

    const result = fuzzer.analyzeFuzzJsonSchema(schema)
    expect(result).toMatchSnapshot()
  })

  it('should analyse the request query param for fuzz detection', async () => {
    // Analyse query param
    const reqQueryParams = oaOpQuery?.queryParams as unknown as OpenAPIV3.ParameterObject[]

    const result = fuzzer.analyzeQuerySchema(reqQueryParams[1])
    expect(result).toMatchSnapshot()
  })

  it('should analyse the request query param for fuzz detection with zero values for number', async () => {
    // Analyse query param
    const queryParam = {
      name: 'testParam',
      in: 'query',
      required: true,
      schema: {
        type: 'number',
        minimum: 0,
        maximum: 0
      }
    }
    const reqQueryParams = [queryParam] as unknown as OpenAPIV3.ParameterObject[]

    const result = fuzzer.analyzeQuerySchema(reqQueryParams[0])
    expect(result).toMatchSnapshot()
  })

  it('should analyse the request query param for fuzz detection with zero values for string', async () => {
    // Analyse query param
    const queryParam = {
      name: 'testParam',
      in: 'query',
      required: true,
      schema: {
        type: 'string',
        minLength: 0,
        maxLength: 0
      }
    }
    const reqQueryParams = [queryParam] as unknown as OpenAPIV3.ParameterObject[]

    const result = fuzzer.analyzeQuerySchema(reqQueryParams[0])
    expect(result).toMatchSnapshot()
  })

  it('should analyse the request header for fuzz detection', async () => {
    // Analyse query param
    const reqHeaders = oaOpHeader?.requestHeaders as unknown as OpenAPIV3.ParameterObject[]

    const result = fuzzer.analyzeHeaderSchema(reqHeaders[1])
    expect(result).toMatchSnapshot()
  })

  it('should analyse the request header for fuzz detection with zero values for number', async () => {
    // Analyse query param
    const headerParamSchema = {
      name: 'testHeader',
      in: 'header',
      required: true,
      schema: {
        type: 'number',
        minimum: 0,
        maximum: 0
      }
    }

    // Mock the request headers
    const reqHeaders = [headerParamSchema] as unknown as OpenAPIV3.ParameterObject[]

    const result = fuzzer.analyzeHeaderSchema(reqHeaders[0])
    expect(result).toMatchSnapshot()
  })

  it('should analyse the request header for fuzz detection with zero values for string', async () => {
    // Analyse query param
    const headerParamSchema = {
      name: 'testHeader',
      in: 'header',
      required: true,
      schema: {
        type: 'string',
        minLength: 0,
        maxLength: 0
      }
    }

    // Mock the request headers
    const reqHeaders = [headerParamSchema] as unknown as OpenAPIV3.ParameterObject[]

    const result = fuzzer.analyzeHeaderSchema(reqHeaders[0])
    expect(result).toMatchSnapshot()
  })

  it('should not break when a property is named "required" and is not an array', () => {
    // Schema with a property named 'required' that is not an array
    const schema = {
      type: 'object',
      properties: {
        required: {
          type: 'string',
          example: 'not-an-array'
        },
        name: {
          type: 'string'
        }
      },
      required: ['name']
    } as OpenAPIV3.SchemaObject

    const fuzzer = new Fuzzer({
      testSuite: {} as any,
      variationWriter: {} as any
    })

    const result = fuzzer.analyzeFuzzJsonSchema(schema)
    expect(result).not.toBeNull()
    expect(result!.requiredFields).toContain('name')
    expect(result!.requiredFields).not.toContain('required')
  })
})
