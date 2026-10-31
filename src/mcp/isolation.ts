import { Writable } from 'stream'

/**
 * Process isolation for running Portman internals inside a long-lived MCP server.
 *
 * Portman was written as a CLI: it logs progress with console.* and calls process.exit()
 * on errors. Inside the MCP server both are fatal: stdout carries the MCP protocol and
 * process.exit() would kill the server. `isolate()` runs a function with:
 *  - process.exit replaced by a function that throws a PortmanExitError,
 *  - console.* captured (and mirrored to stderr), so log lines can be returned to the agent.
 * Calls are serialised, because the patches are process-global and Portman uses a shared
 * ./tmp working directory.
 */

export class PortmanExitError extends Error {
  public readonly code: number

  constructor(code: number) {
    super(`Portman stopped with exit code ${code}`)
    this.name = 'PortmanExitError'
    this.code = code
    Object.setPrototypeOf(this, PortmanExitError.prototype)
  }
}

export interface IsolatedResult<T> {
  value?: T
  error?: unknown
  /** Captured console output, ANSI codes stripped */
  logs: string[]
}

const CONSOLE_METHODS = ['log', 'info', 'warn', 'error', 'debug', 'trace'] as const

// oxlint-disable-next-line no-control-regex -- strip ANSI escape sequences from Portman output
const ANSI_PATTERN = /\x1b\[[0-9;]*[A-Za-z]/g

export const stripAnsi = (value: string): string => value.replace(ANSI_PATTERN, '')

const formatArgs = (args: unknown[]): string =>
  args
    .map(arg => {
      if (typeof arg === 'string') return arg
      if (arg instanceof Error) return arg.stack || arg.message
      try {
        return JSON.stringify(arg)
      } catch (_e) {
        return String(arg)
      }
    })
    .join(' ')

let queue: Promise<unknown> = Promise.resolve()

/**
 * Run `fn` with process.exit and console patched. Never rejects: errors (including a
 * PortmanExitError raised by an intercepted process.exit call) are returned in `error`.
 */
export const isolate = <T>(
  fn: () => Promise<T> | T,
  options: { mirrorToStderr?: boolean } = {}
): Promise<IsolatedResult<T>> => {
  const mirrorToStderr = options.mirrorToStderr ?? true

  const run = async (): Promise<IsolatedResult<T>> => {
    const logs: string[] = []
    const originalExit = process.exit
    const originalConsole: Partial<Record<(typeof CONSOLE_METHODS)[number], unknown>> = {}

    process.exit = ((code?: number | string | null) => {
      throw new PortmanExitError(Number(code ?? 0))
    }) as typeof process.exit

    CONSOLE_METHODS.forEach(method => {
      originalConsole[method] = console[method]
      console[method] = (...args: unknown[]): void => {
        const line = stripAnsi(formatArgs(args))
        logs.push(line)
        if (mirrorToStderr) process.stderr.write(line + '\n')
      }
    })

    try {
      const value = await fn()
      return { value, logs }
    } catch (error) {
      return { error, logs }
    } finally {
      process.exit = originalExit
      CONSOLE_METHODS.forEach(method => {
        console[method] = originalConsole[method] as never
      })
    }
  }

  const result = queue.then(run, run)
  queue = result.catch(() => undefined)
  return result
}

/** Last `max` non-empty log lines, for error messages returned to the agent */
export const tailLogs = (logs: string[], max = 20): string[] =>
  logs
    .reduce<string[]>((acc, line) => acc.concat(line.split('\n')), [])
    .map(line => line.trimEnd())
    .filter(line => line.trim() && !/^[=\s]+$/.test(line))
    .slice(-max)

/**
 * Route everything written to process.stdout to stderr, and return a stream that writes to
 * the real stdout. The MCP stdio transport gets that stream; stray output from Portman,
 * Newman reporters or dependencies can no longer corrupt the protocol stream.
 */
export const reserveStdoutForProtocol = (): Writable => {
  const stdout = process.stdout
  const protocolWrite = stdout.write.bind(stdout) as (
    chunk: string | Uint8Array,
    cb: (err?: Error | null) => void
  ) => boolean
  stdout.write = ((...args: unknown[]): boolean =>
    (process.stderr.write as (...a: unknown[]) => boolean)(...args)) as never
  return new Writable({
    write(chunk, _encoding, callback): void {
      protocolWrite(chunk, callback)
    }
  })
}
