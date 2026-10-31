import fs from 'fs-extra'
import os from 'os'
import path from 'path'
import { Collection, ItemGroup, Item, Request, Response } from 'postman-collection'
import { OasMappedOperation } from '../../oas'
import {
  buildJsonReport,
  getPortmanVersion,
  inferTestType,
  parseAssertionTitle,
  RESPONSE_BODY_LIMIT,
  writeJsonReport
} from './jsonReport'

const schemaTitle = '[GET]::/crm/leads/:id - Schema is valid'
const schemaMessage =
  'expected data to satisfy schema but found following errors: \ndata.data.name should be string'

// Realistic Newman 'done' summary: one passing request, one failing schema assertion
const buildFakeSummary = () => {
  const collection = new Collection({
    item: [
      {
        name: 'Leads',
        item: [
          {
            id: 'item-list',
            name: 'List leads',
            request: { method: 'GET', url: '{{baseUrl}}/crm/leads' }
          },
          {
            id: 'item-one',
            name: 'Get lead',
            request: {
              method: 'GET',
              url: {
                // raw url as in a generated Portman collection
                raw: '{{baseUrl}}/crm/leads/:id',
                host: ['{{baseUrl}}'],
                path: ['crm', 'leads', ':id'],
                variable: [{ key: 'id', value: '123' }]
              }
            }
          }
        ]
      }
    ]
  } as any)
  const folder = collection.items.idx(0) as unknown as ItemGroup<Item>
  const listItem = folder.items.idx(0) as Item
  const oneItem = folder.items.idx(1) as Item

  const listExecution = {
    cursor: { ref: 'ref-1' },
    item: listItem,
    request: new Request({ method: 'GET', url: 'http://localhost:3050/crm/leads' }),
    response: new Response({ code: 200, responseTime: 12, body: '{"data":[]}' } as any),
    assertions: [{ assertion: '[GET]::/crm/leads - Status code is 2xx', skipped: false }]
  }
  const oneExecution = {
    cursor: { ref: 'ref-2' },
    item: oneItem,
    request: new Request({ method: 'GET', url: 'http://localhost:3050/crm/leads/123' }),
    response: new Response({
      code: 200,
      responseTime: 84,
      body: '{"data":{"id":"123","name":42}}'
    } as any),
    assertions: [
      { assertion: '[GET]::/crm/leads/:id - Status code is 2xx', skipped: false },
      {
        assertion: schemaTitle,
        skipped: false,
        error: { name: 'AssertionError', test: schemaTitle, message: schemaMessage }
      }
    ]
  }

  return {
    run: {
      stats: {
        requests: { total: 2, pending: 0, failed: 0 },
        assertions: { total: 3, pending: 0, failed: 1 }
      },
      timings: { started: 1761900000000, completed: 1761900000500 },
      executions: [listExecution, oneExecution],
      failures: [
        {
          error: {
            name: 'AssertionError',
            index: 1,
            test: schemaTitle,
            message: schemaMessage
          },
          at: 'assertion:1 in test-script',
          source: oneItem,
          parent: folder,
          cursor: { ref: 'ref-2' }
        }
      ]
    }
  }
}

const operationIdMap = {
  'GET::/crm/leads': new OasMappedOperation('/crm/leads', 'get', {
    operationId: 'leadsAll'
  } as any),
  'GET::/crm/leads/{id}': new OasMappedOperation('/crm/leads/{id}', 'get', {
    operationId: 'leadsOne'
  } as any)
}

