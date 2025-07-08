import { parseOpenApiRequest } from './parseOpenApiRequest'

describe('parseOpenApiRequest', () => {
  it('should return undefined when not provided', () => {
    expect(parseOpenApiRequest()).toBeUndefined()
  })

  it('should return contentType', () => {
    const result = parseOpenApiRequest('application/json')
    expect(result).toEqual({ contentType: 'application/json' })
  })
})
