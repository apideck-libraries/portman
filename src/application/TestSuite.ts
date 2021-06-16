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
  OverwriteRequestConfig,
  PortmanConfig,
  ContractTestConfig,
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

  pmResponseJsonVarInjected: boolean

  constructor(options: TestSuiteOptions) {
    const { oasParser, postmanParser, config } = options

    this.pmResponseJsonVarInjected = false

    this.oasParser = oasParser
    this.postmanParser = postmanParser
    this.config = config

    this.collection = postmanParser.collection
  }

  public generateAutomatedTests = (): PostmanMappedOperation[] => {
    if (!this.config?.tests || !this.config?.tests?.contractTests)
      return this.postmanParser.mappedOperations

    const contractTests = this.config.tests.contractTests

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
    if (!this.config?.tests?.variationTests) return

    const variationTests = this.config.tests.variationTests
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

  getOperationsFromSetting(
    settings:
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

    return pmOperations
  }

  public getTestTypeFromContractTests = (type: string): ContractTestConfig => {
    return this.config?.tests?.contractTests?.find(
      testConfig => !!testConfig[type]
    ) as ContractTestConfig
  }

  public injectContractTests = (
    pmOperation: PostmanMappedOperation,
    oaOperation: OasMappedOperation,
    config: ContractTestConfig[]
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
      const optStatusSuccess = this.getTestTypeFromContractTests('statusSuccess')
      const optResponseTime = this.getTestTypeFromContractTests('responseTime')
      const optContentType = this.getTestTypeFromContractTests('contentType')
      const optJsonBody = this.getTestTypeFromContractTests('jsonBody')
      const optSchemaValidation = this.getTestTypeFromContractTests('schemaValidation')
      const optHeadersPresent = this.getTestTypeFromContractTests('headersPresent')

      // Add status success check
      if (
        config.find(({ statusSuccess }) => !!statusSuccess) &&
        !inOperations(pmOperation, optStatusSuccess?.excludeForOperations)
      ) {
        pmOperation = testResponseStatusSuccess(pmOperation, oaOperation)
      }
      // Add responseTime check
      if (
        config.find(({ responseTime }) => !!responseTime) &&
        !inOperations(pmOperation, optResponseTime?.excludeForOperations)
      ) {
        const { responseTime } = this.config?.tests?.contractTests?.find(
          testConfig => !!testConfig['responseTime']
        ) as ContractTestConfig
        pmOperation = testResponseTime(responseTime as ResponseTime, pmOperation, oaOperation)
      }

      // Add response content checks
      if (responseObject.content) {
        // Process all content-types
        for (const [contentType, content] of Object.entries(responseObject.content)) {
          // Early skip if no content-types defined
          if (!contentType) continue

          // Add contentType check
          if (
            config.find(({ contentType }) => !!contentType) &&
            !inOperations(pmOperation, optContentType?.excludeForOperations)
          ) {
            pmOperation = testResponseContentType(contentType, pmOperation, oaOperation)
          }

          // Add json body check
          if (
            config.find(({ jsonBody }) => !!jsonBody) &&
            contentType === 'application/json' &&
            !inOperations(pmOperation, optJsonBody?.excludeForOperations)
          ) {
            pmOperation = testResponseJsonBody(pmOperation, oaOperation)
          }

          // Add json schema check
          if (
            config.find(({ schemaValidation }) => !!schemaValidation) &&
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
            config.find(({ headersPresent }) => !!headersPresent) &&
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
    if (!this.config?.tests || !this.config?.tests?.contentTests)
      return this.postmanParser.mappedOperations
    const contentTests = this.config.tests.contentTests

    contentTests.map(contentTest => {
      //Get Postman operations to inject content test for
      const pmOperations = this.getOperationsFromSetting(contentTest)

      pmOperations.map(pmOperation => {
        // check content of response body
        contentTest?.responseBodyTests &&
          testResponseBodyContent(contentTest.responseBodyTests, pmOperation)
      })
    })

    return this.postmanParser.mappedOperations
  }

  public injectAssignVariables = (): PostmanMappedOperation[] => {
    if (!this.config?.assignVariables) return this.postmanParser.mappedOperations
    const assignVarSettings = this.config.assignVariables

    assignVarSettings.map(assignVar => {
      if (!assignVar?.collectionVariables) return
      // Get Postman operations to apply assign variables for
      const pmOperations = this.getOperationsFromSetting(assignVar)
      let fixedValueCounter = 0

      pmOperations.map(pmOperation => {
        // Loop over all defined variable value sources
        fixedValueCounter = assignCollectionVariables(
          pmOperation,
          assignVar,
          fixedValueCounter
        ) as number
      })
    })

    return this.postmanParser.mappedOperations
  }

  public injectExtendedTests = (): PostmanMappedOperation[] => {
    if (!this.config?.extendTests) return this.postmanParser.mappedOperations
    const extendedTestsSettings = this.config.extendTests

    extendedTestsSettings.map(extSetting => {
      //Get Postman operations to apply assign variables for
      const pmOperations = this.getOperationsFromSetting(extSetting)
      pmOperations.map(pmOperation => {
        // Assign Postman collection variable with a request body value
        extSetting?.tests && extendTest(extSetting, pmOperation)
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
