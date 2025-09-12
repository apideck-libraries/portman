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
})
