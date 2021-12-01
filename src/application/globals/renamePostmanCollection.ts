import { PortmanOptions } from '../../types'
import { OpenAPIV3 } from 'openapi-types'

export const renamePostmanCollection = (
  oas: OpenAPIV3.Document,
  options: PortmanOptions
): OpenAPIV3.Document => {
  if (!oas?.info?.title) {
    throw new Error(`OpenAPI title is required. Please ensure your OpenAPI document has title.`)
  }
  // OpenAPI 3
  if (oas?.info?.title && options?.collectionName && options?.collectionName !== '') {
    oas.info.title = options.collectionName
  }
  // Return the OpenAPI document
  return oas
}
