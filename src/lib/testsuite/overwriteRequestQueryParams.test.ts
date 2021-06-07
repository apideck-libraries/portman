import { getPostmanMappedOperation } from '../../../__tests__/getPostmanMappedOperation'
import { overwriteRequestQueryParams } from './overwriteRequestQueryParams'

describe('overwriteRequestQueryParams', () => {
  it('should overwrite the request query param', async () => {
    const overwriteValues = [
      {
        key: 'raw',
        value: 'foo'
      }
    ]
    const pmOperation = await getPostmanMappedOperation()
    const result = overwriteRequestQueryParams(overwriteValues, pmOperation)
    expect(result.item.request.url.query).toMatchSnapshot()
  })

  it('should disable the request query param', async () => {
    const overwriteValues = [
      {
        key: 'raw',
        disable: true
      }
    ]
    const pmOperation = await getPostmanMappedOperation()
    const result = overwriteRequestQueryParams(overwriteValues, pmOperation)
    expect(result.item.request.url.query).toMatchSnapshot()
  })

  it('should append the request path variable when overwrite is false', async () => {
    const overwriteValues = [
      {
        key: 'raw',
        value: 'foo',
        overwrite: false
      }
    ]
    const pmOperation = await getPostmanMappedOperation()
    const result = overwriteRequestQueryParams(overwriteValues, pmOperation)
    expect(result.item.request.url.query).toMatchSnapshot()
  })

  it('should return unaltered if key not found', async () => {
    const overwriteValues = [
      {
        key: 'not-a-variable',
        value: 'foo-bar-baz'
      }
    ]

    const pmOperation = await getPostmanMappedOperation()
    const result = overwriteRequestQueryParams(overwriteValues, pmOperation)

    expect(result.item.request.url.query).toEqual(pmOperation.item.request.url.query)
  })
})
