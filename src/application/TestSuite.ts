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
  testResponseStatusCode,
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
  ExtendTestsConfig,
  OverwriteRequestConfig,
  PortmanConfig,
  ResponseTime,
  StatusCode,
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
  extendTests?: ExtendTestsConfig[]

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
    this.extendTests = this.config?.tests?.extendTests
  }

  public generateContractTests = (
    pmOperations?: PostmanMappedOperation[],
    oaOperation?: OasMappedOperation,
    contractTests?: ContractTestConfig[],
    openApiResponseCode?: string
  ): void => {
    const tests = contractTests || this.contractTests
    if (!tests) return

    tests.map(contractTest => {
      const operations = pmOperations || this.getOperationsFromSetting(contractTest)

      operations.map(pmOperation => {
        // Get OpenApi responses
        const operation = oaOperation || this.oasParser.getOperationByPath(pmOperation.pathRef)

        if (operation) {
          // Inject response tests
          this.injectContractTests(pmOperation, operation, contractTest, openApiResponseCode)
        }
      })
    })
  }

  public generateVariationTests = (): void => {
    const variationTests = this.variationTests
    if (!variationTests) return

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
    const { openApiOperation, openApiOperationId, openApiOperationIds } = settings

    let pmOperations: PostmanMappedOperation[] = []

    if (openApiOperation) {
      pmOperations = this.postmanParser.getOperationsByPath(openApiOperation)
    } else if (openApiOperationId) {
      pmOperations = this.postmanParser.getOperationsByIds([openApiOperationId])
    } else if (openApiOperationIds) {
      pmOperations = this.postmanParser.getOperationsByIds(openApiOperationIds)
    }

    if (settings?.excludeForOperations) {
      const excludedOperations = settings.excludeForOperations
      pmOperations = pmOperations.filter((pmOperation: PostmanMappedOperation) => {
        return (
          pmOperation?.id &&
          !excludedOperations.includes(pmOperation?.id) &&
          !excludedOperations.includes(pmOperation?.pathRef)
        )
      })
    }

    return pmOperations
  }

  public getTestTypeFromContractTests = (
    contractTest: ContractTestConfig,
    type: string
  ): ContractTestConfig | undefined => {
    return contractTest[type]
  }

  public injectContractTests = (
    pmOperation: PostmanMappedOperation,
    oaOperation: OasMappedOperation,
    contractTest: ContractTestConfig,
    openApiResponseCode: string | undefined
  ): PostmanMappedOperation => {
    // Early exit if no responses defined
    if (!oaOperation.schema?.responses) return pmOperation

    // Only support 2xx response checks - Happy path
    let response = Object.entries(oaOperation.schema.responses).filter(res =>
      inRange(parseInt(res[0]), 200, 302)
    )

    if (openApiResponseCode && typeof openApiResponseCode === 'string') {
      response = Object.entries(oaOperation.schema.responses).filter(
        res => parseInt(res[0]) === parseInt(openApiResponseCode)
      )
    }

    // No response object matching
    if (!response[0]?.[1]) return pmOperation

    const responseCode = parseInt(response[0][0]) as number
    const responseObject = response[0][1] as OpenAPIV3.ResponseObject

    // List excludeForOperations
    const optStatusSuccess = this.getTestTypeFromContractTests(contractTest, 'statusSuccess')
    const optStatusCode = this.getTestTypeFromContractTests(contractTest, 'statusCode')
    const optResponseTime = this.getTestTypeFromContractTests(contractTest, 'responseTime')
    const optContentType = this.getTestTypeFromContractTests(contractTest, 'contentType')
    const optJsonBody = this.getTestTypeFromContractTests(contractTest, 'jsonBody')
    const optSchemaValidation = this.getTestTypeFromContractTests(contractTest, 'schemaValidation')
    const optHeadersPresent = this.getTestTypeFromContractTests(contractTest, 'headersPresent')

    // Add status success check
    if (optStatusSuccess && !inOperations(pmOperation, optStatusSuccess?.excludeForOperations)) {
      pmOperation = testResponseStatusSuccess(pmOperation)
    }

    // Add status code check
    if (optStatusCode && !inOperations(pmOperation, optStatusCode?.excludeForOperations)) {
      const statusCodeSetting = optStatusCode as StatusCode
      if (!statusCodeSetting.code && responseCode) {
        statusCodeSetting.code = responseCode
      }
      pmOperation = testResponseStatusCode(statusCodeSetting, pmOperation)
    }

    // Add responseTime check
    if (optResponseTime && !inOperations(pmOperation, optResponseTime?.excludeForOperations)) {
      pmOperation = testResponseTime(optResponseTime as ResponseTime, pmOperation)
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
    return pmOperation
  }

  public injectContentTests = (
    pmOperations?: PostmanMappedOperation[],
    contentTests?: ContentTestConfig[]
  ): PostmanMappedOperation[] => {
    const tests = contentTests || this.contentTests

    if (!tests) return this.postmanParser.mappedOperations

    tests.map(contentTest => {
      //Get Postman operations to inject content test for
      const operations = pmOperations || this.getOperationsFromSetting(contentTest)

      operations.map(pmOperation => {
        // check content of response body
        if (contentTest?.responseBodyTests) {
          testResponseBodyContent(contentTest.responseBodyTests, pmOperation)
        }
      })
    })

    return this.postmanParser.mappedOperations
  }

  public injectAssignVariables = (
    pmOperations?: PostmanMappedOperation[],
    assignVariables?: AssignVariablesConfig[]
  ): PostmanMappedOperation[] => {
    const settings = assignVariables || this.config.assignVariables
    if (!settings) return this.postmanParser.mappedOperations

    settings.map(assignVarSetting => {
      if (!assignVarSetting?.collectionVariables) return
      // Get Postman operations to apply assign variables for
      const operations = pmOperations || this.getOperationsFromSetting(assignVarSetting)
      let fixedValueCounter = 0

      operations.map(pmOperation => {
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

  public injectExtendedTests = (
    pmOperations?: PostmanMappedOperation[],
    extendedTestsSettings?: ExtendTestsConfig[]
  ): PostmanMappedOperation[] => {
    const settings = extendedTestsSettings || this.extendTests

    if (!settings) return this.postmanParser.mappedOperations

    settings.map(extendedTestsSetting => {
      //Get Postman operations to apply assign variables for
      const operations = pmOperations || this.getOperationsFromSetting(extendedTestsSetting)
      operations.map(pmOperation => {
        // Assign Postman collection variable with a request body value
        if (extendedTestsSetting?.tests) {
          extendTest(extendedTestsSetting, pmOperation)
        }
      })
    })

    return this.postmanParser.mappedOperations
  }

  public injectOverwrites = (
    pmOperations?: PostmanMappedOperation[],
    overwriteSettings?: OverwriteRequestConfig[]
  ): PostmanMappedOperation[] => {
    const settings = overwriteSettings || this.config.overwrites

    if (!settings) return this.postmanParser.mappedOperations

    settings.map(overwriteSetting => {
      //Get Postman operations to apply overwrites to
      const operations = pmOperations || this.getOperationsFromSetting(overwriteSetting)
      applyOverwrites(operations, overwriteSetting)
    })

    return this.postmanParser.mappedOperations
  }
}
