import { Client } from '@modelcontextprotocol/client'
import { InMemoryTransport } from '@modelcontextprotocol/server'
import fs from 'fs-extra'
import os from 'os'
import path from 'path'
import { createServer } from './server'

const petsSpec = './__tests__/fixtures/mcp/pets.openapi.yml'

type TextResult = { isError?: boolean; content: { type: string; text: string }[] }

describe('Portman MCP server', () => {
  let client: Client
  let tmpDir: string
  const stderrWrite = process.stderr.write

  const call = async (name: string, args: Record<string, unknown>) => {
    const result = (await client.callTool({ name, arguments: args })) as TextResult
    return { isError: Boolean(result.isError), data: JSON.parse(result.content[0].text) }
  }

  beforeAll(async () => {
    // Portman logs a lot; the server mirrors it to stderr
    process.stderr.write = jest.fn(() => true) as never
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'portman-mcp-test-'))
    const server = createServer()
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair()
    client = new Client({ name: 'test', version: '1.0.0' })
    await Promise.all([server.connect(serverTransport), client.connect(clientTransport)])
  })

  afterAll(async () => {
    await client.close()
    await fs.remove(tmpDir)
    process.stderr.write = stderrWrite
  })

  it('exposes the tools with annotations and the workflow instructions', async () => {
    const { tools } = await client.listTools()
    const byName = Object.fromEntries(tools.map(tool => [tool.name, tool]))
    expect(Object.keys(byName).sort()).toEqual([
      'explain_failure',
      'generate_collection',
      'list_operations',
      'run_contract_tests',
      'scaffold_config',
      'validate_config'
    ])
    expect(byName.list_operations.annotations?.readOnlyHint).toBe(true)
    expect(byName.validate_config.annotations?.readOnlyHint).toBe(true)
    expect(byName.explain_failure.annotations?.readOnlyHint).toBe(true)
    expect(byName.run_contract_tests.annotations).toMatchObject({
      readOnlyHint: false,
      destructiveHint: true,
      openWorldHint: true
    })
    expect(byName.run_contract_tests.inputSchema.required).toEqual(['spec', 'baseUrl'])
    expect(client.getInstructions()).toMatch(/list_operations[\s\S]*run_contract_tests/)
    expect(client.getInstructions()).toMatch(/https:\/\/getportman\.com\/mcp/)
  })

  it('lists operations', async () => {
    const { isError, data } = await call('list_operations', { spec: petsSpec })
    expect(isError).toBe(false)
    expect(data.count).toBe(2)
    expect(data.operations[1]).toMatchObject({
      openApiOperation: 'GET::/pets/{id}',
      operationId: 'getPet',
      responseStatusCodes: ['200', '404']
    })
  })

  it('validates configs without failing the tool call', async () => {
    const invalid = await call('validate_config', {
      config: { version: 1, tests: { contractTests: [{ statusSuccess: { enabled: 1 } }] } }
    })
    expect(invalid.isError).toBe(false)
    expect(invalid.data.valid).toBe(false)
    expect(invalid.data.errors[0].path).toBe('tests.contractTests[0].statusSuccess.enabled')

    const withSpec = await call('validate_config', {
      config: { version: 1, tests: { contractTests: [{ openApiOperationId: 'nope' }] } },
      spec: petsSpec
    })
    expect(withSpec.data.valid).toBe(true)
    expect(withSpec.data.warnings).toHaveLength(1)
  })

  it('scaffolds a config and never overwrites without overwrite: true', async () => {
    const outputPath = path.join(tmpDir, 'portman-config.json')
    const first = await call('scaffold_config', { outputPath, responseTimeMaxMs: 300 })
    expect(first.isError).toBe(false)
    expect(first.data.written).toBe(outputPath)
    expect((await fs.readJson(outputPath)).tests.contractTests[0].responseTime).toEqual({
      enabled: true,
      maxMs: 300
    })

    const second = await call('scaffold_config', { outputPath })
    expect(second.isError).toBe(true)
    expect(second.data.error).toMatch(/already exists/)

    const third = await call('scaffold_config', { outputPath, overwrite: true })
    expect(third.isError).toBe(false)
    expect((await fs.readJson(outputPath)).tests.contractTests[0].responseTime).toBeUndefined()
  })

  it('generates a collection with contract tests', async () => {
    const output = path.join(tmpDir, 'pets.postman.json')
    const { isError, data } = await call('generate_collection', {
      spec: petsSpec,
      config: path.join(tmpDir, 'portman-config.json'),
      output
    })
    expect(isError).toBe(false)
    expect(data.output).toBe(output)
    expect(data.stats.requests).toBe(2)
    expect(data.stats.requestsWithTests).toBe(2)
    expect(data.stats.assertions).toBeGreaterThanOrEqual(8)
    expect(await fs.pathExists(output)).toBe(true)
  }, 30000)

  it('returns an isError result when Portman calls process.exit, and keeps serving', async () => {
    const realExit = process.exit
    const { isError, data } = await call('generate_collection', {
      spec: './__tests__/fixtures/mcp/missing.yml',
      output: path.join(tmpDir, 'missing.json')
    })
    expect(isError).toBe(true)
    expect(data.error).toBe('Portman stopped with exit code 1')
    expect(data.log.join('\n')).toMatch(/Local OAS error/)
    expect(process.exit).toBe(realExit)

    // the server is still alive
    expect((await call('list_operations', { spec: petsSpec })).isError).toBe(false)
  }, 30000)

  it('rejects invalid input before running anything', async () => {
    const badUrl = await call('run_contract_tests', { spec: petsSpec, baseUrl: 'ftp://localhost' })
    expect(badUrl.isError).toBe(true)
    expect(badUrl.data.error).toMatch(/http or https/)

    const badConfig = await call('run_contract_tests', {
      spec: petsSpec,
      baseUrl: 'http://localhost:1',
      config: { version: 'one' }
    })
    expect(badConfig.isError).toBe(true)
    expect(badConfig.data.error).toMatch(/Invalid Portman config/)
    expect(badConfig.data.details[0].path).toBe('version')

    const badIndex = await call('explain_failure', {
      reportPath: './__tests__/fixtures/mcp/report.json',
      index: 3
    })
    expect(badIndex.isError).toBe(true)
    expect(badIndex.data.error).toMatch(/out of range/)
  })
})
