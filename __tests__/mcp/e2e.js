#!/usr/bin/env node
/**
 * End-to-end check of the built `portman-mcp` bin over stdio (run `npm run build` first).
 *
 *   node __tests__/mcp/e2e.js
 *
 * Starts a tiny mock API whose GET /pets/{id} response violates the spec, launches
 * bin/portman-mcp with the MCP SDK client, calls every tool and asserts the results.
 * Any non-protocol output on stdout makes the client report a parse error, which fails the run.
 */
const assert = require('assert')
const fs = require('fs')
const http = require('http')
const os = require('os')
const path = require('path')
const { Client } = require('@modelcontextprotocol/client')
const { StdioClientTransport } = require('@modelcontextprotocol/client/stdio')

const root = path.resolve(__dirname, '..', '..')
const spec = path.join(root, '__tests__/fixtures/mcp/pets.openapi.yml')

const startMockApi = () =>
  new Promise(resolve => {
    const requests = []
    const server = http.createServer((req, res) => {
      requests.push(`${req.method} ${req.url}`)
      const json = (status, body) => {
        res.writeHead(status, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify(body))
      }
      if (req.method === 'GET' && req.url === '/pets') return json(200, [{ id: '1', name: 'Rex' }])
      // Contract violation: id must be a string, name is required
      if (req.method === 'GET' && /^\/pets\/[^/]+$/.test(req.url)) return json(200, { id: 1 })
      return json(404, { message: 'Not found' })
    })
    server.listen(0, '127.0.0.1', () => resolve({ server, requests, port: server.address().port }))
  })

