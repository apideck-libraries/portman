import { getPostmanMappedOperation } from '../../../__tests__/testUtils/getPostmanMappedOperation'
import { getOasMappedOperation } from '../../../__tests__/testUtils/getOasMappedOperation'
import { overwriteRequestQueryParams } from '../../application'
import { OasMappedOperation } from '../../oas'
import { PostmanMappedOperation } from '../../postman'
import { GlobalConfig } from '../../types'

describe('overwriteRequestQueryParams', () => {
  let oaOperation: OasMappedOperation
  let pmOperation: PostmanMappedOperation

  beforeEach(async () => {
    pmOperation = await getPostmanMappedOperation()
    oaOperation = await getOasMappedOperation()
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should overwrite the request query param', async () => {
    const overwriteValues = [
      {
        key: 'raw',
        value: 'foo'
      }
    ]
    const dto = {
      overwriteValues,
      pmOperation,
      oaOperation
    }
    const result = overwriteRequestQueryParams(dto)
    expect(result.item.request.url.query).toMatchSnapshot()
  })

  it('should disable the request query param', async () => {
    const overwriteValues = [
      {
        key: 'raw',
        disable: true
      }
    ]
    const dto = {
      overwriteValues,
      pmOperation,
      oaOperation
    }
    const result = overwriteRequestQueryParams(dto)
    expect(result.item.request.url.query).toMatchSnapshot()
  })

  it('should enable the request query param', async () => {
    const overwriteValues = [
      {
        key: 'raw',
        disable: false
      }
    ]

    const queryParams = pmOperation.item.request.url.query.all()
    const firstQueryParamKey = queryParams[0]
    firstQueryParamKey.disabled = true

    // Set the updated query parameters in the request
    pmOperation.item.request.url.query.clear()
    pmOperation.item.request.url.query.add(firstQueryParamKey)
    const dto = {
      overwriteValues,
      pmOperation,
      oaOperation
    }
    const result = overwriteRequestQueryParams(dto)
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
    const dto = {
      overwriteValues,
      pmOperation,
      oaOperation
    }
    const result = overwriteRequestQueryParams(dto)
    expect(result.item.request.url.query).toMatchSnapshot()
  })

  it('should append the request query param when overwrite is true', async () => {
    const overwriteValues = [
      {
        key: 'raw',
        value: 'foo',
        overwrite: true
      }
    ]
    const dto = {
      overwriteValues,
      pmOperation,
      oaOperation
    }
    const result = overwriteRequestQueryParams(dto)
    expect(result.item.request.url.query).toMatchSnapshot()
  })

  it('overwrite overwrite the request query param with an empty when overwrite is true', async () => {
    const overwriteValues = [
      {
        key: 'id',
        value: '',
        overwrite: true
      }
    ]
    const dto = {
      overwriteValues,
      pmOperation,
      oaOperation
    }
    const result = overwriteRequestQueryParams(dto)
    expect(result.item.request.url.query).toMatchSnapshot()
  })

  it('should remove to the query param when remove is true', async () => {
    const overwriteValues = [
      {
        key: 'raw',
        remove: true
      }
    ]
    const dto = {
      overwriteValues,
      pmOperation,
      oaOperation
    }
    const result = overwriteRequestQueryParams(dto)
    expect(result.item.request.url.query).toMatchSnapshot()
  })

  it('should not remove any the request query param, when a absent key', async () => {
    const overwriteValues = [
      {
        key: 'fake-key',
        remove: true
      }
    ]
    const dto = {
      overwriteValues,
      pmOperation,
      oaOperation
    }
    const result = overwriteRequestQueryParams(dto)
    expect(result.item.request.url.query).toMatchSnapshot()
  })

  it('should not insert the query param, if key found', async () => {
    const overwriteValues = [
      {
        key: 'id',
        value: 'foo-bar-baz',
        insert: true
      }
    ]
    const dto = {
      overwriteValues,
      pmOperation,
      oaOperation
    }
    const result = overwriteRequestQueryParams(dto)
    expect(result.item.request.url.query).toMatchSnapshot()
  })

  it('should insert the query param variable, if key not found', async () => {
    const overwriteValues = [
      {
        key: 'add-a-query-param',
        value: 'foo-bar-baz'
      }
    ]
    const dto = {
      overwriteValues,
      pmOperation,
      oaOperation
    }
    const result = overwriteRequestQueryParams(dto)
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
    const dto = {
      overwriteValues,
      pmOperation,
      oaOperation
    }
    const result = overwriteRequestQueryParams(dto)
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
    const dto = {
      overwriteValues,
      pmOperation,
      oaOperation
    }
    const result = overwriteRequestQueryParams(dto)
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
    const dto = {
      overwriteValues,
      pmOperation,
      oaOperation
    }
    const result = overwriteRequestQueryParams(dto)
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
    const dto = {
      overwriteValues,
      pmOperation,
      oaOperation
    }
    const result = overwriteRequestQueryParams(dto)
    expect(result.item.request.url.query).toMatchSnapshot()
  })

  it('should overwrite the query param variable with a null value', async () => {
    const overwriteValues = [
      {
        key: 'raw',
        value: null,
        overwrite: true
      }
    ]
    const dto = {
      overwriteValues,
      pmOperation,
      oaOperation
    }
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const result = overwriteRequestQueryParams(dto)
    expect(result.item.request.url.query).toMatchSnapshot()
  })

  it('should overwrite the query param number variable with string value', async () => {
    const overwriteValues = [
      {
        key: 'raw',
        value: -1,
        overwrite: true
      }
    ]
    const dto = {
      overwriteValues,
      pmOperation,
      oaOperation
    }
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const result = overwriteRequestQueryParams(dto)
    expect(result.item.request.url.query).toMatchSnapshot()
  })

  it('should overwrite the query param boolean variable with string value', async () => {
    const overwriteValues = [
      {
        key: 'raw',
        value: false,
        overwrite: true
      }
    ]
    const dto = {
      overwriteValues,
      pmOperation,
      oaOperation
    }
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const result = overwriteRequestQueryParams(dto)
    expect(result.item.request.url.query).toMatchSnapshot()
  })

  it('should overwrite & auto-enable the query param variable', async () => {
    const overwriteValues = [
      {
        key: 'raw',
        value: 'foo',
        overwrite: true
      }
    ]

    const queryParams = pmOperation.item.request.url.query.all()
    const firstQueryParamKey = queryParams[0]
    firstQueryParamKey.disabled = true
    pmOperation.item.request.url.query.clear()
    pmOperation.item.request.url.query.add(firstQueryParamKey)

    const dto = {
      overwriteValues,
      pmOperation,
      oaOperation
    }
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const result = overwriteRequestQueryParams(dto)
    expect(result.item.request.url.query).toMatchSnapshot()
  })

  it('should overwrite but keep the query param variable disabled', async () => {
    const overwriteValues = [
      {
        key: 'raw',
        value: 'foo',
        overwrite: true,
        disable: true
      }
    ]

    const queryParams = pmOperation.item.request.url.query.all()
    const firstQueryParamKey = queryParams[0]
    firstQueryParamKey.disabled = false
    pmOperation.item.request.url.query.clear()
    pmOperation.item.request.url.query.add(firstQueryParamKey)

    const dto = {
      overwriteValues,
      pmOperation,
      oaOperation
    }
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const result = overwriteRequestQueryParams(dto)
    expect(result.item.request.url.query).toMatchSnapshot()
  })

  it('should overwrite the query param variable with generated string value', async () => {
    const overwriteValues = [
      {
        key: 'raw',
        value: '<operationId>_<pathPart2>',
        overwrite: true
      }
    ]
    const dto = {
      overwriteValues,
      pmOperation,
      oaOperation
    }
    const result = overwriteRequestQueryParams(dto)
    expect(result.item.request.url.query).toMatchSnapshot()
  })

  it('should overwrite the query param variable with generated string variable', async () => {
    const overwriteValues = [
      {
        key: 'raw',
        value: '<operationId>_<pathPart2>',
        overwrite: true
      }
    ]
    const dto = {
      overwriteValues,
      pmOperation,
      oaOperation
    }
    const result = overwriteRequestQueryParams(dto)
    expect(result.item.request.url.query).toMatchSnapshot()
  })

  it('should overwrite the query param variable with generated cased string variable', async () => {
    const overwriteValues = [
      {
        key: 'raw',
        value: '<operationId>_<pathPart2>',
        overwrite: true
      }
    ]
    const dto = {
      overwriteValues,
      pmOperation,
      oaOperation,
      globals: {
        variableCasing: 'pascalCase'
      } as GlobalConfig
    }
    const result = overwriteRequestQueryParams(dto)
    expect(result.item.request.url.query).toMatchSnapshot()
  })

  it('should overwrite the query param variable with generated string variable with {{}}', async () => {
    const overwriteValues = [
      {
        key: 'raw',
        value: '{{<operationId>}}',
        overwrite: true
      }
    ]
    const dto = {
      overwriteValues,
      pmOperation,
      oaOperation
    }
    const result = overwriteRequestQueryParams(dto)
    expect(result.item.request.url.query).toMatchSnapshot()
  })

  it('should overwrite the query param variable with generated cased string variable with {{}}', async () => {
    const overwriteValues = [
      {
        key: 'raw',
        value: '{{<operationId>}}',
        overwrite: true
      }
    ]
    const dto = {
      overwriteValues,
      pmOperation,
      oaOperation,
      globals: {
        variableCasing: 'pascalCase'
      } as GlobalConfig
    }
    const result = overwriteRequestQueryParams(dto)
    expect(result.item.request.url.query).toMatchSnapshot()
  })
})
