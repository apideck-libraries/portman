import { setByPath } from './setByPath'

describe('setByPath', () => {
  it('should set a flat value using dot notation', () => {
    const objUnderTest = {
      foo: 'bar',
      email: 'foo@example.com',
      websites: [
        { url: 'http://example.com', type: 'primary' },
        { url: 'http://other-example.com', type: 'secondary' }
      ]
    }

    const result = setByPath(objUnderTest, 'websites[1].url', 'http://new-example.com')
    expect(result).toEqual({
      foo: 'bar',
      email: 'foo@example.com',
      websites: [
        { url: 'http://example.com', type: 'primary' },
        { url: 'http://new-example.com', type: 'secondary' }
      ]
    })
  })

  it('should set an object/array value using dot notation', () => {
    const objUnderTest = {
      foo: 'bar',
      email: 'foo@example.com',
      websites: [
        { url: 'http://example.com', type: 'primary' },
        { url: 'http://example-2.com', type: 'secondary' }
      ]
    }

    const result = setByPath(objUnderTest, 'websites', [
      { url: 'http://example-3.com', type: 'work' }
    ])

    expect(result).toEqual({
      foo: 'bar',
      email: 'foo@example.com',
      websites: [{ url: 'http://example-3.com', type: 'work' }]
    })
  })

  it('should return unaltered object if path does not exist', () => {
    const objUnderTest = {
      foo: 'bar',
      email: 'foo@example.com',
      websites: [
        { url: 'http://example.com', type: 'primary' },
        { url: 'http://other-example.com', type: 'secondary' }
      ]
    }

    const result = setByPath(objUnderTest, 'websites[10].url', 'http://new-example.com')
    expect(result).toEqual(objUnderTest)
  })

  it('should return append to object if path does not exist', () => {
    const objUnderTest = {
      foo: 'bar',
      email: 'foo@example.com',
      websites: [
        { url: 'http://example.com', type: 'primary' },
        { url: 'http://other-example.com', type: 'secondary' }
      ]
    }

    let result = setByPath(objUnderTest, 'fizz', 'buzz')
    expect(result).toEqual({
      foo: 'bar',
      email: 'foo@example.com',
      fizz: 'buzz',
      websites: [
        { url: 'http://example.com', type: 'primary' },
        { url: 'http://other-example.com', type: 'secondary' }
      ]
    })

    result = setByPath(objUnderTest, 'phone', { type: 'primary', number: '+32484836434' })
    expect(result).toEqual({
      foo: 'bar',
      email: 'foo@example.com',
      fizz: 'buzz',
      phone: { type: 'primary', number: '+32484836434' },
      websites: [
        { url: 'http://example.com', type: 'primary' },
        { url: 'http://other-example.com', type: 'secondary' }
      ]
    })

    result = setByPath(objUnderTest, 'websites[2].url', 'http://new-example.com')
    expect(result).toEqual({
      foo: 'bar',
      fizz: 'buzz',
      phone: { type: 'primary', number: '+32484836434' },
      email: 'foo@example.com',
      websites: [
        { url: 'http://example.com', type: 'primary' },
        { url: 'http://other-example.com', type: 'secondary' },
        { url: 'http://new-example.com' }
      ]
    })
  })

  it('should set a flat value on a array item using dot notation', () => {
    const arrayUnderTest = [
      {
        foo: 'bar',
        email: 'foo@example.com',
        websites: [
          { url: 'http://123.com', type: 'primary' },
          { url: 'http://456.com', type: 'secondary' }
        ]
      }
    ]

    const result = setByPath(arrayUnderTest, '[0].websites[1].url', 'http://abc.com')
    expect(result[0].websites[1].url).toEqual('http://abc.com')
  })

  it('should insert a flat value using dot notation', () => {
    const arrayUnderTest = {
      foo: 'bar',
      email: 'foo@example.com',
      websites: [
        { url: 'http://123.com', type: 'primary' },
        { url: 'http://456.com', type: 'secondary' }
      ]
    }

    const result = setByPath(arrayUnderTest, 'marco', 'polo')
    expect(result).toEqual({
      foo: 'bar',
      email: 'foo@example.com',
      websites: [
        { url: 'http://123.com', type: 'primary' },
        { url: 'http://456.com', type: 'secondary' }
      ],
      marco: 'polo'
    })
  })

  it('should insert a flat value on a array item using dot notation', () => {
    const arrayUnderTest = [
      {
        foo: 'bar',
        email: 'foo@example.com',
        websites: [
          { url: 'http://123.com', type: 'primary' },
          { url: 'http://456.com', type: 'secondary' }
        ]
      }
    ]

    const result = setByPath(arrayUnderTest, '[0].marco', 'polo')
    expect(result).toEqual([
      {
        foo: 'bar',
        email: 'foo@example.com',
        websites: [
          { url: 'http://123.com', type: 'primary' },
          { url: 'http://456.com', type: 'secondary' }
        ],
        marco: 'polo'
      }
    ])
  })

  it('should insert a object value using dot notation', () => {
    const arrayUnderTest = {
      foo: 'bar',
      email: 'foo@example.com',
      websites: [
        { url: 'http://123.com', type: 'primary' },
        { url: 'http://456.com', type: 'secondary' }
      ]
    }

    const result = setByPath(arrayUnderTest, 'marco', { firstname: 'polo' })
    expect(result).toEqual({
      foo: 'bar',
      email: 'foo@example.com',
      websites: [
        { url: 'http://123.com', type: 'primary' },
        { url: 'http://456.com', type: 'secondary' }
      ],
      marco: { firstname: 'polo' }
    })
  })

  it('should insert a object value on a array item using dot notation', () => {
    const arrayUnderTest = [
      {
        foo: 'bar',
        email: 'foo@example.com',
        websites: [
          { url: 'http://123.com', type: 'primary' },
          { url: 'http://456.com', type: 'secondary' }
        ]
      }
    ]

    const result = setByPath(arrayUnderTest, '[0].marco', { firstname: 'polo' })
    expect(result).toEqual([
      {
        foo: 'bar',
        email: 'foo@example.com',
        websites: [
          { url: 'http://123.com', type: 'primary' },
          { url: 'http://456.com', type: 'secondary' }
        ],
        marco: { firstname: 'polo' }
      }
    ])
  })

  it('should set an object/array value on a array item using dot notation', () => {
    const arrayUnderTest = [
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

    const result = setByPath(arrayUnderTest, '[1]', {
      foo: 'bar-3',
      email: 'foo-3@example.com',
      websites: [{ url: 'http://one-3-example.com', type: 'work' }]
    })

    expect(result).toEqual([
      {
        foo: 'bar',
        email: 'foo@example.com',
        websites: [
          { url: 'http://example.com', type: 'primary' },
          { url: 'http://other-example.com', type: 'secondary' }
        ]
      },
      {
        foo: 'bar-3',
        email: 'foo-3@example.com',
        websites: [{ url: 'http://one-3-example.com', type: 'work' }]
      }
    ])
  })

  it('should set an object/array value on a nested array using dot notation', () => {
    const arrayUnderTest = [
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

    const result = setByPath(arrayUnderTest, '[1].websites', [
      { url: 'http://one-example.com', type: 'work' }
    ])

    expect(result).toEqual([
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
        websites: [{ url: 'http://one-example.com', type: 'work' }]
      }
    ])
  })

  xit('should set an object/array value on a nested array item using dot notation', () => {
    const arrayUnderTest = [
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

    const result = setByPath(arrayUnderTest, '[0].websites[1]', {
      url: 'http://one-example.com',
      type: 'work'
    })

    expect(result).toEqual([
      {
        foo: 'bar',
        email: 'foo@example.com',
        websites: [
          { url: 'http://example.com', type: 'primary' },
          { url: 'http://one-example.com', type: 'work' }
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
})
