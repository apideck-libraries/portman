import {
  getPostmanMappedCreateOperation,
  getPostmanMappedCreateArrayOperation
} from '../../../__tests__/testUtils/getPostmanMappedOperation'
import { overwriteRequestBody } from '../../application'

describe('overwriteRequestBody', () => {
  it('should extend the root request body', async () => {
    const overwriteValues = [
      {
        key: '.',
        value: { foo: 'foo-bar-baz' }
      }
    ]
    const pmOperation = await getPostmanMappedCreateOperation()
    const result = overwriteRequestBody(overwriteValues, pmOperation)
    expect(result.item.request?.body?.raw).toMatchSnapshot()
  })

  it('should overwrite the request body with simple key value', async () => {
    const overwriteValues = [
      {
        key: 'name',
        value: 'foo-bar-baz'
      }
    ]
    const pmOperation = await getPostmanMappedCreateOperation()
    const result = overwriteRequestBody(overwriteValues, pmOperation)
    expect(result.item.request?.body?.raw).toMatchSnapshot()
  })

  it('should add a property to the request body with simple key value', async () => {
    const overwriteValues = [
      {
        key: 'owner',
        value: 'foo-bar-baz'
      }
    ]
    const pmOperation = await getPostmanMappedCreateOperation()
    const result = overwriteRequestBody(overwriteValues, pmOperation)
    expect(result.item.request?.body?.raw).toMatchSnapshot()
  })

  it('should overwrite the request body with dot notation path value', async () => {
    const overwriteValues = [
      {
        key: 'websites[1].type',
        value: 'secondary'
      }
    ]
    const pmOperation = await getPostmanMappedCreateOperation()
    const result = overwriteRequestBody(overwriteValues, pmOperation)
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
    const pmOperation = await getPostmanMappedCreateOperation()
    const result = overwriteRequestBody(overwriteValues, pmOperation)
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
    const pmOperation = await getPostmanMappedCreateOperation()
    const result = overwriteRequestBody(overwriteValues, pmOperation)
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
    const pmOperation = await getPostmanMappedCreateOperation()
    const result = overwriteRequestBody(overwriteValues, pmOperation)
    expect(result.item.request?.body?.raw).toMatchSnapshot()
  })

  it('should append to the body param when remove is true', async () => {
    const overwriteValues = [
      {
        key: 'websites',
        remove: true
      }
    ]
    const pmOperation = await getPostmanMappedCreateOperation()
    const result = overwriteRequestBody(overwriteValues, pmOperation)
    expect(result.item.request?.body?.raw).toMatchSnapshot()
  })

  it('should overwrite the body param with boolean instead of string', async () => {
    const overwriteValues = [
      {
        key: 'name',
        value: true
      }
    ]
    const pmOperation = await getPostmanMappedCreateOperation()
    const result = overwriteRequestBody(overwriteValues, pmOperation)
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
    const pmOperation = await getPostmanMappedCreateOperation()
    const result = overwriteRequestBody(overwriteValues, pmOperation)
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
    const pmOperation = await getPostmanMappedCreateOperation()
    const result = overwriteRequestBody(overwriteValues, pmOperation)
    expect(result.item.request?.body?.raw).toMatchSnapshot()
  })

  it('should remove the body prop from a nested element', async () => {
    const overwriteValues = [
      {
        key: 'social_links[1].url',
        remove: true
      }
    ]
    const pmOperation = await getPostmanMappedCreateOperation()
    const result = overwriteRequestBody(overwriteValues, pmOperation)
    expect(result.item.request?.body?.raw).toMatchSnapshot()
  })

  it('should remove a item from an array, and not return null', async () => {
    const overwriteValues = [
      {
        key: 'websites[0]',
        remove: true
      }
    ]
    const pmOperation = await getPostmanMappedCreateOperation()
    const result = overwriteRequestBody(overwriteValues, pmOperation)
    expect(result.item.request?.body?.raw).toMatchSnapshot()
  })

  it('should remove nothing from the request body array', async () => {
    const overwriteValues = []
    const pmOperation = await getPostmanMappedCreateArrayOperation()
    const result = overwriteRequestBody(overwriteValues, pmOperation)
    expect(result.item.request?.body?.raw).toMatchSnapshot()
  })

  it('should remove a item of the request body array', async () => {
    const overwriteValues = [
      {
        key: '[0]',
        remove: true
      }
    ]
    const pmOperation = await getPostmanMappedCreateArrayOperation()
    const result = overwriteRequestBody(overwriteValues, pmOperation)
    expect(result.item.request?.body?.raw).toMatchSnapshot()
  })

  it('should add a property to the 1st item of the request body array with simple key value', async () => {
    const overwriteValues = [
      {
        key: '[0].owner',
        value: 'foo-bar-baz'
      }
    ]
    const pmOperation = await getPostmanMappedCreateArrayOperation()
    const result = overwriteRequestBody(overwriteValues, pmOperation)
    expect(result.item.request?.body?.raw).toMatchSnapshot()
  })
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
  const pmOperation = await getPostmanMappedCreateArrayOperation()
  const result = overwriteRequestBody(overwriteValues, pmOperation)
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
  const pmOperation = await getPostmanMappedCreateArrayOperation()
  const result = overwriteRequestBody(overwriteValues, pmOperation)
  expect(result.item.request?.body?.raw).toMatchSnapshot()
})

it('should append to the body param when remove is true', async () => {
  const overwriteValues = [
    {
      key: '[0].websites',
      remove: true
    }
  ]
  const pmOperation = await getPostmanMappedCreateArrayOperation()
  const result = overwriteRequestBody(overwriteValues, pmOperation)
  expect(result.item.request?.body?.raw).toMatchSnapshot()
})

it('should overwrite the body param with boolean instead of string', async () => {
  const overwriteValues = [
    {
      key: '[0].name',
      value: true
    }
  ]
  const pmOperation = await getPostmanMappedCreateArrayOperation()
  const result = overwriteRequestBody(overwriteValues, pmOperation)
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
  const pmOperation = await getPostmanMappedCreateArrayOperation()
  const result = overwriteRequestBody(overwriteValues, pmOperation)
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
  const pmOperation = await getPostmanMappedCreateArrayOperation()
  const result = overwriteRequestBody(overwriteValues, pmOperation)
  expect(result.item.request?.body?.raw).toMatchSnapshot()
})

xit('should overwrite the body nested array prop with raw {{$randomInt}} instead of string', async () => {
  const overwriteValues = [
    {
      key: '[0].websites[1]',
      value: '{{$randomInt}}',
      overwrite: true
    }
  ]
  const pmOperation = await getPostmanMappedCreateArrayOperation()
  const result = overwriteRequestBody(overwriteValues, pmOperation)
  expect(result.item.request?.body?.raw).toMatchSnapshot()
})