const main = async () => {
  const transcript = []
  const workDir = fs.mkdtempSync(path.join(os.tmpdir(), 'portman-mcp-e2e-'))
  const { server: api, requests, port } = await startMockApi()
  const baseUrl = `http://127.0.0.1:${port}`

  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [path.join(root, 'bin/portman-mcp')],
    cwd: workDir,
    stderr: 'pipe'
  })
  let stderr = ''
  transport.stderr.on('data', chunk => (stderr += chunk))

  const protocolErrors = []
  const client = new Client({ name: 'portman-e2e', version: '1.0.0' })
  client.onerror = error => protocolErrors.push(error)
  await client.connect(transport)

  const call = async (name, args) => {
    const started = Date.now()
    const result = await client.callTool({ name, arguments: args }, undefined, { timeout: 120000 })
    const data = JSON.parse(result.content[0].text)
    transcript.push({ name, isError: Boolean(result.isError), ms: Date.now() - started, data })
    return { isError: Boolean(result.isError), data }
  }

  try {
    const { tools } = await client.listTools()
    assert.deepStrictEqual(tools.map(t => t.name).sort(), [
      'explain_failure',
      'generate_collection',
      'list_operations',
      'run_contract_tests',
      'scaffold_config',
      'validate_config'
    ])
    assert.match(client.getInstructions(), /explain_failure/)
    transcript.push({ name: 'tools/list', data: tools.map(t => t.name) })

    // 1. list_operations
    const ops = await call('list_operations', { spec })
    assert.strictEqual(ops.isError, false)
    assert.deepStrictEqual(
      ops.data.operations.map(o => o.openApiOperation),
      ['GET::/pets', 'GET::/pets/{id}']
    )

    // 2. scaffold_config (writes into the server's cwd via a relative path)
    const scaffold = await call('scaffold_config', { spec, outputPath: 'portman-config.json' })
    assert.strictEqual(scaffold.isError, false)
    assert.strictEqual(
      scaffold.data.written,
      fs.realpathSync(path.join(workDir, 'portman-config.json'))
    )
    const again = await call('scaffold_config', { outputPath: 'portman-config.json' })
    assert.strictEqual(again.isError, true)

    // 3. validate_config: file + spec, and an invalid inline config
    const valid = await call('validate_config', { config: 'portman-config.json', spec })
    assert.strictEqual(valid.data.valid, true)
    assert.deepStrictEqual(valid.data.warnings, [])
    const invalid = await call('validate_config', {
      config: {
        version: 1,
        tests: { contractTests: [{ openApiOperation: '*::/*', jsonBody: true }] }
      }
    })
    assert.strictEqual(invalid.data.valid, false)
    assert.strictEqual(invalid.data.errors[0].path, 'tests.contractTests[0].jsonBody')

    // 4. generate_collection
    const gen = await call('generate_collection', {
      spec,
      config: 'portman-config.json',
      output: 'out/pets.postman.json'
    })
    assert.strictEqual(gen.isError, false)
    assert.strictEqual(gen.data.stats.requests, 2)
    assert.ok(fs.existsSync(path.join(workDir, 'out/pets.postman.json')))
    assert.strictEqual(requests.length, 0, 'generate_collection must not call the API')

    // process.exit inside Portman -> isError result, server keeps running
    const broken = await call('generate_collection', { spec: 'missing.yml', output: 'x.json' })
    assert.strictEqual(broken.isError, true)
    assert.match(broken.data.error, /exit code 1/)

    // 5. run_contract_tests
    const badUrl = await call('run_contract_tests', { spec, baseUrl: 'file:///etc/passwd' })
    assert.strictEqual(badUrl.isError, true)

    const run = await call('run_contract_tests', { spec, baseUrl, config: 'portman-config.json' })
    assert.strictEqual(run.isError, false)
    assert.strictEqual(run.data.passed, false)
    assert.strictEqual(run.data.summary.requests, 2)
    assert.ok(fs.existsSync(run.data.reportPath))
    const schemaFailure = run.data.failures.find(f => f.testType === 'schemaValidation')
    assert.ok(schemaFailure, 'expected a schemaValidation failure')
    assert.strictEqual(schemaFailure.openApiOperationId, 'getPet')
    assert.ok(
      run.data.failures.every(f => f.openApiOperationId === 'getPet'),
      'only GET /pets/{id} violates the contract'
    )
    assert.deepStrictEqual(requests.sort(), ['GET /pets', 'GET /pets/1'])

    // 6. explain_failure
    const explained = await call('explain_failure', {
      reportPath: run.data.reportPath,
      index: schemaFailure.index
    })
    assert.strictEqual(explained.isError, false)
    assert.strictEqual(explained.data.operation.operationId, 'getPet')
    assert.strictEqual(explained.data.expected.responseKey, '200')
    assert.deepStrictEqual(JSON.parse(explained.data.expected.schema).required, ['id', 'name'])
    assert.match(explained.data.hint, /Do not disable or weaken the Portman checks/)

    // Second run against a dead port: requestError failures, not a crash
    const dead = await call('run_contract_tests', {
      spec,
      baseUrl: 'http://127.0.0.1:9',
      abortOnFailure: true
    })
    assert.strictEqual(dead.isError, false)
    assert.strictEqual(dead.data.passed, false)
    assert.strictEqual(dead.data.failures[0].failureType, 'requestError')

    // Server still alive after everything
    assert.strictEqual((await call('list_operations', { spec })).isError, false)

    assert.deepStrictEqual(protocolErrors, [], 'stdout must only carry MCP messages')
    assert.match(stderr, /Portman MCP server running on stdio/)
    assert.match(stderr, /Run Newman against/, 'Portman console output goes to stderr')
  } finally {
    await client.close()
    await new Promise(resolve => api.close(resolve))
  }

  console.log('Transcript summary')
  for (const entry of transcript) {
    const d = entry.data || {}
    let detail = ''
    if (entry.name === 'tools/list') detail = d.join(', ')
    else if (entry.isError) detail = `isError: ${d.error}`
    else if (entry.name === 'list_operations') detail = `${d.count} operations`
    else if (entry.name === 'scaffold_config') detail = `written: ${d.written}`
    else if (entry.name === 'validate_config')
      detail = `valid: ${d.valid}, errors: ${d.errors.length}, warnings: ${d.warnings.length}`
    else if (entry.name === 'generate_collection')
      detail = `${d.stats.requests} requests, ${d.stats.assertions} assertions`
    else if (entry.name === 'run_contract_tests')
      detail = `passed: ${d.passed}, requests: ${d.summary.requests}, assertions: ${d.summary.assertions}, failures: ${d.summary.failures} [${d.failures.map(f => f.testType || f.failureType).join(', ')}]`
    else if (entry.name === 'explain_failure')
      detail = `${d.operation.openApiOperation} ${d.failure.testType}, expected ${d.expected.responseKey} ${d.expected.contentTypes.join(',')}`
    console.log(`- ${entry.name}${entry.ms !== undefined ? ` (${entry.ms} ms)` : ''}: ${detail}`)
  }
  console.log(`Mock API requests: ${requests.join(', ')}`)
  console.log(
    `Protocol errors: ${protocolErrors.length}; server stderr lines: ${stderr.split('\n').length}`
  )
  console.log('E2E OK')
  fs.rmSync(workDir, { recursive: true, force: true })
}

main().catch(error => {
  console.error(error)
  process.exit(1)
})
