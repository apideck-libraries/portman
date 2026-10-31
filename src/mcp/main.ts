/**
 * Entry point of the `portman-mcp` bin: the Portman MCP server over stdio.
 *
 * stdout is reserved for MCP protocol messages. Everything else that writes to stdout
 * (Portman's console output, Newman reporters, dependencies) is sent to stderr, and
 * process.exit calls from Portman internals can never stop the server.
 */
import { StdioServerTransport } from '@modelcontextprotocol/server/stdio'
import { PortmanExitError, reserveStdoutForProtocol } from './isolation'
import { createServer } from './server'

const log = (message: string): void => {
  process.stderr.write(`[portman-mcp] ${message}\n`)
}

export const main = async (): Promise<void> => {
  const protocolOut = reserveStdoutForProtocol()

  // Outside of a tool call (e.g. a run that outlived its timeout), Portman's process.exit
  // must not stop the server either. The server itself exits through `shutdown`.
  const exit = process.exit.bind(process) as (code?: number) => never
  process.exit = ((code?: number | string | null) => {
    throw new PortmanExitError(Number(code ?? 0))
  }) as typeof process.exit

  process.on('uncaughtException', error => log(`Uncaught exception: ${error?.stack || error}`))
  process.on('unhandledRejection', reason => {
    if (reason instanceof PortmanExitError) return
    log(`Unhandled rejection: ${(reason as Error)?.stack || reason}`)
  })

  const server = createServer()
  const transport = new StdioServerTransport(process.stdin, protocolOut)

  let closing = false
  const shutdown = async (code = 0): Promise<void> => {
    if (closing) return
    closing = true
    try {
      await server.close()
    } finally {
      exit(code)
    }
  }
  transport.onclose = () => void shutdown(0)
  process.stdin.on('end', () => void shutdown(0))
  process.on('SIGINT', () => void shutdown(0))
  process.on('SIGTERM', () => void shutdown(0))

  await server.connect(transport)
  log('Portman MCP server running on stdio')
}

main().catch(error => {
  process.stderr.write(`[portman-mcp] Failed to start: ${error?.stack || error}\n`)
  process.exitCode = 1
})
