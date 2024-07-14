import { overwriteRequestSecurity } from '.'
import { getPostmanMappedOperation } from '../../../__tests__/testUtils/getPostmanMappedOperation'

describe('overwriteRequestSecurity', () => {
  it('should overwrite the request apiKey definition', async () => {
    const overwriteValues = {
      apiKey: {
        key: 'x-apideck-app-id',
        value: 'foo-bar-baz'
      }
    }
    const pmOperation = await getPostmanMappedOperation()
    overwriteRequestSecurity(overwriteValues, pmOperation)
    expect(pmOperation.item.getAuth()).toMatchSnapshot()
  })

  it('should overwrite the request basic auth', async () => {
    const overwriteValues = {
      basic: {
        username: 'foo',
        password: 'bar'
      }
    }
    const pmOperation = await getPostmanMappedOperation()
    overwriteRequestSecurity(overwriteValues, pmOperation)
    expect(pmOperation.item.getAuth()).toMatchSnapshot()
  })

  it('should overwrite the request bearer token auth', async () => {
    const overwriteValues = {
      bearer: {
        token: 'foo'
      }
    }
    const pmOperation = await getPostmanMappedOperation()
    overwriteRequestSecurity(overwriteValues, pmOperation)
    expect(pmOperation.item.getAuth()).toMatchSnapshot()
  })

  it('should overwrite the request Oauth2 auth', async () => {
    const overwriteValues = {
      oauth2: [
        {
          key: 'scope',
          value: '{{PC_SCOPE}}',
          type: 'string'
        },
        {
          key: 'password',
          value: '{{PC_PASSWORD}}',
          type: 'string'
        },
        {
          key: 'username',
          value: '{{PC_USERNAME}}',
          type: 'string'
        },
        {
          key: 'clientSecret',
          value: '{{PC_CLIENT_SECRET}}',
          type: 'string'
        },
        {
          key: 'clientId',
          value: '{{PC_CLIENT_ID}}',
          type: 'string'
        },
        {
          key: 'accessTokenUrl',
          value: '{{PC_ACCESS_TOKEN__URL}}',
          type: 'string'
        },
        {
          key: 'tokenName',
          value: '{{PC_TOKEN_NAME}}',
          type: 'string'
        },
        {
          key: 'grant_type',
          value: 'password_credentials',
          type: 'string'
        },
        {
          key: 'refreshRequestParams',
          value: [],
          type: 'any'
        },
        {
          key: 'tokenRequestParams',
          value: [],
          type: 'any'
        },
        {
          key: 'authRequestParams',
          value: [],
          type: 'any'
        },
        {
          key: 'challengeAlgorithm',
          value: 'S256',
          type: 'string'
        },
        {
          key: 'addTokenTo',
          value: 'header',
          type: 'string'
        },
        {
          key: 'client_authentication',
          value: 'body',
          type: 'string'
        }
      ]
    }
    const pmOperation = await getPostmanMappedOperation()
    overwriteRequestSecurity(overwriteValues, pmOperation)
    expect(pmOperation.item.getAuth()).toMatchSnapshot()
  })

  it('should remove the request bearer token auth', async () => {
    const overwriteValues = {
      remove: true
    }
    const pmOperation = await getPostmanMappedOperation()
    overwriteRequestSecurity(overwriteValues, pmOperation)
    expect(pmOperation.item.getAuth()).toMatchSnapshot()
  })
})
