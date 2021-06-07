import { getByPath } from './getByPath'

describe('getByPath', () => {
  const objUnderTest = {
    foo: 'bar',
    email: 'foo@example.com',
    websites: [
      { url: 'http://example.com', type: 'primary' },
      { url: 'http://other-example.com', type: 'secondary' }
    ]
  }

  it('should get the value using dot notation', () => {
    const result = getByPath(objUnderTest, 'websites[1].url')
    expect(result).toEqual('http://other-example.com')
  })

  it('should return default value if present', () => {
    const result = getByPath(objUnderTest, 'social', 'http://twitter.com/nickleplated')
    expect(result).toEqual('http://twitter.com/nickleplated')
  })
})
