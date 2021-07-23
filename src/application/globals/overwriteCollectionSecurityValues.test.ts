import { CollectionDefinition } from 'postman-collection'
import { overwriteCollectionSecurityValues } from '../../application'

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

    const replaced = overwriteCollectionSecurityValues(collection, dictionary)
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

  it('apiKey method should return {{apiKey}}, {{key}}, header', () => {
    const dictionary = {
      apiKey: { key: '{{key}}', value: '{{apiKey}}', in: 'query' }
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

    const replaced = overwriteCollectionSecurityValues(collection, dictionary)
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
            value: '{{key}}',
            type: 'string'
          },
          {
            key: 'in',
            value: 'query',
            type: 'string'
          }
        ]
      }
    })
  })

  it('basic auth method should return {{username}} {{password}}', () => {
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

    const replaced = overwriteCollectionSecurityValues(collection, dictionary)
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

  it('bearer method should return {{bearerToken}}', () => {
    const dictionary = {
      bearer: { token: '{{bearerToken}}' }
    } as Record<string, unknown>

    const collection = {
      auth: {
        type: 'bearer',
        bearer: [
          {
            key: 'token',
            value: '',
            type: 'string'
          }
        ]
      }
    } as CollectionDefinition

    const replaced = overwriteCollectionSecurityValues(collection, dictionary)
    expect(replaced).toStrictEqual({
      auth: {
        type: 'bearer',
        bearer: [
          {
            key: 'token',
            value: '{{bearerToken}}',
            type: 'string'
          }
        ]
      }
    })
  })
})
