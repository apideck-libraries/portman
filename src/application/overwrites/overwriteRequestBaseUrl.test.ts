import { getPostmanMappedOperation } from '../../../__tests__/testUtils/getPostmanMappedOperation'
import { overwriteRequestBaseUrl } from '../../application'

describe('overwriteRequestBaseUrl', () => {
  it('should not overwrite the request base url', async () => {
    const overwriteValue = {}

    const pmOperation = await getPostmanMappedOperation()
    const result = overwriteRequestBaseUrl(overwriteValue, pmOperation)
    expect(result.item.request.url.getHost()).toBe('{{baseUrl}}')
    expect(result.item.request.url).toMatchSnapshot()
  })

  it('should overwrite the request base url with a variable', async () => {
    const overwriteValue = {
      value: '{{foo-bar-baz}}'
    }

    const pmOperation = await getPostmanMappedOperation()
    const result = overwriteRequestBaseUrl(overwriteValue, pmOperation)
    expect(result.item.request.url.getHost()).toBe('{{foo-bar-baz}}')
    expect(result.item.request.url).toMatchSnapshot()
  })

  it('should overwrite the request base url with a domain name', async () => {
    const overwriteValue = {
      value: 'example.com'
    }

    const pmOperation = await getPostmanMappedOperation()
    const result = overwriteRequestBaseUrl(overwriteValue, pmOperation)
    expect(result.item.request.url.getHost()).toBe('example.com')
    expect(result.item.request.url).toMatchSnapshot()
  })

  it('should overwrite the request base url with a full domain name', async () => {
    const overwriteValue = {
      value: 'https://www.example.com'
    }

    const pmOperation = await getPostmanMappedOperation()
    const result = overwriteRequestBaseUrl(overwriteValue, pmOperation)
    expect(result.item.request.url.getHost()).toBe('www.example.com')
    expect(result.item.request.url).toMatchSnapshot()
  })

  it('should overwrite the request base url with a full domain name with port', async () => {
    const overwriteValue = {
      value: 'https://www.example.com:3000'
    }

    const pmOperation = await getPostmanMappedOperation()
    const result = overwriteRequestBaseUrl(overwriteValue, pmOperation)
    expect(result.item.request.url.getHost()).toBe('www.example.com')
    expect(result.item.request.url).toMatchSnapshot()
  })

  it('should append to the request base url when overwrite is false', async () => {
    const overwriteValue = {
      value: '.example.com',
      overwrite: false
    }

    const pmOperation = await getPostmanMappedOperation()
    const result = overwriteRequestBaseUrl(overwriteValue, pmOperation)
    expect(result.item.request.url.getHost()).toBe('{{baseUrl}}.example.com')
    expect(result.item.request.url).toMatchSnapshot()
  })

  it('should remove the request base url when remove is true', async () => {
    const overwriteValue = {
      remove: true
    }

    const pmOperation = await getPostmanMappedOperation()
    const result = overwriteRequestBaseUrl(overwriteValue, pmOperation)
    expect(result.item.request.url.getHost()).toBe('')
    expect(result.item.request.url).toMatchSnapshot()
  })

  it('should overwrite the request base url with a blank value', async () => {
    const overwriteValue = {
      value: '',
      overwrite: true
    }

    const pmOperation = await getPostmanMappedOperation()
    const result = overwriteRequestBaseUrl(overwriteValue, pmOperation)
    expect(result.item.request.url.getHost()).toBe('')
    expect(result.item.request.url).toMatchSnapshot()
  })

  it('should overwrite the request base url with a variable and path', async () => {
    const overwriteValue = {
      value: '{{foo-bar-baz}}/path'
    }

    const pmOperation = await getPostmanMappedOperation()
    const result = overwriteRequestBaseUrl(overwriteValue, pmOperation)
    expect(result.item.request.url.getHost()).toBe('{{foo-bar-baz}}')
    expect(result.item.request.url.path).toBeDefined()
    expect(result.item.request.url.path?.length).toEqual(4)
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    expect(result.item.request.url.path[0]).toEqual('path')
    expect(result.item.request.url).toMatchSnapshot()
  })
})
