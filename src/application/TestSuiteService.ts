import { OpenApiParser, PostmanParser } from 'application'
import fs from 'fs-extra'
import { OpenAPIV3 } from 'openapi-types'
import path from 'path'
import { Collection } from 'postman-collection'
import {
  checkForResponseContentType,
  checkForResponseHeader,
  checkForResponseJsonBody,
  checkForResponseJsonSchema,
  checkForResponseTime,
  checkForSuccessStatus,
  OasMappedOperation,
  overwriteRequestBody,
  PostmanMappedOperation
} from '../lib'
import { inRange } from '../utils/inRange'

export interface TestSuiteServiceOptions {
  oasParser: OpenApiParser
  postmanParser: PostmanParser
  testSuiteConfigFile: string
}

export class TestSuiteService {
  public collection: Collection

  oasParser: OpenApiParser
  postmanParser: PostmanParser
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  config: any

  constructor(options: TestSuiteServiceOptions) {
    const { oasParser, postmanParser, testSuiteConfigFile } = options

    this.oasParser = oasParser
    this.postmanParser = postmanParser
    this.config = JSON.parse(fs.readFileSync(path.resolve(testSuiteConfigFile)).toString())

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
    const { responseChecks } = this.config.generateTests
    return Object.keys(responseChecks).map(key => key)
  }

  public getOperationByPath(path: string, settings: []): any | null {
    return settings.find(({ pathRef }) => pathRef === path) || null
  }

  public getOperationById(operationId: string, settings: []): any | null {
    return settings.find(({ id }) => id === operationId) || null
  }

  public getOperationsByIds(settings: []): [] | null {
    return settings.filter(item => !!item.openApiOperationId)
  }

  public getOperationsByPaths(settings: []): [] | null {
    return settings.filter(item => !!item.openApiOperation)
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
        pmOperation = checkForSuccessStatus(pmOperation, oaOperation)
      }
      // Add responseTime check
      if (responseChecks.includes('responseTime')) {
        pmOperation = checkForResponseTime(
          this.config.generateTests.responseChecks,
          pmOperation,
          oaOperation
        )
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
    const reqOverwriteSettings = this.getOperationsByIds(this.config.overwriteRequests) as []
    reqOverwriteSettings.map(overwriteSetting => {
      //Get Postman operation
      const pmOperation = this.postmanParser.getOperationById(
        overwriteSetting.openApiOperationId
      ) as PostmanMappedOperation

      // overwrite request body
      overwriteRequestBody(overwriteSetting.overwriteRequestBody, pmOperation)
    })

    return this.postmanParser.mappedOperations
  }
}
