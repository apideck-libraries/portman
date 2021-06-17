import { OpenAPIV3 } from 'openapi-types'
import { Collection } from 'postman-collection'
import {
  applyOverwrites,
  assignCollectionVariables,
  extendTest,
  testResponseBodyContent,
  testResponseContentType,
  testResponseHeader,
  testResponseJsonBody,
  testResponseJsonSchema,
  testResponseStatusSuccess,
  testResponseTime,
  VariationWriter
} from '.'
import { OasMappedOperation, OpenApiParser } from '../oas'
import { PostmanMappedOperation, PostmanParser } from '../postman'
import {
  AssignVariablesConfig,
  ContentTestConfig,
  ContractTestConfig,
  OverwriteRequestConfig,
  PortmanConfig,
  ResponseTime,
  TestSuiteOptions,
  VariationTestConfig
} from '../types'
import { inRange } from '../utils'
import { inOperations } from '../utils/inOperations'

export class TestSuite {
  public collection: Collection

  oasParser: OpenApiParser
  postmanParser: PostmanParser
  config: PortmanConfig

  contractTests?: ContractTestConfig[]
  contentTests?: ContentTestConfig[]
  variationTests?: VariationTestConfig[]

  pmResponseJsonVarInjected: boolean

  constructor(options: TestSuiteOptions) {
    const { oasParser, postmanParser, config } = options

    this.pmResponseJsonVarInjected = false

    this.oasParser = oasParser
    this.postmanParser = postmanParser
    this.config = config

    this.collection = postmanParser.collection
    this.setupTests()
  }

  setupTests = (): void => {
    if (!this.config?.tests) return

    this.contractTests = this.config?.tests?.contractTests
    this.contentTests = this.config?.tests?.contentTests
    this.variationTests = this.config?.tests?.variationTests
  }

  public generateAutomatedTests = (): PostmanMappedOperation[] => {
    if (!this.contractTests) return this.postmanParser.mappedOperations

    const contractTests = this.contractTests

    return this.postmanParser.mappedOperations.map(pmOperation => {
      // Get OpenApi responses
      const oaOperation = this.oasParser.getOperationByPath(pmOperation.pathRef)

      if (oaOperation) {
        // Inject response tests
        pmOperation = this.injectContractTests(pmOperation, oaOperation, contractTests)
      }

      return pmOperation
    })
  }

  public generateVariationTests = (): void => {
    if (!this.variationTests) return

    const variationTests = this.variationTests
    const variationWriter = new VariationWriter({ testSuite: this })

    variationTests.map(variationTest => {
      //Get Postman operations to inject variation test for
      const pmOperations = this.getOperationsFromSetting(variationTest)

      pmOperations.map(pmOperation => {
        // Get OpenApi responses
        const oaOperation = this.oasParser.getOperationByPath(pmOperation.pathRef)
        variationWriter.add(pmOperation, oaOperation, variationTest.variations)
      })
    })

    this.collection = variationWriter.mergeToCollection(this.collection)
  }

  public getOperationsFromSetting(
    settings:
      | ContractTestConfig
      | OverwriteRequestConfig
      | AssignVariablesConfig
      | ContentTestConfig
      | VariationTestConfig
  ): PostmanMappedOperation[] {
    const { openApiOperation, openApiOperationId } = settings

    let pmOperations: PostmanMappedOperation[] = []

    if (openApiOperation) {
      pmOperations = this.postmanParser.getOperationsByPath(openApiOperation)
    } else if (openApiOperationId) {
      pmOperations = this.postmanParser.getOperationsByIds([openApiOperationId])
    }

    if (settings?.excludeForOperations) {
      const excludedOperations = settings.excludeForOperations

      pmOperations = pmOperations.filter((pmOperation: PostmanMappedOperation) => {
        return (
          (pmOperation?.id && !excludedOperations.includes(pmOperation?.id)) ||
          !excludedOperations.includes(pmOperation?.pathRef)
        )
      })
    }
    return pmOperations
  }

  public getTestTypeFromContractTests = (
    contractTests: ContractTestConfig[],
    type: string
  ): ContractTestConfig | undefined => {
    return contractTests?.find(testConfig => !!testConfig[type])
  }

