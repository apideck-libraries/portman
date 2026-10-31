import prompts from 'prompts'
import { ensureInteractiveInit, promptInit } from './promptInit'

jest.mock('prompts')

describe('promptInit', () => {
  const originalIsTTY = process.stdin.isTTY
  let exitSpy: jest.SpyInstance
  let errorSpy: jest.SpyInstance

  const setIsTTY = (value: boolean | undefined): void => {
    Object.defineProperty(process.stdin, 'isTTY', { value, configurable: true })
  }

  beforeEach(() => {
    jest.spyOn(console, 'log').mockImplementation(() => {})
    errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
    exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => undefined as never)
    ;(prompts as unknown as jest.Mock).mockResolvedValue({})
  })

  afterEach(() => {
    setIsTTY(originalIsTTY)
    jest.restoreAllMocks()
    ;(prompts as unknown as jest.Mock).mockReset()
  })

  it.each([undefined, false])(
    'should exit 1 without prompting when stdin is not a TTY (isTTY=%s)',
    async isTTY => {
      setIsTTY(isTTY)

      expect(ensureInteractiveInit()).toBe(false)
      await promptInit()

      expect(prompts).not.toHaveBeenCalled()
      expect(exitSpy).toHaveBeenCalledWith(1)
      const message = errorSpy.mock.calls[0][0]
      expect(message).toContain('requires a TTY')
      expect(message).toContain('--cliOptionsFile')
      expect(message).toContain('https://github.com/apideck-libraries/portman#cli-options')
    }
  )

  it('should prompt when stdin is a TTY', async () => {
    setIsTTY(true)

    expect(ensureInteractiveInit()).toBe(true)
    await promptInit()

    expect(prompts).toHaveBeenCalled()
    expect(exitSpy).not.toHaveBeenCalled()
    expect(errorSpy).not.toHaveBeenCalled()
  })
})
