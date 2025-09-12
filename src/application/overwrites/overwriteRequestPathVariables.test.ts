import { getPostmanMappedOperation } from '../../../__tests__/testUtils/getPostmanMappedOperation'
import { getOasMappedOperation } from '../../../__tests__/testUtils/getOasMappedOperation'
import { OasMappedOperation } from '../../oas'
import { PostmanMappedOperation } from '../../postman'
import { overwriteRequestPathVariables } from '../../application'
import { GlobalConfig } from '../../types'

describe('overwriteRequestPathVariables', () => {
  let oaOperation: OasMappedOperation
  let pmOperation: PostmanMappedOperation

  beforeEach(async () => {
    pmOperation = await getPostmanMappedOperation()
    oaOperation = await getOasMappedOperation()
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should overwrite the request path variable', async () => {
    const overwriteValues = [
      {
        key: 'id',
        value: 'foo-bar-baz'
      }
    ]
    const dto = {
      overwriteValues,
      pmOperation,
      oaOperation
    }
    const result = overwriteRequestPathVariables(dto)
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
    const dto = {
      overwriteValues,
      pmOperation,
      oaOperation
    }
    const result = overwriteRequestPathVariables(dto)
    expect(result.item.request.url.variables).toMatchSnapshot()
  })

  it('overwrite overwrite the request path variable when overwrite is true', async () => {
    const overwriteValues = [
      {
        key: 'id',
        value: 'foo-bar-baz',
        overwrite: true
      }
    ]
    const dto = {
      overwriteValues,
      pmOperation,
      oaOperation
    }
    const result = overwriteRequestPathVariables(dto)
    expect(result.item.request.url.variables).toMatchSnapshot()
  })

  it('overwrite overwrite the request path variable with an empty when overwrite is true', async () => {
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
    const result = overwriteRequestPathVariables(dto)
    expect(result.item.request.url.variables).toMatchSnapshot()
  })

  it('should return unaltered if key not found', async () => {
    const overwriteValues = [
      {
        key: 'not-a-variable',
        value: 'foo-bar-baz'
      }
    ]
    const dto = {
      overwriteValues,
      pmOperation,
      oaOperation
    }
    const result = overwriteRequestPathVariables(dto)
    expect(result.item.request.url.variables).toEqual(pmOperation.item.request.url.variables)
  })

  it('should remove the request path variable, when remove is true', async () => {
    const overwriteValues = [
      {
        key: 'id',
        remove: true
      }
    ]
    const dto = {
      overwriteValues,
      pmOperation,
      oaOperation
    }
    const result = overwriteRequestPathVariables(dto)
    expect(result.item.request.url).toMatchSnapshot()
  })

  it('should not remove any the request path variable, when a absent key', async () => {
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
    const result = overwriteRequestPathVariables(dto)
    expect(result.item.request.url).toMatchSnapshot()
  })

  it('should not insert the path variable, if key found', async () => {
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
    const result = overwriteRequestPathVariables(dto)
    expect(result.item.request.url.variables).toMatchSnapshot()
  })

  it('should insert the path variable, if key not found', async () => {
    const overwriteValues = [
      {
        key: 'add-a-path-variable',
        value: 'foo-bar-baz'
      }
    ]
    const dto = {
      overwriteValues,
      pmOperation,
      oaOperation
    }
    const result = overwriteRequestPathVariables(dto)
    expect(result.item.request.url.variables).toMatchSnapshot()
  })

  it('should insert the path variable with true insert option, if key not found', async () => {
    const overwriteValues = [
      {
        key: 'add-a-path-variable',
        value: 'foo-bar-baz',
        insert: true
      }
    ]
    const dto = {
      overwriteValues,
      pmOperation,
      oaOperation
    }
    const result = overwriteRequestPathVariables(dto)
    expect(result.item.request.url.variables).toMatchSnapshot()
  })

  it('should skip the path variable with false insert option, if key not found', async () => {
    const overwriteValues = [
      {
        key: 'add-a-path-variable',
        value: 'foo-bar-baz',
        insert: false
      }
    ]

    const dto = {
      overwriteValues,
      pmOperation,
      oaOperation
    }
    const result = overwriteRequestPathVariables(dto)
    expect(result.item.request.url.variables).toMatchSnapshot()
  })

  it('should insert the path variable with description, if key not found', async () => {
    const overwriteValues = [
      {
        key: 'add-a-path-variable',
        value: 'foo-bar-baz',
        description: 'Additional path param'
      }
    ]
    const dto = {
      overwriteValues,
      pmOperation,
      oaOperation
    }
    const result = overwriteRequestPathVariables(dto)
    expect(result.item.request.url.variables).toMatchSnapshot()
  })

  it('should overwrite the request path variable with an empty value', async () => {
    const overwriteValues = [
      {
        key: 'id',
        value: ''
      }
    ]
    const dto = {
      overwriteValues,
      pmOperation,
      oaOperation
    }
    const result = overwriteRequestPathVariables(dto)
    expect(result.item.request.url.variables).toMatchSnapshot()
  })

  it('should overwrite the request path variable with a null value', async () => {
    const overwriteValues = [
      {
        key: 'id',
        value: null
      }
    ]
    const dto = {
      overwriteValues,
      pmOperation,
      oaOperation
    }
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const result = overwriteRequestPathVariables(dto)
    expect(result.item.request.url.variables).toMatchSnapshot()
  })

  it('should overwrite the request path number variable with string value', async () => {
    const overwriteValues = [
      {
        key: 'id',
        value: -1
      }
    ]
    const dto = {
      overwriteValues,
      pmOperation,
      oaOperation
    }
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const result = overwriteRequestPathVariables(dto)
    expect(result.item.request.url.variables).toMatchSnapshot()
  })

  it('should overwrite the request path variable with zero value', async () => {
    const overwriteValues = [
      {
        key: 'id',
        value: 0
      }
    ]
    const dto = {
      overwriteValues,
      pmOperation,
      oaOperation
    }
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const result = overwriteRequestPathVariables(dto)
    expect(result.item.request.url.variables).toMatchSnapshot()
  })

  it('should overwrite the request path boolean variable with string value', async () => {
    const overwriteValues = [
      {
        key: 'id',
        value: false
      }
    ]

    const dto = {
      overwriteValues,
      pmOperation,
      oaOperation
    }
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const result = overwriteRequestPathVariables(dto)
    expect(result.item.request.url.variables).toMatchSnapshot()
  })

  it('should overwrite the request path variable with generated string value', async () => {
    const overwriteValues = [
      {
        key: 'id',
        value: '<operationId>_<pathPart2>'
      }
    ]
    const dto = {
      overwriteValues,
      pmOperation,
      oaOperation
    }
    const result = overwriteRequestPathVariables(dto)
    expect(result.item.request.url.variables).toMatchSnapshot()
  })

  it('should overwrite the request path variable with generated cased string value', async () => {
    const overwriteValues = [
      {
        key: 'id',
        value: '<operationId>_<pathPart2>'
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
    const result = overwriteRequestPathVariables(dto)
    expect(result.item.request.url.variables).toMatchSnapshot()
  })

  it('should overwrite the request path variable with generated string value with {{}}', async () => {
    const overwriteValues = [
      {
        key: 'id',
        value: '{{<operationId>_<pathPart2>}}'
      }
    ]
    const dto = {
      overwriteValues,
      pmOperation,
      oaOperation
    }
    const result = overwriteRequestPathVariables(dto)
    expect(result.item.request.url.variables).toMatchSnapshot()
  })

  it('should overwrite the request path variable with generated cased string value with {{}}', async () => {
    const overwriteValues = [
      {
        key: 'id',
        value: '{{<operationId>_<pathPart2>}}'
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
    const result = overwriteRequestPathVariables(dto)
    expect(result.item.request.url.variables).toMatchSnapshot()
  })
})
