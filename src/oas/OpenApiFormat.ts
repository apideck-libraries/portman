import { OpenAPIV3 } from 'openapi-types'
import openapiFormat, { OpenAPIFilterOptions, OpenAPIFilterSet } from 'openapi-format'

export interface IOpenApiFormatterConfig {
  inputFile: string
  filterFile: string
  outputFile?: string
}

export class OpenApiFormatter {
  public oas: OpenAPIV3.Document

  async filter(options: IOpenApiFormatterConfig): Promise<OpenAPIV3.Document> {
    const inputFilePath = options.inputFile
    const filterFilePath = options.filterFile
    const filterOptions = {} as OpenAPIFilterOptions

    // Load OpenAPI file
    this.oas = (await openapiFormat.parseFile(inputFilePath)) as unknown as OpenAPIV3.Document

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

  async parseFile(filePath: string): Promise<Record<string, unknown>> {
    return await openapiFormat.parseFile(filePath)
  }

  changeCase(valueAsString: string, caseType: string): string {
    return openapiFormat.changeCase(valueAsString, caseType)
  }
}
