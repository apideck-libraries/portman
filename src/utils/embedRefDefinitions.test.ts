import Ajv from 'ajv'
import { embedRefDefinitions } from './embedRefDefinitions'

const oasDoc = {
  components: {
    schemas: {
      Node: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string' },
          children: { type: 'array', items: { $ref: '#/components/schemas/Node' } },
          owner: { $ref: '#/components/schemas/User' }
        }
      },
      User: {
        type: 'object',
        required: ['name'],
        properties: {
          name: { type: 'string' },
          manager: { $ref: '#/components/schemas/User' }
        }
      },
      'Odd/Name': { type: 'string' }
    }
  }
}

describe('embedRefDefinitions', () => {
  it('returns schemas without $ref unchanged', () => {
    const schema = { type: 'object', properties: { id: { type: 'string' } } }
    const result = embedRefDefinitions(schema, oasDoc)
    expect(result).toEqual({ schema, resolved: true })
  })

  it('embeds referenced schemas, including transitive and self references', () => {
    const result = embedRefDefinitions({ $ref: '#/components/schemas/Node' }, oasDoc)
    expect(result.resolved).toBe(true)
    expect(result.schema).toEqual({
      allOf: [{ $ref: '#/definitions/Node' }],
      definitions: {
        Node: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string' },
            children: { type: 'array', items: { $ref: '#/definitions/Node' } },
            owner: { $ref: '#/definitions/User' }
          }
        },
        User: {
          type: 'object',
          required: ['name'],
          properties: {
            name: { type: 'string' },
            manager: { $ref: '#/definitions/User' }
          }
        }
      }
    })
  })

  it('produces a schema that validates recursive payloads', () => {
    const { schema } = embedRefDefinitions(
      { type: 'array', items: { $ref: '#/components/schemas/Node' } },
      oasDoc
    )
    const validate = new Ajv({ strict: false }).compile(schema)

    const valid = [{ id: 'a', children: [{ id: 'b', children: [{ id: 'c' }] }] }]
    expect(validate(valid)).toBe(true)

    const nestedError = [{ id: 'a', children: [{ id: 'b', children: [{ id: 3 }] }] }]
    expect(validate(nestedError)).toBe(false)

    const missingName = [{ id: 'a', owner: { name: 'x', manager: {} } }]
    expect(validate(missingName)).toBe(false)
  })

  it('sanitises definition names and decodes JSON pointer escapes', () => {
    const result = embedRefDefinitions({ $ref: '#/components/schemas/Odd~1Name' }, oasDoc)
    expect(result.resolved).toBe(true)
    expect(result.schema.definitions).toEqual({ Odd_Name: { type: 'string' } })
    expect(result.schema.allOf[0]).toEqual({ $ref: '#/definitions/Odd_Name' })
  })

  it('does not follow $ref strings inside example data', () => {
    const schema = {
      type: 'object',
      example: { $ref: '#/components/schemas/Missing' },
      properties: { node: { $ref: '#/components/schemas/Node' } }
    }
    const result = embedRefDefinitions(schema, oasDoc)
    expect(result.resolved).toBe(true)
    expect(result.schema.allOf[0].example).toEqual({ $ref: '#/components/schemas/Missing' })
  })

  it('reports unresolvable references', () => {
    expect(embedRefDefinitions({ $ref: '#/components/schemas/Missing' }, oasDoc).resolved).toBe(
      false
    )
    expect(embedRefDefinitions({ $ref: 'other.yaml#/Foo' }, oasDoc).resolved).toBe(false)
  })

  it('reports unresolved when no OpenAPI document is given', () => {
    expect(embedRefDefinitions({ $ref: '#/components/schemas/Node' }).resolved).toBe(false)
  })
})
