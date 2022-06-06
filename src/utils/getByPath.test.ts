import { getByPath } from './getByPath'

describe('getByPath', () => {
  const objUnderTest = {
    foo: 'bar',
    email: 'foo@example.com',
    websites: [
      { url: 'http://example.com', type: 'primary' },
      { url: 'http://other-example.com', type: 'secondary' }
    ],
    link: { url: 'http://example.com', type: 'primary' }
  }

  let arrayUnderTest = [
    {
      foo: 'bar',
      email: 'foo@example.com',
      websites: [
        { url: 'http://example.com', type: 'primary' },
        { url: 'http://other-example.com', type: 'secondary' }
      ]
    },
    {
      foo: 'bar-2',
      email: 'foo-2@example.com',
      websites: [
        { url: 'http://example-2.com', type: 'primary' },
        { url: 'http://other-2-example.com', type: 'secondary' }
      ]
    }
  ]

  beforeEach(() => {
    arrayUnderTest = [
      {
        foo: 'bar',
        email: 'foo@example.com',
        websites: [
          { url: 'http://example.com', type: 'primary' },
          { url: 'http://other-example.com', type: 'secondary' }
        ]
      },
      {
        foo: 'bar-2',
        email: 'foo-2@example.com',
        websites: [
          { url: 'http://example-2.com', type: 'primary' },
          { url: 'http://other-2-example.com', type: 'secondary' }
        ]
      }
    ]
  })

  it('should get the value using dot notation', () => {
    const result = getByPath(objUnderTest, 'foo')
    expect(result).toEqual('bar')
  })

  it('should get the nested value using dot notation', () => {
    const result = getByPath(objUnderTest, 'websites[1].url')
    expect(result).toEqual('http://other-example.com')
  })

  it('should get the nested array using dot notation', () => {
    const result = getByPath(objUnderTest, 'websites[1]')
    expect(result).toEqual({ type: 'secondary', url: 'http://other-example.com' })
  })

  it('should get the nested object using dot notation', () => {
    const result = getByPath(objUnderTest, 'link')
    expect(result).toEqual({ type: 'primary', url: 'http://example.com' })
  })

  it('should return default value if present', () => {
    const result = getByPath(objUnderTest, 'social', 'http://twitter.com/nickleplated')
    expect(result).toEqual('http://twitter.com/nickleplated')
  })

  it('should get the value using of an array item dot notation', () => {
    const result = getByPath(arrayUnderTest, '[1].foo')
    expect(result).toEqual('bar-2')
  })

  it('should get the nested value of an array item using dot notation', () => {
    const result = getByPath(arrayUnderTest, '[1].websites[1].url')
    expect(result).toEqual('http://other-2-example.com')
  })

  it('should get the value of an array item using dot notation', () => {
    const result = getByPath(arrayUnderTest, '[1].websites')
    expect(result).toEqual([
      { type: 'primary', url: 'http://example-2.com' },
      { type: 'secondary', url: 'http://other-2-example.com' }
    ])
  })

  it('should get the value of an array item using dot notation', () => {
    const result = getByPath(arrayUnderTest, '[1]')
    expect(result).toEqual({
      foo: 'bar-2',
      email: 'foo-2@example.com',
      websites: [
        { url: 'http://example-2.com', type: 'primary' },
        { url: 'http://other-2-example.com', type: 'secondary' }
      ]
    })
  })

  it('should get the root element using dot notation', () => {
    const result = getByPath(objUnderTest, '.')
    expect(result).toEqual(objUnderTest)
  })

  it('should get the root array element using dot notation', () => {
    const result = getByPath(arrayUnderTest, '.')
    expect(result).toEqual(arrayUnderTest)
  })
})
