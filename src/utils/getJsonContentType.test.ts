import { getJsonContentType } from './getJsonContentType'

describe('getJsonContentType', () => {
  it('should get exact application/json content-type', () => {
    const cTypes = ['application/json', 'application/merge-patch+json', 'text/html']
    const result = getJsonContentType(cTypes)
    expect(result).toEqual('application/json')
  })

  it('should get exact application/json content-type, unordered', () => {
    const cTypes = ['application/merge-patch+json', 'text/html', 'application/json']
    const result = getJsonContentType(cTypes)
    expect(result).toEqual('application/json')
  })

  it('should get json variant content-type, unordered', () => {
    const cTypes = ['text/xml', 'application/merge-patch+json', 'text/html']
    const result = getJsonContentType(cTypes)
    expect(result).toEqual('application/merge-patch+json')
  })

  it('should get the 1st json variant content-type, unordered', () => {
    const cTypes = ['text/xml', 'application/merge-json', 'application/merge-put+json', 'text/html']
    const result = getJsonContentType(cTypes)
    expect(result).toEqual('application/merge-json')
  })

  it('should get no matching json content-type', () => {
    const cTypes = ['text/xml', 'application/merge-dson', 'application/merge-put+bson', 'text/html']
    const result = getJsonContentType(cTypes)
    expect(result).toEqual(undefined)
  })
})
