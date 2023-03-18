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

  it('should overwrite only the request apiKey value', async () => {
    const pmOperation = await getPostmanMappedOperation()

    const overwriteValues = {
      apiKey: {
        key: 'x-apideck-app-id',
        value: '{{apiKey}}'
      }
    }
    overwriteRequestSecurity(overwriteValues, pmOperation)

    const overwriteOnlyValue = {
      apiKey: {
        value: 'foo-bar'
      }
    }
    overwriteRequestSecurity(overwriteOnlyValue, pmOperation)
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
})
