import { OpenAPIV3 } from 'openapi-types'
import path from 'path'
import openapiFormat, { OpenAPIFilterOptions, OpenAPIFilterSet } from 'openapi-format'

export interface IOpenApiFormatterConfig {
  inputFile: string
  filterFile: string
  outputFile?: string
}

export class OpenApiFormatter {
  public oas: OpenAPIV3.Document

  async filter(options: IOpenApiFormatterConfig): Promise<OpenAPIV3.Document> {
    const inputFilePath = path.resolve(options.inputFile)
    const filterFilePath = path.resolve(options.filterFile)
    const filterOptions = {} as OpenAPIFilterOptions

    // Load OpenAPI file
    this.oas = (await openapiFormat.parseFile(inputFilePath)) as OpenAPIV3.Document

    // Load filter file
    const filterSet = (await openapiFormat.parseFile(filterFilePath)) as OpenAPIFilterSet
    filterOptions.filterSet = filterSet

    // Filter OpenAPI file
    const resFilter = await openapiFormat.openapiFilter(this.oas, filterOptions)
    this.oas = resFilter.data as OpenAPIV3.Document

    // Write filtered OpenAPI file as YAML
    if (options.outputFile) {
      await openapiFormat.writeFile(options.outputFile, this.oas, { format: 'yaml' })
    }

    return this.oas
  }

  changeCase(valueAsString: string, caseType: string): string {
    return openapiFormat.changeCase(valueAsString, caseType)
  }
}
