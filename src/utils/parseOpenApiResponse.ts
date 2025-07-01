export type OpenApiResponseInfo = {
  code: string
  contentType?: string
}

export const parseOpenApiResponse = (openApiResponse?: string): OpenApiResponseInfo | undefined => {
  if (!openApiResponse) return undefined
  const [code, contentType] = openApiResponse.split('::').map(p => p.trim())
  return { code, contentType: contentType || undefined }
}
