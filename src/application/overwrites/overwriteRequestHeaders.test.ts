import { getPostmanMappedOperation } from '../../../__tests__/testUtils/getPostmanMappedOperation'
import { overwriteRequestHeaders } from '../../application'

describe('overwriteRequestHeaders', () => {
  it('should overwrite the request headers variable', async () => {
    const overwriteValues = [
      {
        key: 'x-apideck-app-id',
        value: 'foo-bar-baz'
      }
    ]
    const pmOperation = await getPostmanMappedOperation()
    const result = overwriteRequestHeaders(overwriteValues, pmOperation)
    expect(result.item.request.getHeaders()).toMatchSnapshot()
  })

  it('should append to the header when overwrite is false', async () => {
    const overwriteValues = [
      {
        key: 'x-apideck-app-id',
        value: 'foo-bar-baz',
        overwrite: false
      }
    ]
    const pmOperation = await getPostmanMappedOperation()
    const result = overwriteRequestHeaders(overwriteValues, pmOperation)
    expect(result.item.request.getHeaders()).toMatchSnapshot()
  })

  it('should remove to the header when remove is true', async () => {
    const overwriteValues = [
      {
        key: 'x-apideck-app-id',
        value: 'foo-bar-baz',
        remove: true
      }
    ]
    const pmOperation = await getPostmanMappedOperation()
    const result = overwriteRequestHeaders(overwriteValues, pmOperation)
    expect(result.item.request.getHeaders()).toMatchSnapshot()
  })

  it('should insert the request headers variable, if key not found', async () => {
    const overwriteValues = [
      {
        key: 'add-a-header',
        value: 'foo-bar-baz'
      }
    ]

    const pmOperation = await getPostmanMappedOperation()
    const result = overwriteRequestHeaders(overwriteValues, pmOperation)
    expect(result.item.request.getHeaders()).toMatchSnapshot()
  })

  it('should insert the request headers variable with true insert option, if key not found', async () => {
    const overwriteValues = [
      {
        key: 'add-a-header',
        value: 'foo-bar-baz',
        insert: true
      }
    ]

    const pmOperation = await getPostmanMappedOperation()
    const result = overwriteRequestHeaders(overwriteValues, pmOperation)
    expect(result.item.request.getHeaders()).toMatchSnapshot()
  })

  it('should skip the request headers variable with false insert option, if key not found', async () => {
    const overwriteValues = [
      {
        key: 'add-a-header',
        value: 'foo-bar-baz',
        insert: false
      }
    ]

    const pmOperation = await getPostmanMappedOperation()
    const result = overwriteRequestHeaders(overwriteValues, pmOperation)
    expect(result.item.request.getHeaders()).toMatchSnapshot()
  })

  it('should insert the request headers variable with description, if key not found', async () => {
    const overwriteValues = [
      {
        key: 'add-a-header',
        value: 'foo-bar-baz',
        description: 'Additional header'
      }
    ]

    const pmOperation = await getPostmanMappedOperation()
    const result = overwriteRequestHeaders(overwriteValues, pmOperation)
    expect(result.item.request.getHeaders()).toMatchSnapshot()
  })
})
