import { getPostmanMappedOperation } from '../../../__tests__/getPostmanMappedOperation'
import { overwriteRequestPath } from './overwriteRequestPath'

describe('overwriteRequestPath', () => {
  it('should overwrite the request path variable', async () => {
    const overwriteValues = [
      {
        key: 'id',
        value: 'foo-bar-baz'
      }
    ]
    const pmOperation = await getPostmanMappedOperation()
    const result = overwriteRequestPath(overwriteValues, pmOperation)
    expect(result.item.request.url.variables).toMatchSnapshot()
  })

  it('should append the request path variable when overwrite is false', async () => {
    const overwriteValues = [
      {
        key: 'id',
        value: 'foo-bar-baz',
        overwrite: false
      }
    ]
    const pmOperation = await getPostmanMappedOperation()
    const result = overwriteRequestPath(overwriteValues, pmOperation)
    expect(result.item.request.url.variables).toMatchSnapshot()
  })

  it('should return unaltered if key not found', async () => {
    const overwriteValues = [
      {
        key: 'not-a-variable',
        value: 'foo-bar-baz'
      }
    ]

    const pmOperation = await getPostmanMappedOperation()
    const result = overwriteRequestPath(overwriteValues, pmOperation)

    expect(result.item.request.url.variables).toEqual(pmOperation.item.request.url.variables)
  })
})