  public injectContractTests = (
    pmOperation: PostmanMappedOperation,
    oaOperation: OasMappedOperation,
    contractTests: ContractTestConfig[]
  ): PostmanMappedOperation => {
    // Early exit if no responses defined
    if (!oaOperation.schema?.responses) return pmOperation

    // Process all responses
    for (const [code, response] of Object.entries(oaOperation.schema.responses)) {
      const responseObject = response as OpenAPIV3.ResponseObject

      // Only support 2xx response checks - Happy path
      if (!inRange(parseInt(code), 200, 299)) {
        continue // skip this response
      }

      // List excludeForOperations
      const optStatusSuccess = this.getTestTypeFromContractTests(contractTests, 'statusSuccess')
      const optResponseTime = this.getTestTypeFromContractTests(contractTests, 'responseTime')
      const optContentType = this.getTestTypeFromContractTests(contractTests, 'contentType')
      const optJsonBody = this.getTestTypeFromContractTests(contractTests, 'jsonBody')
      const optSchemaValidation = this.getTestTypeFromContractTests(
        contractTests,
        'schemaValidation'
      )
      const optHeadersPresent = this.getTestTypeFromContractTests(contractTests, 'headersPresent')

      // Add status success check
      if (optStatusSuccess && !inOperations(pmOperation, optStatusSuccess?.excludeForOperations)) {
        pmOperation = testResponseStatusSuccess(pmOperation, oaOperation)
      }
      // Add responseTime check
      if (optResponseTime && !inOperations(pmOperation, optResponseTime?.excludeForOperations)) {
        const { responseTime } = optResponseTime
        pmOperation = testResponseTime(responseTime as ResponseTime, pmOperation, oaOperation)
      }

      // Add response content checks
      if (responseObject.content) {
        // Process all content-types
        for (const [contentType, content] of Object.entries(responseObject.content)) {
          // Early skip if no content-types defined
          if (!contentType) continue

          // Add contentType check
          if (optContentType && !inOperations(pmOperation, optContentType?.excludeForOperations)) {
            pmOperation = testResponseContentType(contentType, pmOperation, oaOperation)
          }

          // Add json body check
          if (
            optJsonBody &&
            contentType === 'application/json' &&
            !inOperations(pmOperation, optJsonBody?.excludeForOperations)
          ) {
            pmOperation = testResponseJsonBody(pmOperation, oaOperation)
          }

          // Add json schema check
          if (
            optSchemaValidation &&
            content?.schema &&
            !inOperations(pmOperation, optSchemaValidation?.excludeForOperations)
          ) {
            pmOperation = testResponseJsonSchema(content?.schema, pmOperation, oaOperation)
          }
        }
      }

      if (responseObject.headers) {
        // Process all response headers
        for (const [headerName] of Object.entries(responseObject.headers)) {
          // Early skip if no schema defined
          if (!headerName) continue
          // Add response header checks headersPresent
          if (
            optHeadersPresent &&
            !inOperations(pmOperation, optHeadersPresent?.excludeForOperations)
          ) {
            pmOperation = testResponseHeader(headerName, pmOperation, oaOperation)
          }
        }
      }
    }
    return pmOperation
  }

  public injectContentTests = (): PostmanMappedOperation[] => {
    if (!this.contentTests) return this.postmanParser.mappedOperations
    const contentTests = this.contentTests

    contentTests.map(contentTest => {
      //Get Postman operations to inject content test for
      const pmOperations = this.getOperationsFromSetting(contentTest)

      pmOperations.map(pmOperation => {
        // check content of response body
        if (contentTest?.responseBodyTests) {
          testResponseBodyContent(contentTest.responseBodyTests, pmOperation)
        }
      })
    })

    return this.postmanParser.mappedOperations
  }

  public injectAssignVariables = (): PostmanMappedOperation[] => {
    if (!this.config?.assignVariables) return this.postmanParser.mappedOperations
    const assignVarSettings = this.config.assignVariables

    assignVarSettings.map(assignVarSetting => {
      if (!assignVarSetting?.collectionVariables) return
      // Get Postman operations to apply assign variables for
      const pmOperations = this.getOperationsFromSetting(assignVarSetting)
      let fixedValueCounter = 0

      pmOperations.map(pmOperation => {
        // Loop over all defined variable value sources
        fixedValueCounter = assignCollectionVariables(
          pmOperation,
          assignVarSetting,
          fixedValueCounter
        ) as number
      })
    })

    return this.postmanParser.mappedOperations
  }

  public injectExtendedTests = (): PostmanMappedOperation[] => {
    if (!this.config?.tests?.extendTests) return this.postmanParser.mappedOperations
    const extendedTestsSettings = this.config.tests.extendTests

    extendedTestsSettings.map(extendedTestsSetting => {
      //Get Postman operations to apply assign variables for
      const pmOperations = this.getOperationsFromSetting(extendedTestsSetting)
      pmOperations.map(pmOperation => {
        // Assign Postman collection variable with a request body value
        if (extendedTestsSetting?.tests) {
          extendTest(extendedTestsSetting, pmOperation)
        }
      })
    })

    return this.postmanParser.mappedOperations
  }

  public injectOverwrites = (): PostmanMappedOperation[] => {
    if (!this.config?.overwrites) return this.postmanParser.mappedOperations

    const overwriteSettings = this.config.overwrites

    overwriteSettings.map(overwriteSetting => {
      //Get Postman operations to apply overwrites to
      const pmOperations = this.getOperationsFromSetting(overwriteSetting)
      applyOverwrites(pmOperations, overwriteSetting)
    })

    return this.postmanParser.mappedOperations
  }
}
