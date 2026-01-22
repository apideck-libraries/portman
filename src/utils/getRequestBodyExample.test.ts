import { getRequestBodyExample, getRequestBodyExamples } from './getRequestBodyExample'

describe('getRequestBodyExample helpers', () => {
  it('collects and normalizes request body examples', () => {
    const reqBody = {
      content: {
        'application/json': {
          example: '{"foo":"bar"}',
          examples: {
            first: { value: { foo: 'baz' } },
            second: { value: '{"foo":"qux"}' }
          },
          schema: { example: { foo: 'last' } }
        }
      }
    }

    expect(getRequestBodyExamples(reqBody, 'application/json')).toEqual([
      { foo: 'bar' },
      { foo: 'baz' },
      { foo: 'qux' },
      { foo: 'last' }
    ])
    expect(getRequestBodyExample(reqBody, 'application/json')).toBe('{\n  "foo": "bar"\n}')
  })
})
