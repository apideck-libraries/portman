import { runNewmanWith } from '../application/newman/runNewmanWith'
import { Portman } from '../Portman'

jest.mock('../application/newman/runNewmanWith')
jest.mock('../application/newman/writeNewmanEnv')

// Regression coverage for #504: a failed Newman run must make Portman exit non-zero,
// also when Newman is configured with abortOnFailure=false.
describe('Portman.runNewmanSuite() exit code', () => {
  let exitSpy: jest.SpyInstance

  beforeEach(() => {
    jest.spyOn(console, 'log').mockImplementation(() => {})
    jest.spyOn(console, 'error').mockImplementation(() => {})
    exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => undefined as never)
  })

  afterEach(() => {
    jest.restoreAllMocks()
    ;(runNewmanWith as jest.Mock).mockReset()
  })

  const newmanPortman = (): Portman => {
    const portman = new Portman({
      runNewman: true,
      baseUrl: 'http://localhost:3050',
      // abortOnFailure is a valid Newman run option but missing from @types/newman
      newmanRunOptions: { abortOnFailure: false } as any
    })
    portman.collectionFile = '__tests__/fixtures/crm.postman.json'
    return portman
  }

  it('should call process.exit(1) when the Newman run rejects', async () => {
    ;(runNewmanWith as jest.Mock).mockRejectedValue(
      new Error('Newman run failed with test failures')
    )

    await newmanPortman().runNewmanSuite()

    expect(runNewmanWith).toHaveBeenCalledWith(
      '__tests__/fixtures/crm.postman.json',
      expect.any(String),
      undefined,
      { abortOnFailure: false }
    )
    expect(exitSpy).toHaveBeenCalledWith(1)
  })

  it('should not exit when the Newman run resolves', async () => {
    ;(runNewmanWith as jest.Mock).mockResolvedValue(undefined)

    await newmanPortman().runNewmanSuite()

    expect(runNewmanWith).toHaveBeenCalled()
    expect(exitSpy).not.toHaveBeenCalled()
  })
})
