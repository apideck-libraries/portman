import { parseOpenApiResponse } from './parseOpenApiResponse'

describe('parseOpenApiResponse', () => {
  it('should return code only', () => {
    const result = parseOpenApiResponse('200')
    expect(result).toEqual({ code: '200', contentType: undefined })
  })

  it('should return code and contentType', () => {
    const result = parseOpenApiResponse('200::text/plain')
    expect(result).toEqual({ code: '200', contentType: 'text/plain' })
  })

  it('should support wildcard contentType', () => {
    const result = parseOpenApiResponse('200::text/*')
    expect(result).toEqual({ code: '200', contentType: 'text/*' })
  })

  it('should parse default response', () => {
    const result = parseOpenApiResponse('default::application/json')
    expect(result).toEqual({ code: 'default', contentType: 'application/json' })
  })
})
