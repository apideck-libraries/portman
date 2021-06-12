import { omitByPath } from './omitByPath'

describe('omitByPath', () => {
  const objUnderTest = {
    foo: 'bar',
    email: 'foo@example.com',
    websites: [
      { url: 'http://example.com', type: 'primary' },
      { url: 'http://other-example.com', type: 'secondary' }
    ]
  }

  it('should remove prop using dot notation', () => {
    const result = omitByPath(objUnderTest, 'websites[1].url')
    expect(result).toEqual({
      foo: 'bar',
      email: 'foo@example.com',
      websites: [{ url: 'http://example.com', type: 'primary' }, { type: 'secondary' }]
    })
  })

  it('should return unaltered object if path does not exist', () => {
    const result = omitByPath(objUnderTest, 'websites[10].url')
    expect(result).toEqual(objUnderTest)
  })
})
