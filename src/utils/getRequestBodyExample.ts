// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const getRequestBodyExample = (reqBody: any, contentType: string): string | undefined => {
  if (!reqBody?.content) return undefined
  const content = reqBody.content[contentType]
  if (!content) return undefined
  if (content.example !== undefined) {
    return typeof content.example === 'string'
      ? content.example
      : JSON.stringify(content.example, null, 2)
  }
  if (content.examples) {
    const exKey = Object.keys(content.examples)[0]
    const exampleObj = content.examples[exKey]
    const val = exampleObj?.value
    if (val !== undefined) {
      return typeof val === 'string' ? val : JSON.stringify(val, null, 2)
    }
  }
  if (content.schema && (content.schema as any).example !== undefined) {
    const val = (content.schema as any).example
    return typeof val === 'string' ? val : JSON.stringify(val, null, 2)
  }
  return undefined
}

export const getRawLanguageFromContentType = (contentType: string): string => {
  if (contentType.includes('json')) return 'json'
  if (contentType.includes('xml')) return 'xml'
  return 'text'
}
