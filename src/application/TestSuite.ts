import { OpenAPIV3 } from 'openapi-types'
import { Collection } from 'postman-collection'
import {
  applyOverwrites,
  assignVarFromRequestBody,
  assignVarFromResponseBody,
  assignVarFromResponseHeader,
  assignVarFromValue,
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
  ResponseTestConfig,
  ResponseTime,
  TestConfig,
  TestSuiteOptions,
  VariationTestConfig
} from '../types'
import { inRange } from '../utils'

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
    return this.postmanParser.mappedOperations.map(pmOperation => {
      // Get OpenApi responses
      const oaOperation = this.oasParser.getOperationByPath(pmOperation.pathRef)

      if (oaOperation) {
        // Inject response tests
        pmOperation = this.injectResponseTests(pmOperation, oaOperation)
      }

      return pmOperation
    })
  }

  public generateVariationTests = (): void => {
    if (!this.config?.tests?.variationTests) return

    const variationTests = this.config.tests.variationTests
    const variationWriter = new VariationWriter()

    variationTests.map(variationTest => {
      //Get Postman operations to inject variation test for
      const pmOperations = this.getOperationsFromSetting(variationTest)

      pmOperations.map(pmOperation => {
        variationWriter.add(pmOperation, variationTest.variations)
      })
    })

    this.collection = variationWriter.mergeToCollection(this.collection)
  }

  responseTestSettings = (): string[] => {
    if (!this.config?.tests?.responseTests) return []
    const { responseTests }: TestConfig = this.config.tests

    const responseTestKeys = responseTests.reduce((acc, responseTest) => {
      const responseTestKey = Object.keys(responseTest).find(key => {
        return !['openApiOperation', 'openApiOperationId'].includes(key)
      })
      if (responseTestKey) acc.push(responseTestKey)

      return acc
    }, [] as string[])

    return responseTestKeys
  }

  contentTestSettings = (): string[] => {
    if (!this.config?.tests || !this.config?.tests?.contentTests) return []
    const contentTests = this.config.tests.contentTests

    const contentTestKeys = contentTests.reduce((acc, contentTest) => {
      const contentTestKey = Object.keys(contentTest).find(key => {
        return !['openApiOperation', 'openApiOperationId'].includes(key)
      })
      if (contentTestKey) acc.push(contentTestKey)

      return acc
    }, [] as string[])

    return contentTestKeys
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

  injectResponseTests = (
    pmOperation: PostmanMappedOperation,
    oaOperation: OasMappedOperation
  ): PostmanMappedOperation => {
    const responseTests = this.responseTestSettings()

    // Early exit if no responses defined
    if (!oaOperation.schema?.responses) return pmOperation

    // Process all responses
    for (const [code, response] of Object.entries(oaOperation.schema.responses)) {
      const responseObject = response as OpenAPIV3.ResponseObject

      // Only support 2xx response checks - Happy path
      if (!inRange(parseInt(code), 200, 299)) {
        continue // skip this response
      }

      // Add status success check
      if (responseTests.includes('statusSuccess')) {
        pmOperation = testResponseStatusSuccess(pmOperation, oaOperation)
      }
      // Add responseTime check
      if (responseTests.includes('responseTime')) {
        const { responseTime } = this.config?.tests?.responseTests?.find(
          testConfig => !!testConfig['responseTime']
        ) as ResponseTestConfig
        pmOperation = testResponseTime(responseTime as ResponseTime, pmOperation, oaOperation)
      }

      // Add response content checks
      if (responseObject.content) {
        // Process all content-types
        for (const [contentType, content] of Object.entries(responseObject.content)) {
          // Early skip if no content-types defined
          if (!contentType) continue

          // Add contentType check
          if (responseTests.includes('contentType')) {
            pmOperation = testResponseContentType(contentType, pmOperation, oaOperation)
          }

          // Add json body check
          if (responseTests.includes('jsonBody') && contentType === 'application/json') {
            pmOperation = testResponseJsonBody(pmOperation, oaOperation)
          }

          // Add json schema check
          if (responseTests.includes('schemaValidation') && content?.schema) {
            pmOperation = testResponseJsonSchema(content?.schema, pmOperation, oaOperation)
          }
        }
      }

      if (responseObject.headers) {
        // Process all response headers
        for (const [headerName] of Object.entries(responseObject.headers)) {
          // Early skip if no schema defined
          if (!headerName) continue
          // Add response header checks
          if (responseTests.includes('headersPresent')) {
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
        contentTest?.responseBodyTest &&
          testResponseBodyContent(contentTest.responseBodyTest, pmOperation)
      })
    })

    return this.postmanParser.mappedOperations
  }

  public injectAssignVariables = (): PostmanMappedOperation[] => {
    if (!this.config?.assignVariables) return this.postmanParser.mappedOperations
    const assignVarSettings = this.config.assignVariables

    assignVarSettings.map(assignVar => {
      if (!assignVar?.collectionVariables) return
      //Get Postman operations to apply assign variables for
      const pmOperations = this.getOperationsFromSetting(assignVar)
      pmOperations.map(pmOperation => {
        let fixedValueCounter = 0
        // Loop over all defined variable value sources
        assignVar.collectionVariables.map(varSetting => {
          // Assign Postman collection variable with a request body value
          varSetting?.requestBodyProp && assignVarFromRequestBody(varSetting, pmOperation)

          // Assign Postman collection variable with a response body value
          varSetting?.responseBodyProp && assignVarFromResponseBody(varSetting, pmOperation)

          // Assign Postman collection variable with a response header value
          varSetting?.responseHeaderProp && assignVarFromResponseHeader(varSetting, pmOperation)

          // Assign Postman collection variable with a fixed value
          if (varSetting.value) {
            fixedValueCounter++
            assignVarFromValue(varSetting, pmOperation, fixedValueCounter)
          }
        })
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
