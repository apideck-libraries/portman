import {
  getPostmanMappedCreateOperation,
  getPostmanMappedCreateArrayOperation,
  getPostmanMappedCreateFormData,
  getPostmanMappedCreateFormUrlEncoded
} from '../../../__tests__/testUtils/getPostmanMappedOperation'
import {
  getOasMappedCreateArrayOperation,
  getOasMappedCreateOperation
} from '../../../__tests__/testUtils/getOasMappedOperation'
import { OasMappedOperation } from '../../oas'
import { PostmanMappedOperation } from '../../postman'
import {
  decodeDynamicPmVars,
  makeJsonSafeDynamicPmVars,
  overwriteRequestBody
} from '../../application'
import { GlobalConfig } from '../../types'

describe('overwriteRequestBody', () => {
  let oaOperation: OasMappedOperation
  let pmOperation: PostmanMappedOperation

  beforeEach(async () => {
    pmOperation = await getPostmanMappedCreateOperation()
    oaOperation = await getOasMappedCreateOperation()
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should overwrite the root request body when overwrite is true', async () => {
    const overwriteValues = [
      {
        key: '.',
        value: { foo: 'foo-bar-baz' },
        overwrite: true
      }
    ]
    const dto = {
      overwriteValues,
      pmOperation,
      oaOperation
    }
    const result = overwriteRequestBody(dto)
    expect(result.item.request?.body?.raw).toMatchSnapshot()
  })

  it('should extend the root request body when overwrite is false', async () => {
    const overwriteValues = [
      {
        key: '.',
        value: { foo: 'foo-bar-baz' },
        overwrite: false
      }
    ]
    const dto = {
      overwriteValues,
      pmOperation,
      oaOperation
    }
    const result = overwriteRequestBody(dto)
    expect(result.item.request?.body?.raw).toMatchSnapshot()
  })

  it('should overwrite the request body with simple key value', async () => {
    const overwriteValues = [
      {
        key: 'name',
        value: 'foo-bar-baz'
      }
    ]
    const dto = {
      overwriteValues,
      pmOperation,
      oaOperation
    }
    const result = overwriteRequestBody(dto)
    expect(result.item.request?.body?.raw).toMatchSnapshot()
  })

  it('should overwrite the request body with number value', async () => {
    const overwriteValues = [
      {
        key: 'name',
        value: 987654321
      }
    ]
    const dto = {
      overwriteValues,
      pmOperation,
      oaOperation
    }
    const result = overwriteRequestBody(dto)
    expect(result.item.request?.body?.raw).toMatchSnapshot()
  })

  it('should overwrite the request body with boolean value', async () => {
    const overwriteValues = [
      {
        key: 'name',
        value: true
      }
    ]
    const dto = {
      overwriteValues,
      pmOperation,
      oaOperation
    }
    const result = overwriteRequestBody(dto)
    expect(result.item.request?.body?.raw).toMatchSnapshot()
  })

  it('should overwrite the request body with empty value', async () => {
    const overwriteValues = [
      {
        key: 'name',
        value: ''
      }
    ]
    const dto = {
      overwriteValues,
      pmOperation,
      oaOperation
    }
    const result = overwriteRequestBody(dto)
    expect(result.item.request?.body?.raw).toMatchSnapshot()
  })

  it('should add a property to the request body with simple key value', async () => {
    const overwriteValues = [
      {
        key: 'owner',
        value: 'foo-bar-baz'
      }
    ]
    const dto = {
      overwriteValues,
      pmOperation,
      oaOperation
    }
    const result = overwriteRequestBody(dto)
    expect(result.item.request?.body?.raw).toMatchSnapshot()
  })

  it('should overwrite the request body with dot notation path value', async () => {
    const overwriteValues = [
      {
        key: 'websites[1].type',
        value: 'secondary'
      }
    ]
    const dto = {
      overwriteValues,
      pmOperation,
      oaOperation
    }
    const result = overwriteRequestBody(dto)
    expect(result.item.request?.body?.raw).toMatchSnapshot()
  })

  it('should overwrite the request body with replacement object for value', async () => {
    const overwriteValues = [
      {
        key: 'websites',
        value: [
          {
            url: 'http://widget.biz',
            id: '5678',
            type: 'tertiary'
          }
        ],
        overwrite: true
      }
    ]
    const dto = {
      overwriteValues,
      pmOperation,
      oaOperation
    }
    const result = overwriteRequestBody(dto)
    expect(result.item.request?.body?.raw).toMatchSnapshot()
  })

  it('should append a request body array with overwriteValue', async () => {
    const overwriteValues = [
      {
        key: 'websites',
        value: [
          {
            url: 'http://widget.biz',
            id: '5678',
            type: 'tertiary'
          }
        ],
        overwrite: false
      }
    ]
    const dto = {
      overwriteValues,
      pmOperation,
      oaOperation
    }
    const result = overwriteRequestBody(dto)
    expect(result.item.request?.body?.raw).toMatchSnapshot()
  })

  it('should append to the body param when overwrite is false', async () => {
    const overwriteValues = [
      {
        key: 'name',
        value: 'foo-bar-baz',
        overwrite: false
      }
    ]
    const dto = {
      overwriteValues,
      pmOperation,
      oaOperation
    }
    const result = overwriteRequestBody(dto)
    expect(result.item.request?.body?.raw).toMatchSnapshot()
  })

  it('should append to the body param when remove is true', async () => {
    const overwriteValues = [
      {
        key: 'websites',
        remove: true
      }
    ]
    const dto = {
      overwriteValues,
      pmOperation,
      oaOperation
    }
    const result = overwriteRequestBody(dto)
    expect(result.item.request?.body?.raw).toMatchSnapshot()
  })

  it('should overwrite the body param with boolean instead of string', async () => {
    const overwriteValues = [
      {
        key: 'name',
        value: true
      }
    ]
    const dto = {
      overwriteValues,
      pmOperation,
      oaOperation
    }
    const result = overwriteRequestBody(dto)
    expect(result.item.request?.body?.raw).toMatchSnapshot()
  })

  it('should append to the body param with string {{$randomInt}}', async () => {
    const overwriteValues = [
      {
        key: 'name',
        value: '--{{$randomInt}}',
        overwrite: false
      }
    ]
    const dto = {
      overwriteValues,
      pmOperation,
      oaOperation
    }
    const result = overwriteRequestBody(dto)
    expect(result.item.request?.body?.raw).toMatchSnapshot()
  })

  it('should overwrite the body param with raw {{$randomInt}} instead of string', async () => {
    const overwriteValues = [
      {
        key: 'name',
        value: '{{$randomInt}}',
        overwrite: true
      }
    ]
    const dto = {
      overwriteValues,
      pmOperation,
      oaOperation
    }
    const result = overwriteRequestBody(dto)
    expect(result.item.request?.body?.raw).toMatchSnapshot()
  })

  it('should overwrite the body param with a numeric {{variable}} instead of string', async () => {
    const overwriteValues = [
      {
        key: 'name',
        value: '{{{123}}}', // Set the variable name, surrounded by {{{ at the start and }}} at the end, with quotes around it.
        overwrite: true
      }
    ]
    const dto = {
      overwriteValues,
      pmOperation,
      oaOperation
    }
    const result = overwriteRequestBody(dto)
    expect(result.item.request?.body?.raw).toMatchSnapshot()
  })

  it('should remove the body prop from a nested element', async () => {
    const overwriteValues = [
      {
        key: 'social_links[1].url',
        remove: true
      }
    ]
    const dto = {
      overwriteValues,
      pmOperation,
      oaOperation
    }
    const result = overwriteRequestBody(dto)
    expect(result.item.request?.body?.raw).toMatchSnapshot()
  })

  it('should remove a item from an array, and not return null', async () => {
    const overwriteValues = [
      {
        key: 'websites[0]',
        remove: true
      }
    ]
    const dto = {
      overwriteValues,
      pmOperation,
      oaOperation
    }
    const result = overwriteRequestBody(dto)
    expect(result.item.request?.body?.raw).toMatchSnapshot()
  })

  it('should remove nothing from the request body array', async () => {
    const overwriteValues = []
    pmOperation = await getPostmanMappedCreateArrayOperation()
    oaOperation = await getOasMappedCreateArrayOperation()
    const dto = {
      overwriteValues,
      pmOperation,
      oaOperation
    }
    const result = overwriteRequestBody(dto)
    expect(result.item.request?.body?.raw).toMatchSnapshot()
  })

  it('should remove a item of the request body array', async () => {
    const overwriteValues = [
      {
        key: '[0]',
        remove: true
      }
    ]
    pmOperation = await getPostmanMappedCreateArrayOperation()
    oaOperation = await getOasMappedCreateArrayOperation()
    const dto = {
      overwriteValues,
      pmOperation,
      oaOperation
    }
    const result = overwriteRequestBody(dto)
    expect(result.item.request?.body?.raw).toMatchSnapshot()
  })

  it('should add a property to the 1st item of the request body array with simple key value', async () => {
    const overwriteValues = [
      {
        key: '[0].owner',
        value: 'foo-bar-baz'
      }
    ]
    pmOperation = await getPostmanMappedCreateArrayOperation()
    oaOperation = await getOasMappedCreateArrayOperation()
    const dto = {
      overwriteValues,
      pmOperation,
      oaOperation
    }
    const result = overwriteRequestBody(dto)
    expect(result.item.request?.body?.raw).toMatchSnapshot()
  })

  it('should append a request body array with overwriteValue', async () => {
    const overwriteValues = [
      {
        key: '[0].websites',
        value: [
          {
            url: 'http://widget.biz',
            id: '5678',
            type: 'tertiary'
          }
        ],
        overwrite: false
      }
    ]
    pmOperation = await getPostmanMappedCreateArrayOperation()
    oaOperation = await getOasMappedCreateArrayOperation()
    const dto = {
      overwriteValues,
      pmOperation,
      oaOperation
    }
    const result = overwriteRequestBody(dto)
    expect(result.item.request?.body?.raw).toMatchSnapshot()
  })

  it('should append to the body param when overwrite is false', async () => {
    const overwriteValues = [
      {
        key: '[0].name',
        value: 'foo-bar-baz',
        overwrite: false
      }
    ]
    pmOperation = await getPostmanMappedCreateArrayOperation()
    oaOperation = await getOasMappedCreateArrayOperation()
    const dto = {
      overwriteValues,
      pmOperation,
      oaOperation
    }
    const result = overwriteRequestBody(dto)
    expect(result.item.request?.body?.raw).toMatchSnapshot()
  })

  it('should append to the body param when remove is true', async () => {
    const overwriteValues = [
      {
        key: '[0].websites',
        remove: true
      }
    ]
    pmOperation = await getPostmanMappedCreateArrayOperation()
    oaOperation = await getOasMappedCreateArrayOperation()
    const dto = {
      overwriteValues,
      pmOperation,
      oaOperation
    }
    const result = overwriteRequestBody(dto)
    expect(result.item.request?.body?.raw).toMatchSnapshot()
  })

  it('should overwrite the body param with boolean instead of string', async () => {
    const overwriteValues = [
      {
        key: '[0].name',
        value: true
      }
    ]
    pmOperation = await getPostmanMappedCreateArrayOperation()
    oaOperation = await getOasMappedCreateArrayOperation()
    const dto = {
      overwriteValues,
      pmOperation,
      oaOperation
    }
    const result = overwriteRequestBody(dto)
    expect(result.item.request?.body?.raw).toMatchSnapshot()
  })

  it('should append to the body param with string {{$randomInt}}', async () => {
    const overwriteValues = [
      {
        key: '[0].name',
        value: '--{{$randomInt}}',
        overwrite: false
      }
    ]
    pmOperation = await getPostmanMappedCreateArrayOperation()
    oaOperation = await getOasMappedCreateArrayOperation()
    const dto = {
      overwriteValues,
      pmOperation,
      oaOperation
    }
    const result = overwriteRequestBody(dto)
    expect(result.item.request?.body?.raw).toMatchSnapshot()
  })

  it('should overwrite the body param with raw {{$randomInt}} instead of string', async () => {
    const overwriteValues = [
      {
        key: '[0].name',
        value: '{{$randomInt}}',
        overwrite: true
      }
    ]
    pmOperation = await getPostmanMappedCreateArrayOperation()
    oaOperation = await getOasMappedCreateArrayOperation()
    const dto = {
      overwriteValues,
      pmOperation,
      oaOperation
    }
    const result = overwriteRequestBody(dto)
    expect(result.item.request?.body?.raw).toMatchSnapshot()
  })

  it('should overwrite the body param with string {{variable}}', async () => {
    const overwriteValues = [
      {
        key: '[0].name',
        overwrite: true,
        value: '{{variable_x}}'
      }
    ]
    pmOperation = await getPostmanMappedCreateArrayOperation()
    oaOperation = await getOasMappedCreateArrayOperation()
    const dto = {
      overwriteValues,
      pmOperation,
      oaOperation
    }
    const result = overwriteRequestBody(dto)
    expect(result.item.request?.body?.raw).toMatchSnapshot()
  })

  it('should overwrite the body param with raw {{variable}} instead of string', async () => {
    const overwriteValues = [
      {
        key: '[0].name',
        value: '{{{variable_x}}}',
        overwrite: true
      }
    ]
    pmOperation = await getPostmanMappedCreateArrayOperation()
    oaOperation = await getOasMappedCreateArrayOperation()
    const dto = {
      overwriteValues,
      pmOperation,
      oaOperation
    }
    const result = overwriteRequestBody(dto)
    expect(result.item.request?.body?.raw).toMatchSnapshot()
  })

  it('should overwrite the body param with value that contains a {{variable}}', async () => {
    const overwriteValues = [
      {
        key: '[0].name',
        value: 'Marco Polo {{variable_x}}',
        overwrite: true
      }
    ]
    pmOperation = await getPostmanMappedCreateArrayOperation()
    oaOperation = await getOasMappedCreateArrayOperation()
    const dto = {
      overwriteValues,
      pmOperation,
      oaOperation
    }
    const result = overwriteRequestBody(dto)
    expect(result.item.request?.body?.raw).toMatchSnapshot()
  })

  it('should overwrite the body param with generated string value', async () => {
    const overwriteValues = [
      {
        key: 'name',
        value: '<operationId>_<pathPart2>',
        overwrite: true
      }
    ]
    const dto = {
      overwriteValues,
      pmOperation,
      oaOperation
    }
    const result = overwriteRequestBody(dto)
    expect(result.item.request?.body?.raw).toMatchSnapshot()
  })

  it('should overwrite the body param with generated cased string value', async () => {
    const overwriteValues = [
      {
        key: 'name',
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
    const result = overwriteRequestBody(dto)
    expect(result.item.request?.body?.raw).toMatchSnapshot()
  })

  it('should overwrite the body param with generated string value with {{}}', async () => {
    const overwriteValues = [
      {
        key: 'name',
        value: '{{<operationId>_<pathPart2>}}',
        overwrite: true
      }
    ]
    const dto = {
      overwriteValues,
      pmOperation,
      oaOperation
    }
    const result = overwriteRequestBody(dto)
    expect(result.item.request?.body?.raw).toMatchSnapshot()
  })

  it('should overwrite the body param with generated cased string value with {{}}', async () => {
    const overwriteValues = [
      {
        key: 'name',
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
    const result = overwriteRequestBody(dto)
    expect(result.item.request?.body?.raw).toMatchSnapshot()
  })

  it('should convert raw escaped {{}} values to JSON safe values', async () => {
    const jsonString = `{
    "data": [
      {
        "key_1": "{{attributeString}}",
        "key_2": "{{{attributeNumber}}}",
        "key_3": "{{{attributeBoolean}}}",
        "key_4": "{{$randomInt}}"
      }
    ]
  }`
    const expected = `{
    "data": [
      {
        "key_1": "{{attributeString}}",
        "key_2": "{{{attributeNumber}}}",
        "key_3": "{{{attributeBoolean}}}",
        "key_4": "{{$randomInt}}"
      }
    ]
  }`
    const result = makeJsonSafeDynamicPmVars(jsonString)
    expect(result).toEqual(expected)
    const parseJson = () => {
      JSON.parse(result)
    }
    expect(parseJson).not.toThrow()
  })

  it('should convert decode {{}} values to JSON safe values', async () => {
    const jsonString = `{
    "data": [
        {
            "key_1": "{{attributeString}}",
            "key_2": "{{{attributeNumber}}}",
            "key_3": "{{{attributeBoolean}}}",
            "key_4": "{{$randomInt}}"
        }
    ]
}`
    const expected = `{
    "data": [
        {
            "key_1": "{{attributeString}}",
            "key_2": {{attributeNumber}},
            "key_3": {{attributeBoolean}},
            "key_4": {{$randomInt}}
        }
    ]
}`
    const result = decodeDynamicPmVars(jsonString)
    expect(result).toEqual(expected)
  })

  xit('should overwrite the body nested array prop with raw {{$randomInt}} instead of string', async () => {
    const overwriteValues = [
      {
        key: '[0].websites[1]',
        value: '{{$randomInt}}',
        overwrite: true
      }
    ]
    pmOperation = await getPostmanMappedCreateArrayOperation()
    oaOperation = await getOasMappedCreateArrayOperation()
    const dto = {
      overwriteValues,
      pmOperation,
      oaOperation
    }
    const result = overwriteRequestBody(dto)
    expect(result.item.request?.body?.raw).toMatchSnapshot()
  })

  it('should overwrite the request form data', async () => {
    const overwriteValues = [
      {
        key: 'name',
        value: 'foo'
      }
    ]
    const pmOperation = await getPostmanMappedCreateFormData()
    const dto = {
      overwriteValues,
      pmOperation,
      oaOperation
    }
    const result = overwriteRequestBody(dto)
    expect(result.item.request?.body?.formdata).toMatchSnapshot()
  })

  it('should overwrite the request form data with generated string value', async () => {
    const overwriteValues = [
      {
        key: 'name',
        value: '<operationId>_<pathPart2>'
      }
    ]
    const pmOperation = await getPostmanMappedCreateFormData()
    const dto = {
      overwriteValues,
      pmOperation,
      oaOperation
    }
    const result = overwriteRequestBody(dto)
    expect(result.item.request?.body?.formdata).toMatchSnapshot()
  })

  it('should overwrite the request form data with generated cased string value', async () => {
    const overwriteValues = [
      {
        key: 'name',
        value: '<operationId>_<pathPart2>',
        overwrite: true
      }
    ]
    const pmOperation = await getPostmanMappedCreateFormData()
    const dto = {
      overwriteValues,
      pmOperation,
      oaOperation,
      globals: {
        variableCasing: 'pascalCase'
      } as GlobalConfig
    }
    const result = overwriteRequestBody(dto)
    expect(result.item.request?.body?.formdata).toMatchSnapshot()
  })

  it('should disable the request form data', async () => {
    const overwriteValues = [
      {
        key: 'name',
        disable: true
      }
    ]
    const pmOperation = await getPostmanMappedCreateFormData()
    oaOperation = await getOasMappedCreateArrayOperation()
    const dto = {
      overwriteValues,
      pmOperation,
      oaOperation
    }
    const result = overwriteRequestBody(dto)
    expect(result.item.request?.body?.formdata).toMatchSnapshot()
  })

  it('should append the request form data when overwrite is false', async () => {
    const overwriteValues = [
      {
        key: 'name',
        value: 'foo',
        overwrite: false
      }
    ]
    const pmOperation = await getPostmanMappedCreateFormData()
    oaOperation = await getOasMappedCreateArrayOperation()
    const dto = {
      overwriteValues,
      pmOperation,
      oaOperation
    }
    const result = overwriteRequestBody(dto)
    expect(result.item.request?.body?.formdata).toMatchSnapshot()
  })

  it('should not append the request form data when overwrite is true', async () => {
    const overwriteValues = [
      {
        key: 'name',
        value: 'foo',
        overwrite: true
      }
    ]
    const pmOperation = await getPostmanMappedCreateFormData()
    oaOperation = await getOasMappedCreateArrayOperation()
    const dto = {
      overwriteValues,
      pmOperation,
      oaOperation
    }
    const result = overwriteRequestBody(dto)
    expect(result.item.request?.body?.formdata).toMatchSnapshot()
  })

  it('overwrite the request form data with an empty when overwrite is true', async () => {
    const overwriteValues = [
      {
        key: 'name',
        value: '',
        overwrite: true
      }
    ]
    const pmOperation = await getPostmanMappedCreateFormData()
    oaOperation = await getOasMappedCreateArrayOperation()
    const dto = {
      overwriteValues,
      pmOperation,
      oaOperation
    }
    const result = overwriteRequestBody(dto)
    expect(result.item.request?.body?.formdata).toMatchSnapshot()
  })

  it('should remove to the form data when remove is true', async () => {
    const overwriteValues = [
      {
        key: 'name',
        remove: true
      }
    ]
    const pmOperation = await getPostmanMappedCreateFormData()
    oaOperation = await getOasMappedCreateArrayOperation()
    const dto = {
      overwriteValues,
      pmOperation,
      oaOperation
    }
    const result = overwriteRequestBody(dto)
    expect(result.item.request?.body?.formdata).toMatchSnapshot()
  })

  it('should not remove any the request form data, when a absent key', async () => {
    const overwriteValues = [
      {
        key: 'fake-key',
        remove: true
      }
    ]
    const pmOperation = await getPostmanMappedCreateFormData()
    oaOperation = await getOasMappedCreateArrayOperation()
    const dto = {
      overwriteValues,
      pmOperation,
      oaOperation
    }
    const result = overwriteRequestBody(dto)
    expect(result.item.request?.body?.formdata).toMatchSnapshot()
  })

  it('should not insert the form data, if key found', async () => {
    const overwriteValues = [
      {
        key: 'name',
        value: 'foo-bar-baz',
        insert: true
      }
    ]
    const pmOperation = await getPostmanMappedCreateFormData()
    oaOperation = await getOasMappedCreateArrayOperation()
    const dto = {
      overwriteValues,
      pmOperation,
      oaOperation
    }
    const result = overwriteRequestBody(dto)
    expect(result.item.request?.body?.formdata).toMatchSnapshot()
  })

  it('should insert the form data variable, if key not found', async () => {
    const overwriteValues = [
      {
        key: 'add-a-form-param',
        value: 'foo-bar-baz'
      }
    ]
    const pmOperation = await getPostmanMappedCreateFormData()
    oaOperation = await getOasMappedCreateArrayOperation()
    const dto = {
      overwriteValues,
      pmOperation,
      oaOperation
    }
    const result = overwriteRequestBody(dto)
    expect(result.item.request?.body?.formdata).toMatchSnapshot()
  })

  it('should insert the form data variable with true insert option, if key not found', async () => {
    const overwriteValues = [
      {
        key: 'add-a-form-param',
        value: 'foo-bar-baz',
        insert: true
      }
    ]
    const pmOperation = await getPostmanMappedCreateFormData()
    oaOperation = await getOasMappedCreateArrayOperation()
    const dto = {
      overwriteValues,
      pmOperation,
      oaOperation
    }
    const result = overwriteRequestBody(dto)
    expect(result.item.request?.body?.formdata).toMatchSnapshot()
  })

  it('should skip the form data variable with false insert option, if key not found', async () => {
    const overwriteValues = [
      {
        key: 'add-a-form-param',
        value: 'foo-bar-baz',
        insert: false
      }
    ]

    const pmOperation = await getPostmanMappedCreateFormData()
    oaOperation = await getOasMappedCreateArrayOperation()
    const dto = {
      overwriteValues,
      pmOperation,
      oaOperation
    }
    const result = overwriteRequestBody(dto)
    expect(result.item.request?.body?.formdata).toMatchSnapshot()
  })

  it('should insert the form data variable with description, if key not found', async () => {
    const overwriteValues = [
      {
        key: 'add-a-form-param',
        value: 'foo-bar-baz',
        description: 'Additional form data'
      }
    ]
    const pmOperation = await getPostmanMappedCreateFormData()
    oaOperation = await getOasMappedCreateArrayOperation()
    const dto = {
      overwriteValues,
      pmOperation,
      oaOperation
    }
    const result = overwriteRequestBody(dto)
    expect(result.item.request?.body?.formdata).toMatchSnapshot()
  })

  it('should overwrite the form data variable with a blank value', async () => {
    const overwriteValues = [
      {
        key: 'name',
        value: '',
        overwrite: true
      }
    ]

    const pmOperation = await getPostmanMappedCreateFormData()
    oaOperation = await getOasMappedCreateArrayOperation()
    const dto = {
      overwriteValues,
      pmOperation,
      oaOperation
    }
    const result = overwriteRequestBody(dto)
    expect(result.item.request?.body?.formdata).toMatchSnapshot()
  })

  it('should overwrite the form data variable with a null value', async () => {
    const overwriteValues = [
      {
        key: 'name',
        value: null,
        overwrite: true
      }
    ]
    const pmOperation = await getPostmanMappedCreateFormData()
    oaOperation = await getOasMappedCreateArrayOperation()
    const dto = {
      overwriteValues,
      pmOperation,
      oaOperation
    }
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const result = overwriteRequestBody(dto)
    expect(result.item.request?.body?.formdata).toMatchSnapshot()
  })

  it('should overwrite the form data number variable with string value', async () => {
    const overwriteValues = [
      {
        key: 'name',
        value: -1,
        overwrite: true
      }
    ]

    const pmOperation = await getPostmanMappedCreateFormData()
    oaOperation = await getOasMappedCreateArrayOperation()
    const dto = {
      overwriteValues,
      pmOperation,
      oaOperation
    }
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const result = overwriteRequestBody(dto)
    expect(result.item.request?.body?.formdata).toMatchSnapshot()
  })

  it('should overwrite the form data boolean variable with string value', async () => {
    const overwriteValues = [
      {
        key: 'name',
        value: false,
        overwrite: true
      }
    ]

    const pmOperation = await getPostmanMappedCreateFormData()
    oaOperation = await getOasMappedCreateArrayOperation()
    const dto = {
      overwriteValues,
      pmOperation,
      oaOperation
    }
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const result = overwriteRequestBody(dto)
    expect(result.item.request?.body?.formdata).toMatchSnapshot()
  })

  it('should overwrite the urlencoded form data', async () => {
    const overwriteValues = [
      {
        key: 'name',
        value: 'foo'
      }
    ]
    const pmOperation = await getPostmanMappedCreateFormUrlEncoded()
    oaOperation = await getOasMappedCreateArrayOperation()
    const dto = {
      overwriteValues,
      pmOperation,
      oaOperation
    }
    const result = overwriteRequestBody(dto)
    expect(result.item.request?.body?.urlencoded).toMatchSnapshot()
  })

  it('should overwrite the request urlencoded form data with generated string value', async () => {
    const overwriteValues = [
      {
        key: 'name',
        value: '<operationId>_<pathPart2>'
      }
    ]
    const pmOperation = await getPostmanMappedCreateFormUrlEncoded()
    const dto = {
      overwriteValues,
      pmOperation,
      oaOperation
    }
    const result = overwriteRequestBody(dto)
    expect(result.item.request?.body?.urlencoded).toMatchSnapshot()
  })

  it('should overwrite the request urlencoded form data with generated cased string value', async () => {
    const overwriteValues = [
      {
        key: 'name',
        value: '<operationId>_<pathPart2>'
      }
    ]
    const pmOperation = await getPostmanMappedCreateFormUrlEncoded()
    const dto = {
      overwriteValues,
      pmOperation,
      oaOperation,
      globals: {
        variableCasing: 'pascalCase'
      } as GlobalConfig
    }
    const result = overwriteRequestBody(dto)
    expect(result.item.request?.body?.urlencoded).toMatchSnapshot()
  })

  it('should disable the urlencoded form data', async () => {
    const overwriteValues = [
      {
        key: 'name',
        disable: true
      }
    ]
    const pmOperation = await getPostmanMappedCreateFormUrlEncoded()
    oaOperation = await getOasMappedCreateArrayOperation()
    const dto = {
      overwriteValues,
      pmOperation,
      oaOperation
    }
    const result = overwriteRequestBody(dto)
    expect(result.item.request?.body?.urlencoded).toMatchSnapshot()
  })

  it('should append the request urlencoded form when overwrite is false', async () => {
    const overwriteValues = [
      {
        key: 'name',
        value: 'foo',
        overwrite: false
      }
    ]
    const pmOperation = await getPostmanMappedCreateFormUrlEncoded()
    oaOperation = await getOasMappedCreateArrayOperation()
    const dto = {
      overwriteValues,
      pmOperation,
      oaOperation
    }
    const result = overwriteRequestBody(dto)
    expect(result.item.request?.body?.urlencoded).toMatchSnapshot()
  })

  it('should not append the request urlencoded form when overwrite is true', async () => {
    const overwriteValues = [
      {
        key: 'name',
        value: 'foo',
        overwrite: true
      }
    ]
    const pmOperation = await getPostmanMappedCreateFormUrlEncoded()
    oaOperation = await getOasMappedCreateArrayOperation()
    const dto = {
      overwriteValues,
      pmOperation,
      oaOperation
    }
    const result = overwriteRequestBody(dto)
    expect(result.item.request?.body?.urlencoded).toMatchSnapshot()
  })

  it('overwrite the request urlencoded form with an empty when overwrite is true', async () => {
    const overwriteValues = [
      {
        key: 'name',
        value: '',
        overwrite: true
      }
    ]
    const pmOperation = await getPostmanMappedCreateFormUrlEncoded()
    oaOperation = await getOasMappedCreateArrayOperation()
    const dto = {
      overwriteValues,
      pmOperation,
      oaOperation
    }
    const result = overwriteRequestBody(dto)
    expect(result.item.request?.body?.urlencoded).toMatchSnapshot()
  })

  it('should remove to the urlencoded form when remove is true', async () => {
    const overwriteValues = [
      {
        key: 'name',
        remove: true
      }
    ]
    const pmOperation = await getPostmanMappedCreateFormUrlEncoded()
    oaOperation = await getOasMappedCreateArrayOperation()
    const dto = {
      overwriteValues,
      pmOperation,
      oaOperation
    }
    const result = overwriteRequestBody(dto)
    expect(result.item.request?.body?.urlencoded).toMatchSnapshot()
  })

  it('should not remove any the request urlencoded form, when a absent key', async () => {
    const overwriteValues = [
      {
        key: 'fake-key',
        remove: true
      }
    ]
    const pmOperation = await getPostmanMappedCreateFormUrlEncoded()
    oaOperation = await getOasMappedCreateArrayOperation()
    const dto = {
      overwriteValues,
      pmOperation,
      oaOperation
    }
    const result = overwriteRequestBody(dto)
    expect(result.item.request?.body?.urlencoded).toMatchSnapshot()
  })

  it('should not insert the urlencoded form, if key found', async () => {
    const overwriteValues = [
      {
        key: 'name',
        value: 'foo-bar-baz',
        insert: true
      }
    ]
    const pmOperation = await getPostmanMappedCreateFormUrlEncoded()
    oaOperation = await getOasMappedCreateArrayOperation()
    const dto = {
      overwriteValues,
      pmOperation,
      oaOperation
    }
    const result = overwriteRequestBody(dto)
    expect(result.item.request?.body?.urlencoded).toMatchSnapshot()
  })

  it('should insert the urlencoded form variable, if key not found', async () => {
    const overwriteValues = [
      {
        key: 'add-a-form-param',
        value: 'foo-bar-baz'
      }
    ]
    const pmOperation = await getPostmanMappedCreateFormUrlEncoded()
    oaOperation = await getOasMappedCreateArrayOperation()
    const dto = {
      overwriteValues,
      pmOperation,
      oaOperation
    }
    const result = overwriteRequestBody(dto)
    expect(result.item.request?.body?.urlencoded).toMatchSnapshot()
  })

  it('should insert the urlencoded form variable with true insert option, if key not found', async () => {
    const overwriteValues = [
      {
        key: 'add-a-form-param',
        value: 'foo-bar-baz',
        insert: true
      }
    ]
    const pmOperation = await getPostmanMappedCreateFormUrlEncoded()
    oaOperation = await getOasMappedCreateArrayOperation()
    const dto = {
      overwriteValues,
      pmOperation,
      oaOperation
    }
    const result = overwriteRequestBody(dto)
    expect(result.item.request?.body?.urlencoded).toMatchSnapshot()
  })

  it('should skip the urlencoded form variable with false insert option, if key not found', async () => {
    const overwriteValues = [
      {
        key: 'add-a-form-param',
        value: 'foo-bar-baz',
        insert: false
      }
    ]

    const pmOperation = await getPostmanMappedCreateFormUrlEncoded()
    oaOperation = await getOasMappedCreateArrayOperation()
    const dto = {
      overwriteValues,
      pmOperation,
      oaOperation
    }
    const result = overwriteRequestBody(dto)
    expect(result.item.request?.body?.urlencoded).toMatchSnapshot()
  })

  it('should insert the urlencoded form variable with description, if key not found', async () => {
    const overwriteValues = [
      {
        key: 'add-a-form-param',
        value: 'foo-bar-baz',
        description: 'Additional form data'
      }
    ]
    const pmOperation = await getPostmanMappedCreateFormUrlEncoded()
    oaOperation = await getOasMappedCreateArrayOperation()
    const dto = {
      overwriteValues,
      pmOperation,
      oaOperation
    }
    const result = overwriteRequestBody(dto)
    expect(result.item.request?.body?.urlencoded).toMatchSnapshot()
  })

  it('should overwrite the urlencoded form variable with a blank value', async () => {
    const overwriteValues = [
      {
        key: 'name',
        value: '',
        overwrite: true
      }
    ]

    const pmOperation = await getPostmanMappedCreateFormUrlEncoded()
    oaOperation = await getOasMappedCreateArrayOperation()
    const dto = {
      overwriteValues,
      pmOperation,
      oaOperation
    }
    const result = overwriteRequestBody(dto)
    expect(result.item.request?.body?.urlencoded).toMatchSnapshot()
  })

  it('should overwrite the urlencoded form variable with a null value', async () => {
    const overwriteValues = [
      {
        key: 'name',
        value: null,
        overwrite: true
      }
    ]
    const pmOperation = await getPostmanMappedCreateFormUrlEncoded()
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    oaOperation = await getOasMappedCreateArrayOperation()
    const dto = {
      overwriteValues,
      pmOperation,
      oaOperation
    }
    const result = overwriteRequestBody(dto)
    expect(result.item.request?.body?.urlencoded).toMatchSnapshot()
  })

  it('should overwrite the urlencoded form number variable with string value', async () => {
    const overwriteValues = [
      {
        key: 'name',
        value: -1,
        overwrite: true
      }
    ]

    const pmOperation = await getPostmanMappedCreateFormUrlEncoded()
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    oaOperation = await getOasMappedCreateArrayOperation()
    const dto = {
      overwriteValues,
      pmOperation,
      oaOperation
    }
    const result = overwriteRequestBody(dto)
    expect(result.item.request?.body?.urlencoded).toMatchSnapshot()
  })

  it('should overwrite the urlencoded form boolean variable with string value', async () => {
    const overwriteValues = [
      {
        key: 'name',
        value: false,
        overwrite: true
      }
    ]

    const pmOperation = await getPostmanMappedCreateFormUrlEncoded()
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    oaOperation = await getOasMappedCreateArrayOperation()
    const dto = {
      overwriteValues,
      pmOperation,
      oaOperation
    }
    const result = overwriteRequestBody(dto)
    expect(result.item.request?.body?.urlencoded).toMatchSnapshot()
  })
})
