import { getPostmanMappedOperation } from '../../../__tests__/testUtils/getPostmanMappedOperation'
import { overwriteRequestBaseUrl } from '../../application'
import { omitKeys } from '../../utils'

describe('overwriteRequestBaseUrl', () => {
  it('should not overwrite the request base url', async () => {
    const overwriteValue = {}

    const pmOperation = await getPostmanMappedOperation()
    const result = overwriteRequestBaseUrl(overwriteValue, pmOperation)
    expect(result.item.request.url.getHost()).toBe('{{baseUrl}}')
    expect(omitKeys(result.item.request.url, ['query', 'variables'])).toMatchSnapshot()
  })

  it('should overwrite the request base url with a variable', async () => {
    const overwriteValue = {
      value: '{{foo-bar-baz}}'
    }

    const pmOperation = await getPostmanMappedOperation()
    const result = overwriteRequestBaseUrl(overwriteValue, pmOperation)
    expect(result.item.request.url.getHost()).toBe('{{foo-bar-baz}}')
    expect(omitKeys(result.item.request.url, ['query', 'variables'])).toMatchSnapshot()
  })

  it('should overwrite the request base url with a domain name', async () => {
    const overwriteValue = {
      value: 'example.com'
    }

    const pmOperation = await getPostmanMappedOperation()
    const result = overwriteRequestBaseUrl(overwriteValue, pmOperation)
    expect(result.item.request.url.getHost()).toBe('example.com')
    expect(omitKeys(result.item.request.url, ['query', 'variables'])).toMatchSnapshot()
  })

  it('should overwrite the request base url with a full domain name', async () => {
    const overwriteValue = {
      value: 'https://www.example.com'
    }

    const pmOperation = await getPostmanMappedOperation()
    const result = overwriteRequestBaseUrl(overwriteValue, pmOperation)
    expect(result.item.request.url.getHost()).toBe('www.example.com')
    expect(omitKeys(result.item.request.url, ['query', 'variables'])).toMatchSnapshot()
  })

  it('should append to the request base url when overwrite is false', async () => {
    const overwriteValue = {
      value: '.example.com',
      overwrite: false
    }

    const pmOperation = await getPostmanMappedOperation()
    const result = overwriteRequestBaseUrl(overwriteValue, pmOperation)
    expect(result.item.request.url.getHost()).toBe('{{baseUrl}}.example.com')
    expect(omitKeys(result.item.request.url, ['query', 'variables'])).toMatchSnapshot()
  })

  it('should remove the request base url when remove is true', async () => {
    const overwriteValue = {
      remove: true
    }

    const pmOperation = await getPostmanMappedOperation()
    const result = overwriteRequestBaseUrl(overwriteValue, pmOperation)
    expect(result.item.request.url.getHost()).toBe('')
    expect(omitKeys(result.item.request.url, ['query', 'variables'])).toMatchSnapshot()
  })

  it('should overwrite the request base url with a blank value', async () => {
    const overwriteValue = {
      value: '',
      overwrite: true
    }

    const pmOperation = await getPostmanMappedOperation()
    const result = overwriteRequestBaseUrl(overwriteValue, pmOperation)
    expect(result.item.request.url.getHost()).toBe('')
    expect(omitKeys(result.item.request.url, ['query', 'variables'])).toMatchSnapshot()
  })
})
