import { getPostmanMappedOperation } from '../../../__tests__/testUtils/getPostmanMappedOperation'
import { overwriteRequestHeaders } from '../../application'

describe('overwriteRequestHeaders', () => {
  it('should overwrite the request path variable', async () => {
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

  it('should return unaltered if key not found', async () => {
    const overwriteValues = [
      {
        key: 'not-a-header',
        value: 'foo-bar-baz'
      }
    ]

    const pmOperation = await getPostmanMappedOperation()
    const result = overwriteRequestHeaders(overwriteValues, pmOperation)
    expect(result.item.request.getHeaders()).toEqual(pmOperation.item.request.getHeaders())
  })
})
