import fs from 'fs-extra'
import path from 'path'
import { McpServer } from '@modelcontextprotocol/server'
import type { CallToolResult } from '@modelcontextprotocol/server'
import { z } from 'zod'
import { getPortmanVersion } from '../application/newman/jsonReport'
import { OpenApiParser } from '../oas'
import {
  buildScaffoldConfig,
  CONTRACT_CHECKS,
  findUnmatchedTargets,
  loadConfigInput,
  validateConfigData
} from './config'
import { explainFailure } from './explain'
import { isolate, PortmanExitError, tailLogs } from './isolation'
import {
  assertHttpUrl,
  buildPortmanOptions,
  createWorkDir,
  DEFAULT_TIMEOUT_SECONDS,
  generateWithPortman,
  MAX_FAILURES_RETURNED,
  MAX_TIMEOUT_SECONDS,
  previewFailures,
  readReport,
  ToolInputError,
  ToolTimeoutError,
  withTimeout
} from './run'
import { listOperations, loadSpec, specInfo } from './openapi'

export const SERVER_INSTRUCTIONS = `Portman turns an OpenAPI spec into a Postman collection with contract tests and runs it with Newman against a live API, locally.

Recommended workflow:
1. list_operations: see what the spec defines (operations, operationIds, documented status codes).
2. scaffold_config to create a starter portman-config.json, or validate_config to check an existing one (pass spec to also catch targets that match no operation).
3. run_contract_tests against a local, staging or mock API (baseUrl). It sends real requests, including POST/PUT/PATCH/DELETE, only to that baseUrl. It returns a summary, the failures and the path of a JSON report.
4. explain_failure with that reportPath and a failure index, to get the OpenAPI operation, the expected response schema and a next step.
generate_collection only writes the Postman collection, without running it.

When a test fails, fix the API implementation, or change the spec only when the current behaviour is the intended contract. Never disable or loosen Portman checks to make tests pass.

Relative paths are resolved against the server's working directory. Docs: https://getportman.com/docs (also available as a Docs MCP server: https://getportman.com/mcp).`

type ToolResult = CallToolResult

const textResult = (data: unknown): ToolResult => ({
  content: [{ type: 'text', text: JSON.stringify(data, null, 2) }]
})

const errorResult = (message: string, extra: Record<string, unknown> = {}): ToolResult => ({
  isError: true,
  content: [{ type: 'text', text: JSON.stringify({ error: message, ...extra }, null, 2) }]
})

/**
 * Run a tool handler isolated from the MCP transport: process.exit and console output from
 * Portman internals are intercepted, and every error becomes an isError tool result.
 */
export const runTool = async (handler: () => Promise<ToolResult>): Promise<ToolResult> => {
  const { value, error, logs } = await isolate(handler)
  if (!error && value) return value

  if (error instanceof ToolInputError) {
    return errorResult(error.message, error.details ? { details: error.details } : {})
  }
  if (error instanceof PortmanExitError) {
    return errorResult(`Portman stopped with exit code ${error.code}`, { log: tailLogs(logs) })
  }
  const message = error instanceof Error ? error.message : String(error)
  return errorResult(message, { log: tailLogs(logs) })
}

const specParam = z
  .string()
  .min(1)
  .describe('OpenAPI spec (JSON or YAML): a local file path or an http(s) URL')

const configParam = z
  .union([z.string().min(1), z.record(z.string(), z.unknown())])
  .describe(
    'Portman config: a path to portman-config.json/.yaml, or the config as an inline JSON object'
  )

const cliOptionsFileParam = z
  .string()
  .min(1)
  .describe(
    'Optional Portman CLI options file (JSON/YAML), as used by `portman --cliOptionsFile`. ' +
      'Postman sync options in it are ignored.'
  )

