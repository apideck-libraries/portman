// openapi-format.d.ts

declare module 'openapi-format' {
  import { OpenAPIV3 } from 'openapi-types'
  import { OpenApiFormatOptions } from 'oas'

  interface OpenAPIFilterOptions {
    // Define your OpenAPI options structure here
    methods: string[]
    tags: string[]
    operationIds: string[]
    operations: string[]
    flags: string[]
    flagValues: string[]
  }

  interface OpenAPIResult {
    data: OpenAPIV3.Document
    resultData: Record<string, never>
  }

  /**
   * OpenAPI filter function
   * Traverse through all keys and based on the key name, filter the props according to the filter configuration.
   * @param {OpenAPIV3.Document} oaObj OpenAPI document
   * @param {OpenAPIFilterOptions} options OpenAPI-format filter options
   * @returns {Promise<OpenAPIResult>} Filtered OpenAPI document
   */
  export function openapiFilter(
    oaObj: OpenAPIV3.Document,
    options: OpenApiFormatOptions
  ): Promise<OpenAPIResult>
}
