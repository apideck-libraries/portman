/**
 * From an array of content types, return 'application/json' or the 1st variant that contains 'json'
 * @param contentTypes
 */
export const getJsonContentType = (contentTypes: Array<string>): string | undefined => {
  let contentType: string | undefined
  contentType = contentTypes.find(cType => cType === 'application/json')
  if (contentType !== undefined) return contentType

  contentType = contentTypes.find(cType => cType.includes('json'))
  if (contentType !== undefined) return contentType

  return contentType
}
