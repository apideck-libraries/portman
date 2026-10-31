import newman from 'newman'
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

  describe('exit code with abortOnFailure disabled (#504)', () => {
    it('should pass abortOnFailure=false through to newman and still reject on failed assertions', async () => {
      const runSpy = jest.spyOn(newman, 'run')
      // Newman completes the whole run (no err, no summary.error) but assertions failed
      mockRunWithSummary({
        run: {
          stats: { assertions: { failed: 1 } },
          failures: [{ error: { name: 'AssertionError' } }]
        }
      })

      await expect(
        runNewmanWith(postmanFile, newmanEnvFile, undefined, { abortOnFailure: false } as any)
      ).rejects.toThrow('Newman run failed with test failures')

      expect(runSpy).toHaveBeenCalledWith(expect.objectContaining({ abortOnFailure: false }))
    })

    it('should reject when abortOnFailure is disabled via kebab-case cli option', async () => {
      const runSpy = jest.spyOn(newman, 'run')
      mockRunWithSummary({ run: { stats: { assertions: { failed: 3 } }, failures: [] } })

      await expect(
        runNewmanWith(postmanFile, newmanEnvFile, undefined, { 'abort-on-failure': false } as any)
      ).rejects.toThrow('Newman run failed with test failures')

      expect(runSpy).toHaveBeenCalledWith(expect.objectContaining({ abortOnFailure: false }))
    })

    it('should reject when only run failures are reported', async () => {
      mockRunWithSummary({ run: { stats: { assertions: { failed: 0 } }, failures: [{}] } })

      await expect(
        runNewmanWith(postmanFile, newmanEnvFile, undefined, { abortOnFailure: false } as any)
      ).rejects.toThrow('Newman run failed with test failures')
    })

    it('should resolve when all assertions pass with abortOnFailure=false', async () => {
      mockRunWithSummary({ run: { stats: { assertions: { failed: 0 } }, failures: [] } })

      await expect(
        runNewmanWith(postmanFile, newmanEnvFile, undefined, { abortOnFailure: false } as any)
      ).resolves.toBeUndefined()
    })
  })
})
