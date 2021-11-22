import { PortmanOptions } from '../../types'
import { OpenAPIV3 } from 'openapi-types'

export const oasRename = (oas: OpenAPIV3.Document, options: PortmanOptions): OpenAPIV3.Document => {
  if (!oas?.info?.title) {
    throw new Error(`OpenAPI title is required. Please ensure your OpenAPI document has title.`)
  }

  // OpenAPI 3
  if (oas?.info?.title && options?.oaRename && options?.oaRename !== '') {
    oas.info.title = options.oaRename
  }

  // Return the OpenAPI document
  return oas
}
