export type OpenApiRequestInfo = {
  contentType?: string
}

export const parseOpenApiRequest = (openApiRequest?: string): OpenApiRequestInfo | undefined => {
  if (!openApiRequest) return undefined
  return { contentType: openApiRequest.trim() }
}
