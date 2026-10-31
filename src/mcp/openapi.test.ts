import { findResponse, listOperations, loadSpec, specInfo } from './openapi'

const crmSpec = './examples/testsuite-contract-tests/crm.openapi.yml'

describe('MCP list_operations', () => {
  it('lists the operations of the example CRM spec', async () => {
    const parser = await loadSpec(crmSpec)
    const operations = listOperations(parser)

    expect(specInfo(parser)).toEqual({
      title: 'CRM API - Contract tests',
      version: '1.3.0',
      openapi: '3.0.3'
    })
    expect(operations.map(operation => operation.openApiOperation)).toEqual([
      'GET::/crm/leads',
      'POST::/crm/leads',
      'GET::/crm/leads/{id}',
      'PATCH::/crm/leads/{id}',
      'DELETE::/crm/leads/{id}'
    ])
    expect(operations[2]).toEqual({
      method: 'GET',
      path: '/crm/leads/{id}',
      openApiOperation: 'GET::/crm/leads/{id}',
      operationId: 'leadsOne',
      summary: 'Get lead',
      tags: ['Leads'],
      responseStatusCodes: ['200', '400', '401', '402', '404', '422', 'default'],
      deprecated: false
    })
  })

  it('throws a clear error for a missing spec file', async () => {
    await expect(loadSpec('./does-not-exist.yml')).rejects.toThrow(/OpenAPI file not found/)
  })

  it('looks up responses by exact code, then range, then default', async () => {
    const parser = await loadSpec(crmSpec)
    const operation = parser.getOperationById('leadsOne')!
    expect(findResponse(operation, 200)?.key).toBe('200')
    expect(findResponse(operation, 503)?.key).toBe('default')
    expect(findResponse(operation, undefined)?.key).toBe('200')
  })
})
