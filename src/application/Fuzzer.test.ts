import { TestSuite, VariationWriter } from '../application'
import { PostmanParser } from '../postman'
import { OpenApiParser } from '../oas'
import fs from 'fs-extra'
import { getConfig } from '../lib'
import { Collection } from 'postman-collection'
import { Fuzzer } from './Fuzzer'
import { FuzzingSchemaItems, PortmanFuzzTypes } from '../types'

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
  let pmOp
  let oaOp

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
    pmOp = pmOps[11] // POST Leads operation
    oaOp = oasParser.getOperationByPath(pmOp.pathRef)
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

    fuzzer.injectFuzzRequiredVariation(pmOp, oaOp, variationTest, variationMeta, fuzzItems)

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

    fuzzer.injectFuzzRequiredVariation(pmOp, oaOp, variationTest, variationMeta, fuzzItems)

    const result = fuzzer.fuzzVariations[0]
    expect(result.item.request?.body?.raw).toMatchSnapshot()
  })

  it('should fuzz the multiple required props of the request body', async () => {
    const fuzzItems = {
      fuzzType: PortmanFuzzTypes.requestBody,
      requiredFields: ['name', 'company_name'],
      minimumNumberFields: [],
      maximumNumberFields: [],
      minLengthFields: [],
      maxLengthFields: []
    } as FuzzingSchemaItems

    fuzzer.injectFuzzRequiredVariation(pmOp, oaOp, variationTest, variationMeta, fuzzItems)

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

    fuzzer.injectFuzzMinimumVariation(pmOp, oaOp, variationTest, variationMeta, fuzzItems)

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

    fuzzer.injectFuzzMaximumVariation(pmOp, oaOp, variationTest, variationMeta, fuzzItems)

    const result = fuzzer.fuzzVariations[0]
    expect(result.item.request?.body?.raw).toMatchSnapshot()
  })

  it('should fuzz the length of a prop of the request body above the defined minimum', async () => {
    const fuzzItems = {
      fuzzType: PortmanFuzzTypes.requestBody,
      requiredFields: [],
      minimumNumberFields: [],
      maximumNumberFields: [],
      minLengthFields: [{ path: 'first_name', field: 'first_name', value: 11 }],
      maxLengthFields: []
    } as FuzzingSchemaItems

    fuzzer.injectFuzzMinLengthVariation(pmOp, oaOp, variationTest, variationMeta, fuzzItems)

    const result = fuzzer.fuzzVariations[0]
    expect(result.item.request?.body?.raw).toMatchSnapshot()
  })

  it('should fuzz the length of a prop of the request body above the defined maximum', async () => {
    const fuzzItems = {
      fuzzType: PortmanFuzzTypes.requestBody,
      requiredFields: [],
      minimumNumberFields: [],
      maximumNumberFields: [],
      minLengthFields: [],
      maxLengthFields: [{ path: 'first_name', field: 'first_name', value: 10 }]
    } as FuzzingSchemaItems

    fuzzer.injectFuzzMaxLengthVariation(pmOp, oaOp, variationTest, variationMeta, fuzzItems)

    const result = fuzzer.fuzzVariations[0]
    expect(result.item.request?.body?.raw).toMatchSnapshot()
  })
})
