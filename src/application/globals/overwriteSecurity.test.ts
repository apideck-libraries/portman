import { CollectionDefinition } from 'postman-collection'
import { overwriteSecurityValues } from '../../application'

describe('overwriteSecurityValues()', () => {
  it('apiKey method should return {{apiKey}}', () => {
    const dictionary = {
      apiKey: { value: '{{apiKey}}' }
    } as Record<string, unknown>

    const collection = {
      auth: {
        type: 'apikey',
        apikey: [
          {
            key: 'value',
            value: true,
            type: 'string'
          },
          {
            key: 'key',
            value: 'x-api-key',
            type: 'string'
          },
          {
            key: 'in',
            value: 'header',
            type: 'string'
          }
        ]
      }
    } as CollectionDefinition

    const replaced = overwriteSecurityValues(collection, dictionary)
    expect(replaced).toStrictEqual({
      auth: {
        type: 'apikey',
        apikey: [
          {
            key: 'value',
            value: '{{apiKey}}',
            type: 'string'
          },
          {
            key: 'key',
            value: 'x-api-key',
            type: 'string'
          },
          {
            key: 'in',
            value: 'header',
            type: 'string'
          }
        ]
      }
    })
  })

  it('basic auth method should return {{apiKey}}', () => {
    const dictionary = {
      basic: { username: '{{username}}', password: '{{password}}' }
    } as Record<string, unknown>

    const collection = {
      auth: {
        type: 'basic',
        basic: [
          {
            key: 'password',
            value: '',
            type: 'string'
          },
          {
            key: 'username',
            value: '',
            type: 'string'
          }
        ]
      }
    } as CollectionDefinition

    const replaced = overwriteSecurityValues(collection, dictionary)
    expect(replaced).toStrictEqual({
      auth: {
        type: 'basic',
        basic: [
          {
            key: 'password',
            value: '{{password}}',
            type: 'string'
          },
          {
            key: 'username',
            value: '{{username}}',
            type: 'string'
          }
        ]
      }
    })
  })
})
