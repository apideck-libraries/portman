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

  it('should remove prop using dot notation', () => {
    const result = omitByPath(objUnderTest, 'websites[1].url')
    expect(result).toEqual({
      foo: 'bar',
      email: 'foo@example.com',
      websites: [{ url: 'http://example.com', type: 'primary' }, { type: 'secondary' }]
    })
  })

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

  it('should remove item from array using array notation', () => {
    const result = omitByPath(arrayUnderTest, '[1]')
    expect(result).toEqual([
      {
        email: 'foo@example.com',
        foo: 'bar',
        websites: [
          { type: 'primary', url: 'http://example.com' },
          { type: 'secondary', url: 'http://other-example.com' }
        ]
      }
    ])
  })

  it('should remove item from array using array notation', () => {
    const result = omitByPath(arrayUnderTest, '[0].foo')
    expect(result).toEqual([
      {
        email: 'foo@example.com',
        websites: [
          { type: 'primary', url: 'http://example.com' },
          { type: 'secondary', url: 'http://other-example.com' }
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
    ])
  })

  it('should remove nested item from prop from array using dot notation', () => {
    const result = omitByPath(arrayUnderTest, '[0].websites[1]')
    expect(result).toEqual([
      {
        foo: 'bar',
        email: 'foo@example.com',
        websites: [{ type: 'primary', url: 'http://example.com' }]
      },
      {
        foo: 'bar-2',
        email: 'foo-2@example.com',
        websites: [
          { url: 'http://example-2.com', type: 'primary' },
          { url: 'http://other-2-example.com', type: 'secondary' }
        ]
      }
    ])
  })

  it('should remove nested prop from array using dot notation', () => {
    const result = omitByPath(arrayUnderTest, '[0].websites[1].url')
    expect(result).toEqual([
      {
        foo: 'bar',
        email: 'foo@example.com',
        websites: [{ url: 'http://example.com', type: 'primary' }, { type: 'secondary' }]
      },
      {
        foo: 'bar-2',
        email: 'foo-2@example.com',
        websites: [
          { url: 'http://example-2.com', type: 'primary' },
          { url: 'http://other-2-example.com', type: 'secondary' }
        ]
      }
    ])
  })

  it('should return unaltered object from array if path does not exist', () => {
    const result = omitByPath(arrayUnderTest, '[0].websites[10].url')
    expect(result).toEqual(arrayUnderTest)
  })
})