describe('jsonReport', () => {
  describe('buildJsonReport', () => {
    it('should build a report for a run with a failing schema assertion', () => {
      const report = buildJsonReport(buildFakeSummary(), {
        spec: './crm.yml',
        baseUrl: 'http://localhost:3050',
        operationIdMap,
        portmanVersion: '1.2.3'
      })

      expect(report).toEqual({
        version: 1,
        portmanVersion: '1.2.3',
        spec: './crm.yml',
        baseUrl: 'http://localhost:3050',
        startedAt: '2025-10-31T08:40:00.000Z',
        finishedAt: '2025-10-31T08:40:00.500Z',
        summary: {
          requests: 2,
          assertions: 3,
          failedAssertions: 1,
          failures: 1,
          passed: false
        },
        runError: null,
        failures: [
          {
            request: 'Get lead',
            method: 'GET',
            url: 'http://localhost:3050/crm/leads/123',
            openApiOperation: 'GET::/crm/leads/{id}',
            openApiOperationId: 'leadsOne',
            variation: false,
            failureType: 'assertion',
            assertion: schemaTitle,
            testType: 'schemaValidation',
            message: schemaMessage,
            response: {
              status: 200,
              responseTime: 84,
              body: '{"data":{"id":"123","name":42}}',
              bodyTruncated: false
            }
          }
        ]
      })
    })

    it('should drop the duplicate failure newman adds when abortOnFailure is set', () => {
      const summary = buildFakeSummary()
      summary.run.failures.push({
        error: { name: 'AssertionFailure', message: schemaTitle },
        at: 'test-script:39:17',
        source: summary.run.failures[0].source,
        cursor: { ref: 'ref-2' }
      } as any)
      const report = buildJsonReport(summary, { operationIdMap })
      expect(report.summary.failures).toBe(1)
      expect(report.failures).toHaveLength(1)
      expect(report.failures[0].failureType).toBe('assertion')
    })

    it('should report a passing run', () => {
      const summary = buildFakeSummary()
      summary.run.failures = []
      summary.run.stats.assertions.failed = 0
      const report = buildJsonReport(summary, { portmanVersion: '1.2.3' })
      expect(report.summary).toEqual({
        requests: 2,
        assertions: 3,
        failedAssertions: 0,
        failures: 0,
        passed: true
      })
      expect(report.failures).toEqual([])
    })

    it('should fall back to the assertion title when the item is unknown', () => {
      const summary = buildFakeSummary()
      summary.run.executions = []
      summary.run.failures[0].source = undefined as any
      const report = buildJsonReport(summary, { operationIdMap })
      expect(report.failures[0]).toMatchObject({
        request: null,
        openApiOperation: 'GET::/crm/leads/{id}',
        openApiOperationId: 'leadsOne',
        testType: 'schemaValidation',
        response: null
      })
    })

    it('should report request errors and run errors', () => {
      const summary = buildFakeSummary()
      summary.run.failures = [
        {
          error: { name: 'Error', message: 'connect ECONNREFUSED 127.0.0.1:3050' },
          at: 'request',
          source: summary.run.executions[0].item,
          cursor: { ref: 'ref-x' }
        } as any
      ]
      const report = buildJsonReport(summary, { operationIdMap }, new Error('boom'))
      expect(report.runError).toEqual('boom')
      expect(report.summary.passed).toBe(false)
      expect(report.failures[0]).toMatchObject({
        request: 'List leads',
        method: 'GET',
        openApiOperation: 'GET::/crm/leads',
        openApiOperationId: 'leadsAll',
        failureType: 'requestError',
        assertion: null,
        testType: null,
        message: 'connect ECONNREFUSED 127.0.0.1:3050'
      })
    })

    it('should flag variations and truncate large bodies', () => {
      const summary = buildFakeSummary()
      const variationFolder = new ItemGroup<Item>({ name: 'Variation Tests' } as any)
      const variationItem = new Item({
        name: 'Get lead[not found]',
        request: { method: 'GET', url: '{{baseUrl}}/crm/leads/:id' }
      })
      variationFolder.items.add(variationItem)
      const execution = summary.run.executions[1] as any
      execution.item = variationItem
      execution.response = new Response({
        code: 404,
        responseTime: 5,
        body: 'x'.repeat(RESPONSE_BODY_LIMIT + 10)
      } as any)
      summary.run.failures[0].error.test = '[GET]::/crm/leads/:id - custom check'

      const failure = buildJsonReport(summary, { operationIdMap }).failures[0]
      expect(failure.variation).toBe(true)
      expect(failure.testType).toBe('variation')
      expect(failure.response?.status).toBe(404)
      expect(failure.response?.body).toHaveLength(RESPONSE_BODY_LIMIT)
      expect(failure.response?.bodyTruncated).toBe(true)
    })
  })

  describe('inferTestType', () => {
    it.each([
      ['[GET]::/a - Status code is 2xx', 'statusSuccess'],
      ['[GET]::/a - Response status code is 404', 'statusCode'],
      ['[GET]::/a - Content-Type is application/json', 'contentType'],
      ['[GET]::/a - Response has JSON Body', 'jsonBody'],
      ['[DELETE]::/a - Response has empty Body', 'jsonBody'],
      ['[GET]::/a/:id - Schema is valid', 'schemaValidation'],
      ['[GET]::/a - Response header Operation-Location is present', 'headersPresent'],
      ['[GET]::/a - Response time is less than 300ms', 'responseTime'],
      ["[GET]::/a - Content check if 'data.id' exists", 'content'],
      ["[GET]::/a - Content check if header value for 'x' matches 'y'", 'content'],
      ['some custom test', 'unknown']
    ])('%s => %s', (title, expected) => {
      expect(inferTestType(title)).toEqual(expected)
    })

    it('should honour a custom separatorSymbol', () => {
      expect(inferTestType('[GET]>>/a - Schema is valid', '>>')).toEqual('schemaValidation')
      expect(parseAssertionTitle('[get]>>/a/:id - x', '>>')).toEqual({
        method: 'GET',
        path: '/a/:id',
        check: 'x'
      })
    })
  })

  describe('writeJsonReport', () => {
    it('should write the report as JSON, creating folders', () => {
      const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'portman-report-'))
      const target = path.join(dir, 'nested', 'report.json')
      const report = buildJsonReport(buildFakeSummary(), { operationIdMap })
      writeJsonReport(target, report)
      expect(JSON.parse(fs.readFileSync(target, 'utf8'))).toEqual(report)
      fs.removeSync(dir)
    })
  })

  it('should resolve the Portman package version', () => {
    expect(getPortmanVersion()).toEqual(
      fs.readJsonSync(path.join(__dirname, '../../../package.json')).version
    )
  })
})
