import { OpenApiParser, PostmanParser } from 'application'
import fs from 'fs-extra'
import path from 'path'
import { Collection } from 'postman-collection'
import {
  checkForSuccessStatus,
  checkForResponseTime,
  checkForResponseContentType,
  OasMappedOperation,
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

  responseChecks = (): string[] => {
    const { responseChecks } = this.config.generateTests
    return Object.keys(responseChecks).map(key => key)
  }

  injectChecksForResponses = (
    pmOperation: PostmanMappedOperation,
    oaOperation: OasMappedOperation
  ): PostmanMappedOperation => {
    const responseChecks = this.responseChecks()

    // Early exit if no responses defined
    if (!oaOperation.schema?.responses) return pmOperation

    // Process all responses
    for (const [code, response] of Object.entries(oaOperation.schema.responses)) {
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
        const { responseChecks } = this.config.generateTests
        pmOperation = checkForResponseTime(pmOperation, oaOperation, responseChecks)
      }

      if (response.content) {
        // Process all content-types
        for (const [contentType, content] of Object.entries(response.content)) {
          // console.log('contentType', contentType)
          // console.log('content', content)
          // Early skip if no content-types defined
          if (!contentType) continue

          // Add contentType check
          if (responseChecks.includes('contentType')) {
            pmOperation = checkForResponseContentType(contentType, pmOperation, oaOperation)
          }

          // // Add contentType check
          // if (responseChecks.includes('contentType')) {
          //   pmOperation = checkForResponseContentType(response, pmOperation, oaOperation)
          // }
        }
      }
    }
    return pmOperation
  }
}
