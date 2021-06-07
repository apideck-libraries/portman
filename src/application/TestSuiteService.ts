import { OpenApiParser, PostmanParser } from 'application'
import fs from 'fs-extra'
import { OpenAPIV3 } from 'openapi-types'
import path from 'path'
import { Collection } from 'postman-collection'
import {
  AssignPmVariablesConfig,
  ContentCheckConfig,
  GeneratedTestConfig,
  OverwriteRequestConfig,
  ResponseChecks,
  ResponseTime,
  TestSuiteConfig,
  TestSuiteServiceOptions
} from 'types/TestSuiteConfig'
import {
  checkForResponseContentType,
  checkForResponseHeader,
  checkForResponseJsonBody,
  checkForResponseJsonSchema,
  checkForResponseStatusSuccess,
  checkForResponseTime,
  OasMappedOperation,
  overwriteRequestBody,
  overwriteRequestHeaders,
  overwriteRequestPath,
  overwriteRequestQueryParams,
  PostmanMappedOperation
} from '../lib'
import { inRange } from '../utils/inRange'

export class TestSuiteService {
  public collection: Collection

  oasParser: OpenApiParser
  postmanParser: PostmanParser
  config: TestSuiteConfig

  constructor(options: TestSuiteServiceOptions) {
    const { oasParser, postmanParser, testSuiteConfigFile } = options

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
        pmOperation = this.injectChecksForResponses(pmOperation, oaOperation)
      }

      return pmOperation
    })
  }

  responseCheckSettings = (): string[] => {
    if (!this.config?.generateTests?.responseChecks) return []
    const { responseChecks }: GeneratedTestConfig = this.config.generateTests

    return Object.keys(responseChecks).map(key => key)
  }

  getOperationsFromSetting(
    settings: OverwriteRequestConfig | AssignPmVariablesConfig | ContentCheckConfig
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

  injectChecksForResponses = (
    pmOperation: PostmanMappedOperation,
    oaOperation: OasMappedOperation
  ): PostmanMappedOperation => {
    const responseChecks = this.responseCheckSettings()

    // Early exit if no responses defined
    if (!oaOperation.schema?.responses) return pmOperation

    // Process all responses
    for (const [code, response] of Object.entries(oaOperation.schema.responses)) {
      const responseObject = response as OpenAPIV3.ResponseObject

      // // Only support 2xx response checks - Happy path
      if (!inRange(parseInt(code), 200, 299)) {
        continue // skip this response
      }

      // Add status success check
      if (responseChecks.includes('statusSuccess')) {
        pmOperation = checkForResponseStatusSuccess(pmOperation, oaOperation)
      }
      // Add responseTime check
      if (responseChecks.includes('responseTime')) {
        const { responseTime } = this.config?.generateTests?.responseChecks as ResponseChecks
        pmOperation = checkForResponseTime(responseTime as ResponseTime, pmOperation, oaOperation)
      }

      // Add response content checks
      if (responseObject.content) {
        // Process all content-types
        for (const [contentType, content] of Object.entries(responseObject.content)) {
          // Early skip if no content-types defined
          if (!contentType) continue

          // Add contentType check
          if (responseChecks.includes('contentType')) {
            pmOperation = checkForResponseContentType(contentType, pmOperation, oaOperation)
          }

          // // Add json body check
          if (responseChecks.includes('jsonBody') && contentType === 'application/json') {
            pmOperation = checkForResponseJsonBody(pmOperation, oaOperation)
          }
          // // Add json schema check
          if (responseChecks.includes('schemaValidation') && content?.schema) {
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
          if (responseChecks.includes('headersPresent')) {
            pmOperation = checkForResponseHeader(headerName, pmOperation, oaOperation)
          }
        }
      }
    }
    return pmOperation
  }

  public injectOverwriteRequest = (): PostmanMappedOperation[] => {
    if (!this.config?.overwriteRequests) return this.postmanParser.mappedOperations

    const overwriteRequestSettings = this.config.overwriteRequests

    overwriteRequestSettings.map(overwriteSetting => {
      //Get Postman operations to apply overwrites to
      const pmOperations = this.getOperationsFromSetting(overwriteSetting)

      pmOperations.map(pmOperation => {
        // overwrite request body
        overwriteSetting?.overwriteRequestBody &&
          overwriteRequestBody(overwriteSetting.overwriteRequestBody, pmOperation)

        // overwrite request query params
        overwriteSetting?.overwriteRequestQueryParams &&
          overwriteRequestQueryParams(overwriteSetting.overwriteRequestQueryParams, pmOperation)

        // overwrite request path variables
        overwriteSetting?.overwriteRequestPathVariables &&
          overwriteRequestPath(overwriteSetting.overwriteRequestPathVariables, pmOperation)

        // overwrite request headers
        overwriteSetting?.overwriteRequestHeaders &&
          overwriteRequestHeaders(overwriteSetting.overwriteRequestHeaders, pmOperation)
      })
    })

    return this.postmanParser.mappedOperations
  }
}
