import { getPostmanMappedOperation } from '../../../__tests__/testUtils/getPostmanMappedOperation'
import { getOasMappedOperation } from '../../../__tests__/testUtils/getOasMappedOperation'
import { OasMappedOperation } from '../../oas'
import { PostmanMappedOperation } from '../../postman'
import { overwriteRequestHeaders } from './overwriteRequestHeaders'
import { GlobalConfig } from '../../types'
import { Header } from 'postman-collection'

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

  it('should enable the disabled request headers variable', async () => {
    const overwriteValues = [
      {
        key: 'x-apideck-app-id',
        disable: false
      }
    ]

    pmOperation.item.request.headers
      .one('x-apideck-app-id')
      .update({ key: 'x-apideck-app-id', value: '2222', disabled: true })

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

  it('should remove to the Authorization header when remove is true', async () => {
    const overwriteValues = [
      {
        key: 'Authorization',
        remove: true
      }
    ]
    const newPmHeader = {
      key: 'Authorization',
      value: 'to-be-removed',
      disabled: false
    } as Header
    pmOperation.item.request.headers.add(newPmHeader)
    const overwriteRequestHeadersDto = {
      overwriteValues,
      pmOperation,
      oaOperation
    }
    const result = overwriteRequestHeaders(overwriteRequestHeadersDto)
    expect(Object.assign(result.item.request.getHeaders(), result.item.getAuth())).toMatchSnapshot()
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

  it('should overwrite the request headers variable with zero value', async () => {
    const overwriteValues = [
      {
        key: 'x-apideck-app-id',
        value: 0
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

  it('should overwrite & auto-enable the request headers', async () => {
    const overwriteValues = [
      {
        key: 'x-apideck-app-id',
        value: 'foo-bar'
      }
    ]
    // Set request header to disabled
    const header = pmOperation.item.request.headers.one('x-apideck-app-id')
    header.update({ key: 'x-apideck-app-id', value: '2222', disabled: true })

    const overwriteRequestHeadersDto = {
      overwriteValues,
      pmOperation,
      oaOperation
    }
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const result = overwriteRequestHeaders(overwriteRequestHeadersDto)
    expect(result.item.request.headers.one('x-apideck-app-id')).toMatchSnapshot()
  })

  it('should overwrite but keep the request headers disabled', async () => {
    const overwriteValues = [
      {
        key: 'x-apideck-app-id',
        value: 'foo-bar',
        disable: true
      }
    ]
    // Set request header to disabled
    const header = pmOperation.item.request.headers.one('x-apideck-app-id')
    header.update({ key: 'x-apideck-app-id', value: '2222', disabled: true })

    const overwriteRequestHeadersDto = {
      overwriteValues,
      pmOperation,
      oaOperation
    }
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const result = overwriteRequestHeaders(overwriteRequestHeadersDto)
    expect(result.item.request.headers.one('x-apideck-app-id')).toMatchSnapshot()
  })

  it('should overwrite but keep the request headers enabled', async () => {
    const overwriteValues = [
      {
        key: 'x-apideck-app-id',
        value: 'foo-bar',
        disable: false
      }
    ]
    // Set request header to disabled
    const header = pmOperation.item.request.headers.one('x-apideck-app-id')
    header.update({ key: 'x-apideck-app-id', value: '2222', disabled: true })

    const overwriteRequestHeadersDto = {
      overwriteValues,
      pmOperation,
      oaOperation
    }
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const result = overwriteRequestHeaders(overwriteRequestHeadersDto)
    expect(result.item.request.headers.one('x-apideck-app-id')).toMatchSnapshot()
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
