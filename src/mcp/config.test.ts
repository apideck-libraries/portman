import {
  buildScaffoldConfig,
  findUnmatchedTargets,
  loadConfigInput,
  validateConfigData
} from './config'
import { loadSpec } from './openapi'

describe('MCP validate_config', () => {
  it('accepts a valid config file', async () => {
    const { data, source } = await loadConfigInput(
      './examples/testsuite-contract-tests/portman-config.crm.json'
    )
    expect(source).toMatch(/portman-config\.crm\.json$/)
    const result = await validateConfigData(data)
    expect(result.valid).toBe(true)
    expect(result.errors).toEqual([])
  })

  it('accepts a YAML config file', async () => {
    const { data } = await loadConfigInput(
      './examples/testsuite-contract-tests/portman-config.crm.yml'
    )
    expect((await validateConfigData(data)).valid).toBe(true)
  })

  it('returns errors with JSON paths for an invalid inline config', async () => {
    const result = await validateConfigData({
      version: 1,
      tests: {
        contractTests: [{ openApiOperation: '*::/*', statusSuccess: { enabled: 'yes' } }]
      },
      unknownKey: true
    })
    expect(result.valid).toBe(false)
    const paths = result.errors.map(error => error.path)
    expect(paths).toContain('tests.contractTests[0].statusSuccess.enabled')
    expect(paths).toContain('(root)')
    result.errors.forEach(error => expect(error.message).toEqual(expect.any(String)))
  })

  it('parses a config passed as a JSON string', async () => {
    const { data, source } = await loadConfigInput('{"version": 1}')
    expect(source).toBe('inline')
    expect((await validateConfigData(data)).valid).toBe(true)
  })

  it('rejects a missing config file and non-object configs', async () => {
    await expect(loadConfigInput('./nope/portman-config.json')).rejects.toThrow(/not found/)
    expect((await validateConfigData([])).valid).toBe(false)
  })

  it('warns about targets that match no operation in the spec', async () => {
    const parser = await loadSpec('./examples/testsuite-contract-tests/crm.openapi.yml')
    const warnings = findUnmatchedTargets(
      {
        tests: {
          contractTests: [
            { openApiOperation: '*::/crm/*', statusSuccess: { enabled: true } },
            { openApiOperationId: 'leadsOne', statusSuccess: { enabled: true } },
            { openApiOperationId: 'petsOne', statusSuccess: { enabled: true } },
            { openApiOperationIds: ['leadsAll', 'nope'], statusSuccess: { enabled: true } }
          ]
        }
      },
      parser
    )
    expect(warnings).toEqual([
      {
        path: 'tests.contractTests[2].openApiOperationId',
        message: 'No operation with operationId "petsOne"'
      },
      {
        path: 'tests.contractTests[3].openApiOperationIds[1]',
        message: 'No operation matches "nope"'
      }
    ])
  })
})

describe('MCP scaffold_config', () => {
  it('builds a valid config with the default checks', async () => {
    const config = buildScaffoldConfig()
    expect(config).toEqual({
      $schema: 'https://getportman.com/schema/portman-config.json',
      version: 1,
      tests: {
        contractTests: [
          {
            openApiOperation: '*::/*',
            statusSuccess: { enabled: true },
            contentType: { enabled: true },
            jsonBody: { enabled: true },
            schemaValidation: { enabled: true }
          }
        ]
      }
    })
    expect((await validateConfigData(config)).valid).toBe(true)
  })

  it('adds responseTime only when a limit is given', async () => {
    const config = buildScaffoldConfig({ checks: ['statusSuccess'], responseTimeMaxMs: 500 })
    const [contractTest] = (config.tests as { contractTests: Record<string, unknown>[] })
      .contractTests
    expect(contractTest).toEqual({
      openApiOperation: '*::/*',
      statusSuccess: { enabled: true },
      responseTime: { enabled: true, maxMs: 500 }
    })
    expect((await validateConfigData(config)).valid).toBe(true)
    expect(() => buildScaffoldConfig({ checks: ['responseTime'] })).toThrow(/responseTimeMaxMs/)
  })
})
