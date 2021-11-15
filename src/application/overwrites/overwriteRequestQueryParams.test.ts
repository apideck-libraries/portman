import { getPostmanMappedOperation } from '../../../__tests__/testUtils/getPostmanMappedOperation'
import { overwriteRequestQueryParams } from '../../application'

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

  it('should append the request query param when overwrite is false', async () => {
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

  it('should remove to the query param when remove is true', async () => {
    const overwriteValues = [
      {
        key: 'raw',
        remove: true
      }
    ]
    const pmOperation = await getPostmanMappedOperation()
    const result = overwriteRequestQueryParams(overwriteValues, pmOperation)
    expect(result.item.request.url.query).toMatchSnapshot()
  })

  it('should insert the query param variable, if key not found', async () => {
    const overwriteValues = [
      {
        key: 'add-a-query-param',
        value: 'foo-bar-baz'
      }
    ]

    const pmOperation = await getPostmanMappedOperation()
    const result = overwriteRequestQueryParams(overwriteValues, pmOperation)
    expect(result.item.request.url.query).toMatchSnapshot()
  })

  it('should insert the query param variable with true insert option, if key not found', async () => {
    const overwriteValues = [
      {
        key: 'add-a-query-param',
        value: 'foo-bar-baz',
        insert: true
      }
    ]

    const pmOperation = await getPostmanMappedOperation()
    const result = overwriteRequestQueryParams(overwriteValues, pmOperation)
    expect(result.item.request.url.query).toMatchSnapshot()
  })

  it('should skip the query param variable with false insert option, if key not found', async () => {
    const overwriteValues = [
      {
        key: 'add-a-query-param',
        value: 'foo-bar-baz',
        insert: false
      }
    ]

    const pmOperation = await getPostmanMappedOperation()
    const result = overwriteRequestQueryParams(overwriteValues, pmOperation)
    expect(result.item.request.url.query).toMatchSnapshot()
  })

  it('should insert the query param variable with description, if key not found', async () => {
    const overwriteValues = [
      {
        key: 'add-a-query-param',
        value: 'foo-bar-baz',
        description: 'Additional query param'
      }
    ]

    const pmOperation = await getPostmanMappedOperation()
    const result = overwriteRequestQueryParams(overwriteValues, pmOperation)
    expect(result.item.request.url.query).toMatchSnapshot()
  })

  it('should overwrite the query param variable with a blank value', async () => {
    const overwriteValues = [
      {
        key: 'raw',
        value: '',
        overwrite: true
      }
    ]

    const pmOperation = await getPostmanMappedOperation()
    const result = overwriteRequestQueryParams(overwriteValues, pmOperation)
    expect(result.item.request.url.query).toMatchSnapshot()
  })
})
