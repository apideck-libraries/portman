import { OpenAPIV3 } from 'openapi-types'
import { Collection } from 'postman-collection'
import {
  applyOverwrites,
  assignCollectionVariables,
  extendTest,
  IntegrationTestWriter,
  testResponseBodyContent,
  testResponseBodyEmpty,
  testResponseContentType,
  testResponseHeader,
  testResponseHeaderContent,
  testResponseJsonBody,
  testResponseJsonSchema,
  testResponseStatusCode,
  testResponseStatusSuccess,
  testResponseTime,
  VariationWriter,
  writeOperationPreRequestScripts
} from '.'
import { OasMappedOperation, OpenApiParser } from '../oas'
import { PostmanMappedOperation, PostmanParser } from '../postman'
import {
  AssignVariablesConfig,
  ContentTestConfig,
  ContractTestConfig,
  ExtendTestsConfig,
  IntegrationTestConfig,
  OperationPreRequestScriptConfig,
  OverwriteRequestConfig,
  PortmanConfig,
  PortmanOptions,
  PortmanReqTestType,
  PortmanTestType,
  PortmanTestTypes,
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
  variationWriter: VariationWriter
  integrationTestWriter: IntegrationTestWriter

  contractTests?: ContractTestConfig[]
  contentTests?: ContentTestConfig[]
  variationTests?: VariationTestConfig[]
  integrationTests?: IntegrationTestConfig[]
  extendTests?: ExtendTestsConfig[]

  pmResponseJsonVarInjected: boolean
  options?: PortmanOptions

  requestTestTypes: PortmanReqTestType[]

  constructor(testSuiteOptions: TestSuiteOptions) {
    const { oasParser, postmanParser, config, options } = testSuiteOptions

    this.pmResponseJsonVarInjected = false
    this.requestTestTypes = []

    this.oasParser = oasParser
    this.postmanParser = postmanParser
    this.config = config
    this.options = options

    this.collection = postmanParser.collection
    this.setupTests()
  }

  setupTests = (): void => {
    if (!this.config?.tests) return

    this.contractTests = this.config?.tests?.contractTests
    this.contentTests = this.config?.tests?.contentTests
    this.variationTests = this.config?.tests?.variationTests
    this.integrationTests = this.config?.tests?.integrationTests
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

          // Set/Update Portman operation test type
          this.registerOperationTestType(pmOperation, PortmanTestTypes.contract, false)
        }
      })
    })
  }

  public generateVariationTests = (): void => {
    const { variationTests } = this
    if (!variationTests) return

    variationTests.map(variationTest => {
      //Get Postman operations to inject variation test for
      const pmOperations = this.getOperationsFromSetting(variationTest)

      pmOperations.map(pmOperation => {
        // Get OpenApi operation
        const oaOperation = this.oasParser.getOperationByPath(pmOperation.pathRef)

        // Insert variation
        if (!variationTest.openApiResponse) {
          // No targeted openApiResponse configured, generate a variation based on the 1st response object
          this.variationWriter.add(pmOperation, oaOperation, variationTest)
        } else if (oaOperation?.responseCodes.includes(variationTest.openApiResponse)) {
          // Configured an openApiResponse, only generate variation for the targeted response object
          this.variationWriter.add(pmOperation, oaOperation, variationTest)
        } else {
          // Configured a openApiResponse, but it doesn't exist in OpenAPI, do nothing
        }
      })
    })

    this.collection = this.variationWriter.mergeToCollection(this.collection)
  }

  public generateIntegrationTests = (): void => {
    const { integrationTests } = this

    if (!integrationTests) return

    integrationTests.map(integrationTest => {
      this.integrationTestWriter.add(integrationTest)
    })

    this.collection = this.integrationTestWriter.mergeToCollection(this.collection)
  }

  public getOperationsFromSetting(
    settings:
      | ContractTestConfig
      | OverwriteRequestConfig
      | AssignVariablesConfig
      | ContentTestConfig
      | VariationTestConfig
      | OperationPreRequestScriptConfig
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
      // Filter based on pathRef
      pmOperations = pmOperations.filter((pmOperation: PostmanMappedOperation) => {
        return !excludedOperations.includes(pmOperation?.pathRef)
      })
      // Filter based on operationId
      pmOperations = pmOperations.filter((pmOperation: PostmanMappedOperation) => {
        if (pmOperation?.id) {
          return !excludedOperations.includes(pmOperation?.id)
        }
        return true
      })
    }

    return pmOperations
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

    // Target openApiResponse code
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
    const optStatusSuccess = contractTest['statusSuccess']
    const optStatusCode = contractTest['statusCode']
    const optResponseTime = contractTest['responseTime']
    const optContentType = contractTest['contentType']
    const optJsonBody = contractTest['jsonBody']
    const optSchemaValidation = contractTest['schemaValidation']
    const optHeadersPresent = contractTest['headersPresent']

    // Add status success check
    if (
      optStatusSuccess &&
      optStatusSuccess.enabled &&
      !inOperations(pmOperation, optStatusSuccess?.excludeForOperations)
    ) {
      pmOperation = testResponseStatusSuccess(pmOperation)
    }

    // Add status code check
    if (
      optStatusCode &&
      optStatusCode.enabled &&
      !inOperations(pmOperation, optStatusCode?.excludeForOperations)
    ) {
      const statusCodeSetting = { ...optStatusCode } as StatusCode
      if (!statusCodeSetting.code && responseCode) {
        statusCodeSetting.code = responseCode
      }
      pmOperation = testResponseStatusCode(statusCodeSetting, pmOperation)
    }

    // Add responseTime check
    if (
      optResponseTime &&
      optResponseTime.enabled &&
      !inOperations(pmOperation, optResponseTime?.excludeForOperations)
    ) {
      pmOperation = testResponseTime(optResponseTime as ResponseTime, pmOperation)
    }

    // Add empty body check for 204 HTTP response
    // 204 is a popular status code for PUT, POST and DELETE operations and MUST not have a response body
    // RFC7231 https://datatracker.ietf.org/doc/html/rfc7231#section-6.3.5
    if (
      optJsonBody &&
      optJsonBody.enabled &&
      responseCode === 204 &&
      !inOperations(pmOperation, optJsonBody?.excludeForOperations)
    ) {
      pmOperation = testResponseBodyEmpty(pmOperation, oaOperation)
    }

    // Add response content checks
    if (responseObject.content) {
      // TEMPORARY HANDLING of multiple content-types
      let contentTypesCounter = 0

      // Process all content-types
      for (const [contentType, content] of Object.entries(responseObject.content)) {
        // Early skip if no content-types defined
        if (!contentType) continue

        // TEMPORARY HANDLING of multiple content-types
        if (contentTypesCounter > 0) continue

        // Add contentType check
        if (
          optContentType &&
          optContentType.enabled &&
          !inOperations(pmOperation, optContentType?.excludeForOperations)
        ) {
          pmOperation = testResponseContentType(contentType, pmOperation, oaOperation)
        }

        // Add json body check
        if (
          optJsonBody &&
          optJsonBody.enabled &&
          (contentType === 'application/json' || contentType.includes('json')) &&
          !inOperations(pmOperation, optJsonBody?.excludeForOperations)
        ) {
          pmOperation = testResponseJsonBody(pmOperation, oaOperation)
        }

        // Add json schema check
        if (
          optSchemaValidation &&
          optSchemaValidation.enabled &&
          content?.schema &&
          !inOperations(pmOperation, optSchemaValidation?.excludeForOperations)
        ) {
          pmOperation = testResponseJsonSchema(
            optSchemaValidation,
            content.schema,
            pmOperation,
            oaOperation,
            this.options?.extraUnknownFormats ?? []
          )
        }

        contentTypesCounter++
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
          optHeadersPresent.enabled &&
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
          // Insert response body content check
          testResponseBodyContent(contentTest.responseBodyTests, pmOperation)

          // Set/Update Portman operation test type
          this.registerOperationTestType(pmOperation, PortmanTestTypes.contract, false)
        }
        // check content of response header
        if (contentTest?.responseHeaderTests) {
          // Insert response header content check
          testResponseHeaderContent(contentTest.responseHeaderTests, pmOperation)

          // Set/Update Portman operation test type
          this.registerOperationTestType(pmOperation, PortmanTestTypes.contract, false)
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
          fixedValueCounter,
          this.options
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

          // Set/Update Portman operation test type
          this.registerOperationTestType(pmOperation, PortmanTestTypes.contract, false)
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

  public injectPreRequestScripts = (
    pmOperations?: PostmanMappedOperation[],
    preRequestSettings?: OperationPreRequestScriptConfig[]
  ): PostmanMappedOperation[] => {
    const settings = preRequestSettings || this.config.operationPreRequestScripts

    if (!settings) return this.postmanParser.mappedOperations

    settings.map(preRequestSetting => {
      //Get Postman operations to apply PreRequestScripts to
      const operations = pmOperations || this.getOperationsFromSetting(preRequestSetting)
      preRequestSetting?.scripts &&
        writeOperationPreRequestScripts(operations, preRequestSetting.scripts)
    })

    return this.postmanParser.mappedOperations
  }

  public registerOperationTestType = (
    pmOperation: PostmanMappedOperation,
    operationTestType: PortmanTestType,
    update = true
  ): void => {
    // Build request test type
    const opTestType = {
      postmanItemId: pmOperation.item.id,
      postmanName: pmOperation.item.name,
      reqTestType: operationTestType
    } as PortmanReqTestType

    // Set/Update pmOperation request test type
    const idx = this.requestTestTypes.findIndex(x => x.postmanItemId == opTestType.postmanItemId)
    if (idx === -1) {
      this.requestTestTypes.push(opTestType)
    } else if (update) {
      this.requestTestTypes[idx] = opTestType
    }
  }
}
