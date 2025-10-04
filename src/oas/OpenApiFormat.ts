import { OpenAPI } from 'openapi-types'
import openapiFormat, { OpenAPIFilterOptions, OpenAPIFilterSet } from 'openapi-format'

export interface IOpenApiFormatterConfig {
  inputFile: string
  filterFile: string
  outputFile?: string
}

export class OpenApiFormatter {
  public oas: OpenAPI.Document

  async filter(options: IOpenApiFormatterConfig): Promise<OpenAPI.Document> {
    const inputFilePath = options.inputFile
    const filterFilePath = options.filterFile
    const filterOptions = {} as OpenAPIFilterOptions

    // Load OpenAPI file
    this.oas = (await openapiFormat.parseFile(inputFilePath, {
      bundle: true
    })) as unknown as OpenAPI.Document

    // Load filter file
    const filterSet = (await openapiFormat.parseFile(filterFilePath)) as OpenAPIFilterSet
    filterOptions.filterSet = filterSet

    // Filter OpenAPI file
    const resFilter = await openapiFormat.openapiFilter(this.oas, filterOptions)
    this.oas = resFilter.data as OpenAPI.Document

    // Write filtered OpenAPI file as YAML
    if (options.outputFile) {
      await openapiFormat.writeFile(options.outputFile, this.oas, { format: 'yaml' })
    }

    return this.oas
  }

  async parseFile(filePath: string): Promise<Record<string, unknown>> {
    return await openapiFormat.parseFile(filePath)
  }

  async writeFile(filePath: string, data = {}, options = {}): Promise<void> {
    return await openapiFormat.writeFile(filePath, data, options)
  }

  changeCase(valueAsString: string, caseType: string): string {
    if (caseType === 'lowerCase') return valueAsString.toLowerCase()
    if (caseType === 'upperCase') return valueAsString.toUpperCase()
    return openapiFormat.changeCase(valueAsString, caseType)
  }
}
