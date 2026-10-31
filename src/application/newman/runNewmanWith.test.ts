import fs from 'fs-extra'
import newman from 'newman'
import os from 'os'
import path from 'path'
import { runNewmanWith } from '../../application'

jest.mock('newman')

describe('runNewmanWith', () => {
  afterEach(() => {
    jest.clearAllMocks()
    jest.resetAllMocks()
  })

  const newmanEnvFile = '__tests__/fixtures/crmApi-env.json'
  const postmanFile = '__tests__/fixtures/crm.postman.json'

  const mockRunWithSummary = (summary: any, err?: any) => {
    ;(newman.run as jest.Mock).mockImplementation(() => {
      const emitter = {
        on: (event: string, cb: (err: any, summary: any) => void) => {
          if (event === 'done') {
            // simulate async completion
            setImmediate(() => cb(err, summary))
          }
          return emitter
        }
      }
      return emitter
    })
  }

  it('should call newman with options', async () => {
    const runSpy = jest.spyOn(newman, 'run')

    // success summary (no errors, no failures)
    mockRunWithSummary({ run: { stats: { assertions: { failed: 0 } }, failures: [] } })

    await runNewmanWith(postmanFile, newmanEnvFile, undefined, {})

    expect(runSpy).toHaveBeenCalled()
  })

  it('should reject when assertion failures are present (abortOnFailure=false)', async () => {
    // summary with assertion failures but no err/summary.error
    mockRunWithSummary({ run: { stats: { assertions: { failed: 2 } }, failures: [{}, {}] } })

    await expect(
      runNewmanWith(postmanFile, newmanEnvFile, undefined, { abortOnFailure: false } as any)
    ).rejects.toThrow()
  })

  describe('jsonReport', () => {
    let dir: string
    beforeEach(() => {
      dir = fs.mkdtempSync(path.join(os.tmpdir(), 'portman-newman-'))
    })
    afterEach(() => {
      fs.removeSync(dir)
    })

    it('should write the JSON report when the run passes', async () => {
      const reportFile = path.join(dir, 'report.json')
      mockRunWithSummary({
        run: {
          stats: { requests: { total: 1 }, assertions: { total: 2, failed: 0 } },
          failures: []
        }
      })

      await runNewmanWith(
        postmanFile,
        newmanEnvFile,
        undefined,
        {},
        {
          jsonReport: reportFile,
          spec: './crm.yml',
          baseUrl: 'http://localhost:3050'
        }
      )

      const report = JSON.parse(fs.readFileSync(reportFile, 'utf8'))
      expect(report).toMatchObject({
        version: 1,
        spec: './crm.yml',
        baseUrl: 'http://localhost:3050',
        summary: { requests: 1, assertions: 2, failedAssertions: 0, failures: 0, passed: true },
        failures: []
      })
    })

    it('should write the JSON report and still reject when the run fails', async () => {
      const reportFile = path.join(dir, 'report.json')
      mockRunWithSummary({
        run: {
          stats: { requests: { total: 1 }, assertions: { total: 1, failed: 1 } },
          failures: [
            {
              error: {
                name: 'AssertionError',
                test: '[GET]::/crm/leads - Schema is valid',
                message: 'data.name should be string'
              },
              at: 'assertion:0 in test-script',
              cursor: {}
            }
          ]
        }
      })

      await expect(
        runNewmanWith(postmanFile, newmanEnvFile, undefined, {}, { jsonReport: reportFile })
      ).rejects.toThrow()

      const report = JSON.parse(fs.readFileSync(reportFile, 'utf8'))
      expect(report.summary.passed).toBe(false)
      expect(report.failures[0]).toMatchObject({
        assertion: '[GET]::/crm/leads - Schema is valid',
        testType: 'schemaValidation',
        openApiOperation: 'GET::/crm/leads',
        message: 'data.name should be string'
      })
    })
  })
})
