import { CollectionDefinition } from 'postman-collection'
import { overwriteCollectionSecurityValues } from '../../application'

describe('overwriteSecurityValues()', () => {
  const apiKeySample = {
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
  }

  const bearerSample = {
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
  }

  const noAuthSample = {}

  const oauth1Sample = {
    oauth1: [
      {
        key: 'addEmptyParamsToSign',
        value: true,
        type: 'boolean'
      },
      {
        key: 'timestamp',
        value: '1461319769',
        type: 'string'
      },
      {
        key: 'nonce',
        value: 'ik3oT5',
        type: 'string'
      },
      {
        key: 'consumerSecret',
        value: 'D+EdQ-gs$-%@2Nu7',
        type: 'string'
      },
      {
        key: 'consumerKey',
        value: 'RKCGzna7bv9YD57c',
        type: 'string'
      },
      {
        key: 'signatureMethod',
        value: 'HMAC-SHA1',
        type: 'string'
      },
      {
        key: 'version',
        value: '1.0',
        type: 'string'
      },
      {
        key: 'addParamsToHeader',
        value: false,
        type: 'boolean'
      }
    ]
  }

  it('apiKey method should return {{apiKey}}', () => {
    const dictionary = {
      apiKey: { value: '{{apiKey}}' }
    } as Record<string, unknown>

    const collection = apiKeySample as CollectionDefinition

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

    const collection = apiKeySample as CollectionDefinition

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

  it('apiKey method should should return {{apiKey}} for no auth collection', () => {
    const dictionary = {
      apiKey: { key: '{{key}}', value: '{{apiKey}}', in: 'query' }
    } as Record<string, unknown>

    const collection = noAuthSample as CollectionDefinition

    const replaced = overwriteCollectionSecurityValues(collection, dictionary)
    expect(replaced).toStrictEqual({
      auth: {
        type: 'apikey',
        apikey: [
          {
            key: 'key',
            value: '{{key}}',
            type: 'string'
          },
          {
            key: 'value',
            value: '{{apiKey}}',
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

  it('basic auth method should return {{username}} {{password}} for no auth collection', () => {
    const dictionary = {
      basic: { username: '{{username}}', password: '{{password}}' }
    } as Record<string, unknown>

    const collection = noAuthSample as CollectionDefinition

    const replaced = overwriteCollectionSecurityValues(collection, dictionary)
    expect(replaced).toStrictEqual({
      auth: {
        type: 'basic',
        basic: [
          {
            key: 'username',
            value: '{{username}}',
            type: 'string'
          },
          {
            key: 'password',
            value: '{{password}}',
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

    const collection = bearerSample as CollectionDefinition

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

  it('bearer method should return {{bearerToken}} for no auth collection', () => {
    const dictionary = {
      bearer: { token: '{{bearerToken}}' }
    } as Record<string, unknown>

    const collection = noAuthSample as CollectionDefinition

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

  it('oauth1 method should be injected', () => {
    const dictionary = oauth1Sample as Record<string, unknown>

    const collection = {} as CollectionDefinition

    const replaced = overwriteCollectionSecurityValues(collection, dictionary)
    expect(replaced).toStrictEqual({
      auth: {
        type: 'oauth1',
        oauth1: [
          {
            key: 'addEmptyParamsToSign',
            value: true,
            type: 'boolean'
          },
          {
            key: 'timestamp',
            value: '1461319769',
            type: 'string'
          },
          {
            key: 'nonce',
            value: 'ik3oT5',
            type: 'string'
          },
          {
            key: 'consumerSecret',
            value: 'D+EdQ-gs$-%@2Nu7',
            type: 'string'
          },
          {
            key: 'consumerKey',
            value: 'RKCGzna7bv9YD57c',
            type: 'string'
          },
          {
            key: 'signatureMethod',
            value: 'HMAC-SHA1',
            type: 'string'
          },
          {
            key: 'version',
            value: '1.0',
            type: 'string'
          },
          {
            key: 'addParamsToHeader',
            value: false,
            type: 'boolean'
          }
        ]
      }
    })
  })

  it('auth method should be overwritten with globals securitySchemes', () => {
    const dictionary = oauth1Sample as Record<string, unknown>

    const collection = bearerSample as CollectionDefinition

    const replaced = overwriteCollectionSecurityValues(collection, dictionary)
    expect(replaced).toStrictEqual({
      auth: {
        type: 'oauth1',
        oauth1: [
          {
            key: 'addEmptyParamsToSign',
            value: true,
            type: 'boolean'
          },
          {
            key: 'timestamp',
            value: '1461319769',
            type: 'string'
          },
          {
            key: 'nonce',
            value: 'ik3oT5',
            type: 'string'
          },
          {
            key: 'consumerSecret',
            value: 'D+EdQ-gs$-%@2Nu7',
            type: 'string'
          },
          {
            key: 'consumerKey',
            value: 'RKCGzna7bv9YD57c',
            type: 'string'
          },
          {
            key: 'signatureMethod',
            value: 'HMAC-SHA1',
            type: 'string'
          },
          {
            key: 'version',
            value: '1.0',
            type: 'string'
          },
          {
            key: 'addParamsToHeader',
            value: false,
            type: 'boolean'
          }
        ]
      }
    })
  })
})
