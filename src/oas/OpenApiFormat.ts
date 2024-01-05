import { OpenAPIV3 } from 'openapi-types'
import path from 'path'
import openapiFormat, { OpenAPIFilterOptions } from 'openapi-format'
import { parse as parseYaml, safeStringify } from '@stoplight/yaml'
import fs from 'fs'

export interface IOpenApiFormatterConfig {
  inputFile: string
  filterFile: string
  outputFile?: string
}

export interface OpenApiFormatOptions {
  filterSet: OpenAPIFilterOptions
}

export interface IOpenApiFormatter {
  oas: OpenAPIV3.Document
}

export class OpenApiFormatter {
  public oas: OpenAPIV3.Document

  async filter(options: IOpenApiFormatterConfig): Promise<OpenAPIV3.Document> {
    const inputFilePath = path.resolve(options.inputFile)
    const filterFilePath = path.resolve(options.filterFile)
    const filterOptions = {} as OpenApiFormatOptions

    // Load OpenAPI file
    if (inputFilePath.includes('.yaml') || inputFilePath.includes('.yml')) {
      this.oas = parseYaml(fs.readFileSync(inputFilePath, 'utf8')) as OpenAPIV3.Document
    } else {
      const fileContent = await fs.promises.readFile(inputFilePath, 'utf8')
      this.oas = JSON.parse(fileContent) as OpenAPIV3.Document
    }

    // Load filter file
    if (filterFilePath.includes('.yaml') || filterFilePath.includes('.yml')) {
      filterOptions.filterSet = parseYaml(fs.readFileSync(filterFilePath, 'utf8'))
    } else {
      const fileContent = await fs.promises.readFile(filterFilePath, 'utf8')
      filterOptions.filterSet = JSON.parse(fileContent)
    }

    // Filter OpenAPI file
    const resFilter = await openapiFormat.openapiFilter(this.oas, filterOptions)
    this.oas = resFilter.data as OpenAPIV3.Document

    // Write filtered OpenAPI file as YAML
    if (options.outputFile) {
      const outputFilePath = path.resolve(options.outputFile)
      await fs.promises.writeFile(outputFilePath, safeStringify(this.oas, { lineWidth: Infinity }))
    }

    return this.oas
  }
}