export const createServer = (): McpServer => {
  const server = new McpServer(
    { name: 'portman', title: 'Portman', version: getPortmanVersion() },
    { instructions: SERVER_INSTRUCTIONS }
  )

  server.registerTool(
    'list_operations',
    {
      title: 'List OpenAPI operations',
      description:
        'Parse an OpenAPI spec with Portman and list its operations: method, path, ' +
        'openApiOperation target ("GET::/pets/{id}"), operationId, summary, tags and ' +
        'documented response status codes. Use the openApiOperation or operationId values ' +
        'as targets in a Portman config.',
      inputSchema: { spec: specParam },
      annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: true }
    },
    async ({ spec }) =>
      runTool(async () => {
        const parser = await loadSpec(spec)
        const operations = listOperations(parser)
        return textResult({ spec, ...specInfo(parser), count: operations.length, operations })
      })
  )

  server.registerTool(
    'validate_config',
    {
      title: 'Validate a Portman config',
      description:
        "Validate a Portman config against Portman's JSON schema. Returns valid plus " +
        'human-readable errors with JSON paths. Pass spec to also get warnings for targets ' +
        '(openApiOperation, openApiOperationId(s), excludeForOperations) that match no operation.',
      inputSchema: {
        config: configParam,
        spec: specParam.optional()
      },
      annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false }
    },
    async ({ config, spec }) =>
      runTool(async () => {
        const { data, source } = await loadConfigInput(config)
        const result = await validateConfigData(data)
        const warnings = spec ? findUnmatchedTargets(data, await loadSpec(spec)) : []
        return textResult({ valid: result.valid, source, errors: result.errors, warnings })
      })
  )

  server.registerTool(
    'scaffold_config',
    {
      title: 'Scaffold a Portman config',
      description:
        'Create a starter portman-config.json with one contract test entry for all operations ' +
        '("*::/*"). Default checks: statusSuccess, contentType, jsonBody, schemaValidation; ' +
        'responseTime is added when responseTimeMaxMs is set. The config is validated before it ' +
        'is returned. It is only written when outputPath is set, and an existing file is only ' +
        'replaced with overwrite: true.',
      inputSchema: {
        spec: specParam
          .optional()
          .describe(
            'Optional OpenAPI spec, used to check that the spec parses and to count operations'
          ),
        checks: z
          .array(z.enum(CONTRACT_CHECKS))
          .optional()
          .describe('Contract checks to enable for every operation'),
        responseTimeMaxMs: z
          .number()
          .int()
          .positive()
          .optional()
          .describe('Enable the responseTime check with this limit in milliseconds'),
        outputPath: z
          .string()
          .min(1)
          .optional()
          .describe('Write the config to this path (JSON). Without it, nothing is written.'),
        overwrite: z
          .boolean()
          .optional()
          .describe('Replace outputPath if it already exists (default false)')
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: true,
        openWorldHint: false
      }
    },
    async ({ spec, checks, responseTimeMaxMs, outputPath, overwrite }) =>
      runTool(async () => {
        let config: Record<string, unknown>
        try {
          config = buildScaffoldConfig({ checks, responseTimeMaxMs })
        } catch (err) {
          throw new ToolInputError((err as Error).message)
        }
        const validation = await validateConfigData(config)
        if (!validation.valid) {
          throw new ToolInputError('The generated config is invalid', validation.errors)
        }

        const operations = spec ? listOperations(await loadSpec(spec)).length : undefined

        let written: string | null = null
        if (outputPath) {
          const target = path.resolve(outputPath)
          if ((await fs.pathExists(target)) && !overwrite) {
            throw new ToolInputError(
              `${target} already exists. Pass overwrite: true to replace it, or choose another outputPath.`
            )
          }
          await fs.outputFile(target, JSON.stringify(config, null, 2) + '\n')
          written = target
        }

        return textResult({
          valid: true,
          written,
          ...(operations !== undefined ? { operations } : {}),
          config
        })
      })
  )

  server.registerTool(
    'generate_collection',
    {
      title: 'Generate the Postman collection',
      description:
        'Generate the Postman collection with Portman tests from an OpenAPI spec and a ' +
        'Portman config, without running it. Writes the collection to output (overwritten if it ' +
        'exists) and returns request and assertion counts. No HTTP requests are made to an API.',
      inputSchema: {
        spec: specParam,
        config: configParam.optional(),
        output: z.string().min(1).describe('Path of the Postman collection to write (.json)'),
        cliOptionsFile: cliOptionsFileParam.optional()
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: true,
        openWorldHint: true
      }
    },
    async ({ spec, config, output, cliOptionsFile }) =>
      runTool(async () => {
        if (!output.endsWith('.json')) throw new ToolInputError('output must be a .json file path')
        const workDir = await createWorkDir()
        const options = await buildPortmanOptions({
          spec,
          config,
          cliOptionsFile,
          output: path.resolve(output),
          workDir,
          runNewman: false
        })
        const result = await generateWithPortman(options)
        await fs.remove(workDir)
        return textResult(result)
      })
  )

  server.registerTool(
    'run_contract_tests',
    {
      title: 'Run contract tests',
      description:
        'Generate the Portman collection and run it with Newman against baseUrl. This sends real ' +
        'HTTP requests, including POST/PUT/PATCH/DELETE, to baseUrl only: use a local, staging or ' +
        'mock server, never production data you cannot lose. Returns the summary, up to ' +
        `${MAX_FAILURES_RETURNED} failures (each with an index for explain_failure) and the path ` +
        'of the full JSON report. Test failures are a normal result, not a tool error.',
      inputSchema: {
        spec: specParam,
        baseUrl: z.string().min(1).describe('Base URL of the API under test (http or https)'),
        config: configParam.optional(),
        envFile: z
          .string()
          .min(1)
          .optional()
          .describe('.env file with PORTMAN_* variables injected as collection variables'),
        cliOptionsFile: cliOptionsFileParam.optional(),
        abortOnFailure: z
          .boolean()
          .optional()
          .describe(
            'Stop at the first failure (default false: run everything and report all failures)'
          ),
        timeoutSeconds: z
          .number()
          .int()
          .positive()
          .max(MAX_TIMEOUT_SECONDS)
          .optional()
          .describe(`Timeout for the whole run (default ${DEFAULT_TIMEOUT_SECONDS})`)
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: false,
        openWorldHint: true
      }
    },
    async ({ spec, baseUrl, config, envFile, cliOptionsFile, abortOnFailure, timeoutSeconds }) =>
      runTool(async () => {
        const target = assertHttpUrl(baseUrl, 'baseUrl')
        const timeout = timeoutSeconds || DEFAULT_TIMEOUT_SECONDS
        const workDir = await createWorkDir()
        const reportPath = path.join(workDir, 'report.json')
        const collectionPath = path.join(workDir, 'collection.json')

        const options = await buildPortmanOptions({
          spec,
          config,
          cliOptionsFile,
          envFile,
          baseUrl: target,
          output: collectionPath,
          workDir,
          runNewman: true,
          jsonReport: reportPath,
          newmanRunOptions: {
            abortOnFailure: abortOnFailure ?? false,
            // Newman's own run timeout; the outer timeout below also covers collection generation
            timeout: timeout * 1000
          }
        })
        // Newman's CLI reporter would only add noise to stderr; the JSON report has the results
        const reporters = ([] as string[])
          .concat((options.newmanRunOptions as { reporters?: string | string[] })?.reporters || [])
          .filter(reporter => reporter !== 'cli')
        options.newmanRunOptions = { ...(options.newmanRunOptions as object), reporters }

        let runError: unknown
        try {
          await withTimeout(generateWithPortman(options), timeout + 30)
        } catch (err) {
          // A failing Newman run makes Portman call process.exit(1): the report is still written
          runError = err
        }

        if (!(await fs.pathExists(reportPath))) {
          if (runError instanceof ToolTimeoutError) {
            throw new Error(`run_contract_tests timed out after ${timeout}s`)
          }
          throw runError || new Error('Newman did not write a report')
        }

        const report = await readReport(reportPath)
        const failures = previewFailures(report)
        return textResult({
          passed: report.summary.passed,
          summary: report.summary,
          runError: report.runError,
          baseUrl: report.baseUrl,
          spec: report.spec,
          reportPath,
          collectionPath,
          failuresReturned: failures.length,
          failuresTruncated: report.failures.length > failures.length,
          failures,
          next: report.summary.passed
            ? 'All contract tests passed.'
            : 'Call explain_failure with reportPath and a failure index for the expected response and a next step.'
        })
      })
  )

  server.registerTool(
    'explain_failure',
    {
      title: 'Explain a contract test failure',
      description:
        'Explain one failure from a run_contract_tests report: the failure, the OpenAPI ' +
        'operation it maps to, the expected response (status codes, content types, response ' +
        'schema for the failing status) and a short next step.',
      inputSchema: {
        reportPath: z.string().min(1).describe('reportPath returned by run_contract_tests'),
        index: z.number().int().min(0).describe('Failure index from the run_contract_tests result'),
        spec: specParam
          .optional()
          .describe('OpenAPI spec to use instead of the one recorded in the report')
      },
      annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false }
    },
    async ({ reportPath, index, spec }) =>
      runTool(async () => {
        const report = await readReport(reportPath)
        if (index >= report.failures.length) {
          throw new ToolInputError(
            `index ${index} is out of range: the report has ${report.failures.length} failure(s)`
          )
        }
        const specLocation = spec || report.spec
        let parser: OpenApiParser | null = null
        if (specLocation) {
          try {
            parser = await loadSpec(specLocation)
          } catch (_e) {
            parser = null
          }
        }
        return textResult(explainFailure(report, path.resolve(reportPath), index, parser))
      })
  )

  return server
}
