import { OpenApiParser, PostmanParser } from 'application'
import fs from 'fs-extra'
import { OpenAPIV3 } from 'openapi-types'
import path from 'path'
import { Collection } from 'postman-collection'
import {
  AssignPmVariablesConfig,
  ContentTestConfig,
  OverwriteRequestConfig,
  ResponseTestConfig,
  ResponseTime,
  TestConfig,
  TestSuiteConfig,
  TestSuiteServiceOptions
} from 'types/TestSuiteConfig'
import {
  assignVarFromRequestBody,
  assignVarFromResponseBody,
  assignVarFromResponseHeader,
  assignVarFromValue,
  checkForContentInResponseBody,
  checkForResponseContentType,
  checkForResponseHeader,
  checkForResponseJsonBody,
  checkForResponseJsonSchema,
  checkForResponseStatusSuccess,
  checkForResponseTime,
  OasMappedOperation,
  overwriteRequestBody,
  overwriteRequestHeaders,
  overwriteRequestPathIdVariables,
  overwriteRequestPathVariables,
  overwriteRequestQueryParams,
  PostmanMappedOperation
} from '../lib'
import { inRange } from '../utils/inRange'

export class TestSuiteService {
  public collection: Collection

  oasParser: OpenApiParser
  postmanParser: PostmanParser
  config: TestSuiteConfig

  pmResponseJsonVarInjected: boolean

  constructor(options: TestSuiteServiceOptions) {
    const { oasParser, postmanParser, testSuiteConfigFile } = options

    this.pmResponseJsonVarInjected = false

    this.oasParser = oasParser
    this.postmanParser = postmanParser
    this.config = JSON.parse(
      fs.readFileSync(path.resolve(testSuiteConfigFile)).toString()
    ) as TestSuiteConfig

    this.collection = postmanParser.collection
  }

  public generateAutomatedTests = (): PostmanMappedOperation[] => {
    return this.postmanParser.mappedOperations.map(pmOperation => {
      // Get OpenApi responses
      const oaOperation = this.oasParser.getOperationByPath(pmOperation.pathRef)

      // Generate response checks
      if (oaOperation) {
        // Inject response tests
        pmOperation = this.injectResponseTests(pmOperation, oaOperation)
      }

      return pmOperation
    })
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
    if (!this.config?.contentTests) return []
    const contentTests = this.config.contentTests

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
    settings: OverwriteRequestConfig | AssignPmVariablesConfig | ContentTestConfig
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
        pmOperation = checkForResponseStatusSuccess(pmOperation, oaOperation)
      }
      // Add responseTime check
      if (responseTests.includes('responseTime')) {
        const { responseTime } = this.config?.tests?.responseTests?.find(
          testConfig => !!testConfig['responseTime']
        ) as ResponseTestConfig
        pmOperation = checkForResponseTime(responseTime as ResponseTime, pmOperation, oaOperation)
      }

      // Add response content checks
      if (responseObject.content) {
        // Process all content-types
        for (const [contentType, content] of Object.entries(responseObject.content)) {
          // Early skip if no content-types defined
          if (!contentType) continue

          // Add contentType check
          if (responseTests.includes('contentType')) {
            pmOperation = checkForResponseContentType(contentType, pmOperation, oaOperation)
          }

          // Add json body check
          if (responseTests.includes('jsonBody') && contentType === 'application/json') {
            pmOperation = checkForResponseJsonBody(pmOperation, oaOperation)
          }

          // Add json schema check
          if (responseTests.includes('schemaValidation') && content?.schema) {
            pmOperation = checkForResponseJsonSchema(content?.schema, pmOperation, oaOperation)
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
            pmOperation = checkForResponseHeader(headerName, pmOperation, oaOperation)
          }
        }
      }
    }
    return pmOperation
  }

  public injectContentTests = (): PostmanMappedOperation[] => {
    if (!this.config?.contentTests) return this.postmanParser.mappedOperations
    const contentTests = this.config.contentTests

    contentTests.map(contentTest => {
      //Get Postman operations to inject content test for
      const pmOperations = this.getOperationsFromSetting(contentTest)

      pmOperations.map(pmOperation => {
        // check content of response body
        contentTest?.responseBodyTest &&
          checkForContentInResponseBody(contentTest.responseBodyTest, pmOperation)
      })
    })

    return this.postmanParser.mappedOperations
  }

  public injectAssignVariables = (): PostmanMappedOperation[] => {
    if (!this.config?.assignPmVariables) return this.postmanParser.mappedOperations
    const assignVarSettings = this.config.assignPmVariables

    assignVarSettings.map(assignVar => {
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

  public injectOverwrites = (): PostmanMappedOperation[] => {
    if (!this.config?.overwrites) return this.postmanParser.mappedOperations

    const overwriteSettings = this.config.overwrites

    overwriteSettings.map(overwriteSetting => {
      //Get Postman operations to apply overwrites to
      const pmOperations = this.getOperationsFromSetting(overwriteSetting)

      pmOperations.map(pmOperation => {
        // overwrite request body
        overwriteSetting?.overwriteRequestBody &&
          overwriteRequestBody(overwriteSetting.overwriteRequestBody, pmOperation)

        // overwrite request query params
        overwriteSetting?.overwriteRequestQueryParams &&
          overwriteRequestQueryParams(overwriteSetting.overwriteRequestQueryParams, pmOperation)

        // overwrite request path id variables
        overwriteSetting?.overwriteRequestPathIdVariables &&
          overwriteRequestPathIdVariables(
            overwriteSetting.overwriteRequestPathIdVariables,
            pmOperation
          )

        // overwrite request path variables
        overwriteSetting?.overwriteRequestPathVariables &&
          overwriteRequestPathVariables(overwriteSetting.overwriteRequestPathVariables, pmOperation)

        // overwrite request headers
        overwriteSetting?.overwriteRequestHeaders &&
          overwriteRequestHeaders(overwriteSetting.overwriteRequestHeaders, pmOperation)
      })
    })

    return this.postmanParser.mappedOperations
  }
}
