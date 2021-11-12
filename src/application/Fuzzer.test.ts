import { TestSuite, VariationWriter } from '../application'
import { PostmanParser } from '../postman'
import { OpenApiParser } from '../oas'
import fs from 'fs-extra'
import { getConfig } from '../lib'
import { Collection } from 'postman-collection'
import { Fuzzer } from './Fuzzer'
import { FuzzingSchemaItems, PortmanFuzzTypes } from '../types'
import { OpenAPIV3 } from 'openapi-types'

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
  let oaOpBody
  let oaOpQuery

  const postmanJson = '__tests__/fixtures/crm.postman.json'
  const oasYml = '__tests__/fixtures/crm.yml'
  const portmanConfigFile = '__tests__/fixtures/portman-fuzzing.crm.json'

  beforeEach(async () => {
    oasParser = new OpenApiParser()
    await oasParser.convert({ inputFile: oasYml })
    const postmanObj = JSON.parse(fs.readFileSync(postmanJson).toString())
    const config = await getConfig(portmanConfigFile)
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
    oaOpBody = oasParser.getOperationByPath(pmOpBody.pathRef)
    oaOpQuery = oasParser.getOperationByPath(pmOpQuery.pathRef)
  })

  it('should not fuzz', async () => {
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

  it('should analyse JSON schema of request body for fuzz detection', async () => {
    // Analyse JSON schema
    const reqBody = oaOpBody?.schema?.requestBody as unknown as OpenAPIV3.RequestBodyObject
    const schema = reqBody?.content?.['application/json']?.schema as OpenAPIV3.SchemaObject

    const result = fuzzer.analyzeFuzzJsonSchema(schema)
    expect(result).toMatchSnapshot()
  })

  it('should analyse the request query param for fuzz detection', async () => {
    // Analyse query param
    const reqQueryParams = oaOpQuery?.queryParams as unknown as OpenAPIV3.ParameterObject[]

    const result = fuzzer.analyzeQuerySchema(reqQueryParams[1])
    expect(result).toMatchSnapshot()
  })
})
