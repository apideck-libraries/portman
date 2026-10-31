import { isolate, PortmanExitError, stripAnsi, tailLogs } from './isolation'

describe('MCP isolation (process.exit and console boundary)', () => {
  const stderrWrite = process.stderr.write

  beforeEach(() => {
    process.stderr.write = jest.fn(() => true) as never
  })

  afterEach(() => {
    process.stderr.write = stderrWrite
  })

  it('turns process.exit into a PortmanExitError and restores process.exit', async () => {
    const realExit = process.exit
    const result = await isolate(() => {
      console.error('\x1b[31m', 'OAS File Error - Unable to process the OpenAPI file.')
      process.exit(1)
    })

    expect(result.error).toBeInstanceOf(PortmanExitError)
    expect((result.error as PortmanExitError).code).toBe(1)
    expect(process.exit).toBe(realExit)
    expect(tailLogs(result.logs)).toEqual([' OAS File Error - Unable to process the OpenAPI file.'])
  })

  it('surfaces process.exit called from async code and a nested catch block', async () => {
    const result = await isolate(async () => {
      try {
        await Promise.reject(new Error('boom'))
      } catch (_e) {
        process.exit(2)
      }
      return 'not reached'
    })
    expect(result.value).toBeUndefined()
    expect((result.error as PortmanExitError).code).toBe(2)
  })

  it('captures console output instead of writing to stdout', async () => {
    const stdoutWrite = jest.spyOn(process.stdout, 'write')
    const realLog = console.log
    const result = await isolate(() => {
      console.log('hello', { a: 1 })
      console.info('info')
      return 42
    })
    expect(result.value).toBe(42)
    expect(result.logs).toEqual(['hello {"a":1}', 'info'])
    expect(stdoutWrite).not.toHaveBeenCalled()
    expect(process.stderr.write).toHaveBeenCalledWith('hello {"a":1}\n')
    expect(console.log).toBe(realLog)
    stdoutWrite.mockRestore()
  })

  it('serialises calls so patches never overlap', async () => {
    const order: string[] = []
    const slow = isolate(async () => {
      order.push('slow:start')
      await new Promise(resolve => setTimeout(resolve, 20))
      order.push('slow:end')
    })
    const fast = isolate(() => {
      order.push('fast')
    })
    await Promise.all([slow, fast])
    expect(order).toEqual(['slow:start', 'slow:end', 'fast'])
  })

  it('strips ANSI codes', () => {
    expect(stripAnsi('\x1b[31mred\x1b[0m')).toBe('red')
  })
})
