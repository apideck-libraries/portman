import fs from 'fs-extra'
import { JsonReport } from '../application/newman/jsonReport'
import { explainFailure, schemaToText } from './explain'
import { loadSpec } from './openapi'

const reportPath = './__tests__/fixtures/mcp/report.json'

describe('MCP explain_failure', () => {
  let report: JsonReport

  beforeAll(async () => {
    report = await fs.readJson(reportPath)
  })

  it('explains a schemaValidation failure with the response schema of the failing status', async () => {
    const parser = await loadSpec(report.spec as string)
    const result = explainFailure(report, reportPath, 0, parser)

    expect(result.totalFailures).toBe(3)
    expect(result.failure.testType).toBe('schemaValidation')
    expect(result.operation).toMatchObject({
      operationId: 'leadsOne',
      openApiOperation: 'GET::/crm/leads/{id}',
      summary: 'Get lead'
    })
    expect(result.expected?.responseKey).toBe('200')
    expect(result.expected?.contentTypes).toEqual(['application/json'])
    const schema = JSON.parse(result.expected?.schema as string)
    expect(schema.required).toEqual(
      expect.arrayContaining(['status_code', 'status', 'service', 'resource', 'operation', 'data'])
    )
    expect(result.hint).toMatch(/does not match the response schema for "200"/)
    expect(result.hint).toMatch(/Do not disable or weaken the Portman checks/)
    expect(result.note).toBeUndefined()
  })

  it('names the expected content types for a contentType failure', async () => {
    const parser = await loadSpec(report.spec as string)
    const result = explainFailure(report, reportPath, 1, parser)
    expect(result.operation?.operationId).toBe('leadsAll')
    expect(result.hint).toMatch(/documents application\/json/)
  })

  it('points at the baseUrl for request errors', async () => {
    const parser = await loadSpec(report.spec as string)
    const result = explainFailure(report, reportPath, 2, parser)
    expect(result.operation?.operationId).toBe('leadsDelete')
    expect(result.expected?.responseKey).toBe('200')
    expect(result.hint).toMatch(/reachable at http:\/\/localhost:3050/)
  })

  it('still explains the failure when the spec is unavailable', () => {
    const result = explainFailure(report, reportPath, 0, null)
    expect(result.operation).toBeNull()
    expect(result.note).toMatch(/could not be loaded/)
  })

  it('serialises circular schemas and caps their size', () => {
    const circular: Record<string, unknown> = { type: 'object' }
    circular.properties = { self: circular }
    expect(schemaToText(circular)).toContain('[Circular]')
    expect(schemaToText({ description: 'x'.repeat(100) }, 50)).toMatch(/truncated/)
  })
})
