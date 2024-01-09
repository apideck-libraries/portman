// openapi-format.d.ts

declare module 'openapi-format' {
  import { OpenAPIV3 } from 'openapi-types'

  interface OpenAPIFilterSet {
    methods?: string[]
    tags?: string[]
    operationIds?: string[]
    operations?: string[]
    flags?: string[]
    flagValues?: string[]
    inverseMethods?: string[]
    inverseTags?: string[]
    inverseOperationIds?: string[]
    unusedComponents?: string[]
    stripFlags?: string[]
    responseContent?: string[]
    inverseResponseContent?: string[]
  }

  interface OpenAPIFilterOptions {
    filterSet: OpenAPIFilterSet
  }

  interface OpenAPIResult {
    data: OpenAPIV3.Document
    resultData: Record<string, never>
  }

  /**
   * OpenAPI-format filter function
   * Traverse through all keys and based on the key name, filter the props according to the filter configuration.
   * @param {OpenAPIV3.Document} oaObj OpenAPI document
   * @param {OpenAPIFilterOptions} options OpenAPI-format filter options
   * @returns {Promise<OpenAPIResult>} Filtered OpenAPI document
   */
  export async function openapiFilter(
    oaObj: OpenAPIV3.Document,
    options: OpenAPIFilterOptions
  ): Promise<OpenAPIResult>

  /**
   * OpenAPI-format parse function
   * Parse a JSON/YAML document
   * @returns {Promise<Record<string, unknown>} Data object
   */
  export async function parseFile(
    filePath: string,
    options: Record<string, unknown> = {}
  ): Promise<Record<string, unknown>>

  /**
   * OpenAPI-format write function for JSON/YAML
   * @param filePath Path to the output file.
   * @param data Data object.
   * @param options Write options
   * @returns {Promise<void>}
   */
  export async function writeFile(
    filePath: string,
    data: Record<string, unknown> | OpenAPIV3.Document,
    options: WriteFileOptions = {}
  ): Promise<void>

  /**
   * OpenAPI-format change case function
   * @param {string} valueAsString - The input string to change case.
   * @param {string} caseType - The type of case to change to (e.g.'camelCase', 'pascalCase', 'kebabCase', 'snakeCase').
   * @returns {string} - The string with the specified case.
   */
  export function changeCase(valueAsString: string, caseType: string): string
}
