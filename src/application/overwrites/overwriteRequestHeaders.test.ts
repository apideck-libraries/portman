import { getPostmanMappedOperation } from '../../../__tests__/testUtils/getPostmanMappedOperation'
import { getOasMappedOperation } from '../../../__tests__/testUtils/getOasMappedOperation'
import { OasMappedOperation } from '../../oas'
import { PostmanMappedOperation } from '../../postman'
import { overwriteRequestHeaders } from './overwriteRequestHeaders'
import { GlobalConfig } from '../../types'

describe('overwriteRequestHeaders', () => {
  let oaOperation: OasMappedOperation
  let pmOperation: PostmanMappedOperation

  beforeEach(async () => {
    pmOperation = await getPostmanMappedOperation()
    oaOperation = await getOasMappedOperation()
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should overwrite the request headers variable', async () => {
    const overwriteValues = [
      {
        key: 'x-apideck-app-id',
        value: 'foo-bar-baz'
      }
    ]
    const overwriteRequestHeadersDto = {
      overwriteValues,
      pmOperation,
      oaOperation
    }
    const result = overwriteRequestHeaders(overwriteRequestHeadersDto)
    expect(result.item.request.getHeaders()).toMatchSnapshot()
  })

  it('should overwrite the request headers variable even if the existing header has an empty string value', async () => {
    const overwriteValues = [
      {
        key: 'x-apideck-app-id',
        value: 'foo-bar-baz'
      }
    ]

    // Force value to empty string for the existing header
    const header = pmOperation.item.request.headers.one('x-apideck-app-id')
    header.update({ key: 'x-apideck-app-id', value: '' })

    const overwriteRequestHeadersDto = {
      overwriteValues,
      pmOperation,
      oaOperation
    }
    const result = overwriteRequestHeaders(overwriteRequestHeadersDto)
    expect(result.item.request.getHeaders()).toMatchSnapshot()
  })

  it('should disable the request headers variable', async () => {
    const overwriteValues = [
      {
        key: 'x-apideck-app-id',
        disable: true
      }
    ]
    const overwriteRequestHeadersDto = {
      overwriteValues,
      pmOperation,
      oaOperation
    }
    const result = overwriteRequestHeaders(overwriteRequestHeadersDto)
    expect(result.item.request.headers).toMatchSnapshot()
  })

  it('should append to the header when overwrite is false', async () => {
    const overwriteValues = [
      {
        key: 'x-apideck-app-id',
        value: 'foo-bar-baz',
        overwrite: false
      }
    ]
    const overwriteRequestHeadersDto = {
      overwriteValues,
      pmOperation,
      oaOperation
    }
    const result = overwriteRequestHeaders(overwriteRequestHeadersDto)
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
    const overwriteRequestHeadersDto = {
      overwriteValues,
      pmOperation,
      oaOperation
    }
    const result = overwriteRequestHeaders(overwriteRequestHeadersDto)
    expect(result.item.request.getHeaders()).toMatchSnapshot()
  })

  it('should insert the request headers variable, if key not found', async () => {
    const overwriteValues = [
      {
        key: 'add-a-header',
        value: 'foo-bar-baz'
      }
    ]
    const overwriteRequestHeadersDto = {
      overwriteValues,
      pmOperation,
      oaOperation
    }
    const result = overwriteRequestHeaders(overwriteRequestHeadersDto)
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
    const overwriteRequestHeadersDto = {
      overwriteValues,
      pmOperation,
      oaOperation
    }
    const result = overwriteRequestHeaders(overwriteRequestHeadersDto)
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
    const overwriteRequestHeadersDto = {
      overwriteValues,
      pmOperation,
      oaOperation
    }
    const result = overwriteRequestHeaders(overwriteRequestHeadersDto)
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
    const overwriteRequestHeadersDto = {
      overwriteValues,
      pmOperation,
      oaOperation
    }
    const result = overwriteRequestHeaders(overwriteRequestHeadersDto)
    expect(result.item.request.getHeaders()).toMatchSnapshot()
  })

  it('should overwrite the header variable with a blank value', async () => {
    const overwriteValues = [
      {
        key: 'x-apideck-app-id',
        value: '',
        overwrite: true
      }
    ]

    const overwriteRequestHeadersDto = {
      overwriteValues,
      pmOperation,
      oaOperation
    }
    const result = overwriteRequestHeaders(overwriteRequestHeadersDto)
    expect(result.item.request.getHeaders()).toMatchSnapshot()
  })

  it('should overwrite the header variable with a null value', async () => {
    const overwriteValues = [
      {
        key: 'x-apideck-app-id',
        value: null,
        overwrite: true
      }
    ]

    const overwriteRequestHeadersDto = {
      overwriteValues,
      pmOperation,
      oaOperation
    }
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const result = overwriteRequestHeaders(overwriteRequestHeadersDto)
    expect(result.item.request.getHeaders()).toMatchSnapshot()
  })

  it('should overwrite the request headers number variable with string value', async () => {
    const overwriteValues = [
      {
        key: 'x-apideck-app-id',
        value: -1
      }
    ]
    const overwriteRequestHeadersDto = {
      overwriteValues,
      pmOperation,
      oaOperation
    }
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const result = overwriteRequestHeaders(overwriteRequestHeadersDto)
    expect(result.item.request.getHeaders()).toMatchSnapshot()
  })

  it('should overwrite the request headers boolean variable with string value', async () => {
    const overwriteValues = [
      {
        key: 'x-apideck-app-id',
        value: false
      }
    ]
    const overwriteRequestHeadersDto = {
      overwriteValues,
      pmOperation,
      oaOperation
    }
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const result = overwriteRequestHeaders(overwriteRequestHeadersDto)
    expect(result.item.request.getHeaders()).toMatchSnapshot()
  })

  it('should overwrite the request header variable with generated string value', async () => {
    const overwriteValues = [
      {
        key: 'x-apideck-app-id',
        value: '<operationId>_<pathPart2>',
        overwrite: true
      }
    ]
    const dto = {
      overwriteValues,
      pmOperation,
      oaOperation
    }
    const result = overwriteRequestHeaders(dto)
    expect(result.item.request.getHeaders()).toMatchSnapshot()
  })

  it('should overwrite the request header variable with generated cased string value', async () => {
    const overwriteValues = [
      {
        key: 'x-apideck-app-id',
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
    const result = overwriteRequestHeaders(dto)
    expect(result.item.request.getHeaders()).toMatchSnapshot()
  })

  it('should overwrite the request header variable with generated string value with {{}}', async () => {
    const overwriteValues = [
      {
        key: 'x-apideck-app-id',
        value: '{{<operationId>_<pathPart2>}}',
        overwrite: true
      }
    ]
    const dto = {
      overwriteValues,
      pmOperation,
      oaOperation
    }
    const result = overwriteRequestHeaders(dto)
    expect(result.item.request.getHeaders()).toMatchSnapshot()
  })

  it('should overwrite the request header variable with generated cased string value  with {{}}', async () => {
    const overwriteValues = [
      {
        key: 'x-apideck-app-id',
        value: '{{<operationId>_<pathPart2>}}',
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
    const result = overwriteRequestHeaders(dto)
    expect(result.item.request.getHeaders()).toMatchSnapshot()
  })
})
