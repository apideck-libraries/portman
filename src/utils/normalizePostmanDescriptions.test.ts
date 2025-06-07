import { normalizePostmanDescriptions } from './normalizePostmanDescriptions'

describe('normalizePostmanDescriptions', () => {
  it('should leave string descriptions untouched', () => {
    const input = { description: 'Simple description' }
    const result = normalizePostmanDescriptions(input)
    expect(result.description).toBe('Simple description')
  })

  it('should convert object description to its content string', () => {
    const input = { description: { content: 'Object description', type: 'text/plain' } }
    const result = normalizePostmanDescriptions(input)
    expect(result.description).toBe('Object description')
  })

  it('should set description to empty string if content missing', () => {
    const input = { description: { type: 'text/plain' } }
    const result = normalizePostmanDescriptions(input)
    expect(result.description).toBe('')
  })

  it('should work recursively for nested objects', () => {
    const input = {
      info: {
        description: { content: 'Info description', type: 'text/plain' }
      },
      item: [
        {
          request: {
            description: { content: 'Request description', type: 'text/plain' }
          }
        }
      ]
    }
    const result = normalizePostmanDescriptions(input)
    expect(result.info.description).toBe('Info description')
    expect(result.item[0].request.description).toBe('Request description')
  })

  it('should process arrays of objects with description fields', () => {
    const input = [
      { description: { content: 'desc1', type: 'text/plain' } },
      { description: 'desc2' },
      { description: { type: 'text/plain' } }
    ]
    const result = normalizePostmanDescriptions(input)
    expect(result[0].description).toBe('desc1')
    expect(result[1].description).toBe('desc2')
    expect(result[2].description).toBe('')
  })

  it('should not affect objects without a description field', () => {
    const input = { name: 'no description here' }
    const result = normalizePostmanDescriptions(input)
    expect(result).toEqual(input)
  })
})
