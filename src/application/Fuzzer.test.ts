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
            required: ['properties'],
            properties: {
              properties: {
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
            required: ['properties'],
            properties: {
              properties: {
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

  it('should analyse the request query param for fuzz detection', async () => {
    // Analyse query param
    const reqQueryParams = oaOpQuery?.queryParams as unknown as OpenAPIV3.ParameterObject[]

    const result = fuzzer.analyzeQuerySchema(reqQueryParams[1])
    expect(result).toMatchSnapshot()
  })

  it('should analyse the request header for fuzz detection', async () => {
    // Analyse query param
    const reqHeaders = oaOpHeader?.requestHeaders as unknown as OpenAPIV3.ParameterObject[]

    const result = fuzzer.analyzeHeaderSchema(reqHeaders[1])
    expect(result).toMatchSnapshot()
  })
})
