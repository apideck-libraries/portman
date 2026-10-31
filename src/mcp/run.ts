import fs from 'fs-extra'
import { NewmanRunOptions } from 'newman'
import os from 'os'
import path from 'path'
import {
  CollectionDefinition,
  EventDefinition,
  ItemDefinition,
  ItemGroupDefinition
} from 'postman-collection'
import { JsonReport, JsonReportFailure } from '../application/newman/jsonReport'
import { OpenApiFormatter } from '../oas'
import { Portman } from '../Portman'
import { PortmanOptions } from '../types/PortmanOptions'
import { ConfigInput, ConfigIssue, loadConfigInput, validateConfigData } from './config'
import { isUrl, resolveSpecLocation } from './openapi'

/** Package root, from both src/mcp (ts-jest) and dist/mcp (published build) */
const PACKAGE_ROOT = path.resolve(__dirname, '..', '..')
export const DEFAULT_PORTMAN_CONFIG = path.join(PACKAGE_ROOT, 'portman-config.default.json')
export const DEFAULT_POSTMAN_CONFIG = path.join(PACKAGE_ROOT, 'postman-config.default.json')

export const DEFAULT_TIMEOUT_SECONDS = 600
export const MAX_TIMEOUT_SECONDS = 1800
export const MAX_FAILURES_RETURNED = 50
const BODY_PREVIEW_LIMIT = 500

/** CLI options that the MCP tools control themselves, or deliberately never use */
const IGNORED_CLI_OPTIONS = [
  'url',
  'local',
  'oaUrl',
  'oaLocal',
  'baseUrl',
  'output',
  'runNewman',
  'jsonReport',
  'syncPostman',
  'uploadOnly',
  'postmanUid',
  'postmanWorkspaceName',
  'postmanFastSync',
  'postmanRefreshCache',
  'syncPostmanCollectionIds',
  'init',
  'localPostman'
]

export class ToolInputError extends Error {
  public readonly details?: unknown

  constructor(message: string, details?: unknown) {
    super(message)
    this.name = 'ToolInputError'
    this.details = details
    Object.setPrototypeOf(this, ToolInputError.prototype)
  }
}

export const assertHttpUrl = (value: string, name: string): string => {
  let parsed: URL
  try {
    parsed = new URL(value)
  } catch (_e) {
    throw new ToolInputError(`${name} must be an absolute http(s) URL, got "${value}"`)
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new ToolInputError(`${name} must use http or https, got "${parsed.protocol}"`)
  }
  return value.replace(/\/+$/, '')
}

const loadCliOptionsFile = async (cliOptionsFile?: string): Promise<Partial<PortmanOptions>> => {
  if (!cliOptionsFile) return {}
  const formatter = new OpenApiFormatter()
  const location = isUrl(cliOptionsFile) ? cliOptionsFile : path.resolve(cliOptionsFile)
  let cliOptions: Partial<PortmanOptions>
  try {
    cliOptions = (await formatter.parseFile(location)) as Partial<PortmanOptions>
  } catch (err) {
    throw new ToolInputError(`Unable to read the Portman CLI options file "${location}": ${err}`)
  }

  // Same precedence as the CLI: newmanOptionsFile replaces newmanRunOptions from the file
  if (cliOptions.newmanOptionsFile) {
    try {
      cliOptions.newmanRunOptions = (await formatter.parseFile(
        cliOptions.newmanOptionsFile
      )) as unknown as Partial<NewmanRunOptions>
    } catch (err) {
      throw new ToolInputError(
        `Unable to read the Newman options file "${cliOptions.newmanOptionsFile}": ${err}`
      )
    }
  } else if (typeof cliOptions.newmanRunOptions === 'string') {
    cliOptions.newmanRunOptions = JSON.parse(cliOptions.newmanRunOptions)
  }

  IGNORED_CLI_OPTIONS.forEach(key => delete cliOptions[key])
  return cliOptions
}

export interface PortmanRunInput {
  spec: string
  config?: ConfigInput
  cliOptionsFile?: string
  envFile?: string
  baseUrl?: string
  /** Where the Postman collection is written */
  output: string
  workDir: string
  runNewman: boolean
  jsonReport?: string
  /** Newman options that take precedence over the CLI options file (e.g. abortOnFailure) */
  newmanRunOptions?: Record<string, unknown>
}

/**
 * Translate tool input into the PortmanOptions the CLI would build (see src/index.ts),
 * with Postman sync always off. Validates the Portman config up front, so the agent gets
 * structured errors instead of Portman's console output.
 */
export const buildPortmanOptions = async (input: PortmanRunInput): Promise<PortmanOptions> => {
  const cliOptions = await loadCliOptionsFile(input.cliOptionsFile)
  const spec = resolveSpecLocation(input.spec)

  let portmanConfigPath = cliOptions.portmanConfigFile
    ? path.resolve(cliOptions.portmanConfigFile)
    : DEFAULT_PORTMAN_CONFIG
  if (input.config !== undefined) {
    const { data, source } = await loadConfigInput(input.config)
    if (source === 'inline') {
      portmanConfigPath = path.join(input.workDir, 'portman-config.json')
      await fs.outputJson(portmanConfigPath, data, { spaces: 2 })
    } else {
      portmanConfigPath = source
    }
  }

  const { data: configData } = await loadConfigInput(portmanConfigPath)
  const validation = await validateConfigData(configData)
  if (!validation.valid) {
    throw new ToolInputError(`Invalid Portman config (${portmanConfigPath})`, validation.errors)
  }

  const postmanConfigPath = cliOptions.postmanConfigFile
    ? path.resolve(cliOptions.postmanConfigFile)
    : DEFAULT_POSTMAN_CONFIG

  const userNewmanOptions = (cliOptions.newmanRunOptions || {}) as Partial<NewmanRunOptions>
  const newmanRunOptions = { ...userNewmanOptions, ...(input.newmanRunOptions || {}) }

  return {
    ...cliOptions,
    oaUrl: isUrl(spec) ? spec : '',
    oaLocal: isUrl(spec) ? '' : spec,
    baseUrl: input.baseUrl || '',
    output: input.output,
    includeTests: cliOptions.includeTests ?? true,
    bundleContractTests: cliOptions.bundleContractTests ?? false,
    runNewman: input.runNewman,
    jsonReport: input.jsonReport,
    newmanRunOptions,
    newmanIterationData: cliOptions.newmanIterationData || '',
    syncPostman: false,
    portmanConfigFile: portmanConfigPath,
    portmanConfigPath,
    postmanConfigFile: postmanConfigPath,
    postmanConfigPath,
    envFile: input.envFile || cliOptions.envFile || '.env',
    filterFile: cliOptions.filterFile,
    oaOutput: cliOptions.oaOutput || '',
    collectionName: cliOptions.collectionName || '',
    warn: false,
    extraUnknownFormats: cliOptions.extraUnknownFormats || [],
    syncPostmanCollectionIds: false
  }
}

export interface CollectionStats {
  requests: number
  requestsWithTests: number
  assertions: number
}

/** Count requests, requests with a test script, and pm.test() assertions in a collection */
export const collectionStats = (collection: CollectionDefinition | undefined): CollectionStats => {
  const stats: CollectionStats = { requests: 0, requestsWithTests: 0, assertions: 0 }
  const walk = (items: (ItemDefinition | ItemGroupDefinition)[] | undefined): void => {
    ;(items || []).forEach(item => {
      if ((item as ItemGroupDefinition).item) {
        walk((item as ItemGroupDefinition).item)
        return
      }
      stats.requests++
      const events = ((item as { event?: EventDefinition[] }).event || []) as EventDefinition[]
      const testScript = events
        .filter(event => event.listen === 'test')
        .map(event => {
          const script = event.script as { exec?: string | string[] } | string | undefined
          const exec = typeof script === 'string' ? script : script?.exec
          return Array.isArray(exec) ? exec.join('\n') : String(exec || '')
        })
        .join('\n')
      const assertions = (testScript.match(/pm\.test\(/g) || []).length
      if (assertions > 0) stats.requestsWithTests++
      stats.assertions += assertions
    })
  }
  walk(collection?.item as (ItemDefinition | ItemGroupDefinition)[])
  return stats
}

export interface GenerateResult {
  output: string
  collectionName: string | null
  stats: CollectionStats
  /** Config targets Portman could not find in the spec */
  missingTargets: { openApiOperationIds: string[]; openApiOperations: string[] }
}

export const generateWithPortman = async (options: PortmanOptions): Promise<GenerateResult> => {
  const portman = new Portman(options)
  await portman.run()
  if (!portman.collectionFile) {
    throw new Error('Portman did not write a collection')
  }
  const track = portman.testSuite?.track
  return {
    output: path.resolve(portman.collectionFile),
    collectionName: portman.portmanCollection?.info?.name || null,
    stats: collectionStats(portman.portmanCollection),
    missingTargets: {
      openApiOperationIds: Array.from(new Set(track?.openApiOperationIds || [])),
      openApiOperations: Array.from(new Set(track?.openApiOperations || []))
    }
  }
}

export const createWorkDir = (): Promise<string> =>
  fs.mkdtemp(path.join(os.tmpdir(), 'portman-mcp-'))

export const readReport = async (reportPath: string): Promise<JsonReport> => {
  const report = (await fs.readJson(path.resolve(reportPath))) as JsonReport
  if (!report || typeof report !== 'object' || !Array.isArray(report.failures)) {
    throw new ToolInputError(`${reportPath} is not a Portman JSON report`)
  }
  return report
}

export interface FailurePreview extends Omit<JsonReportFailure, 'response'> {
  index: number
  response: {
    status: number
    responseTime: number
    bodyPreview: string | null
    bodyTruncated: boolean
  } | null
}

/** Report failures for a tool result: indexed, capped, and with a short body preview */
export const previewFailures = (
  report: JsonReport,
  max = MAX_FAILURES_RETURNED
): FailurePreview[] =>
  report.failures.slice(0, max).map((failure, index) => {
    const { response, ...rest } = failure
    const body = response?.body ?? null
    return {
      index,
      ...rest,
      response: response
        ? {
            status: response.status,
            responseTime: response.responseTime,
            bodyPreview:
              body && body.length > BODY_PREVIEW_LIMIT ? body.slice(0, BODY_PREVIEW_LIMIT) : body,
            bodyTruncated: response.bodyTruncated || (body?.length || 0) > BODY_PREVIEW_LIMIT
          }
        : null
    }
  })

/** Error raised when a promise does not settle in time */
export class ToolTimeoutError extends Error {
  constructor(seconds: number) {
    super(`Timed out after ${seconds}s`)
    this.name = 'ToolTimeoutError'
    Object.setPrototypeOf(this, ToolTimeoutError.prototype)
  }
}

export const withTimeout = <T>(promise: Promise<T>, seconds: number): Promise<T> => {
  let timer: NodeJS.Timeout | undefined
  const timeout = new Promise<never>((_resolve, reject) => {
    timer = setTimeout(() => reject(new ToolTimeoutError(seconds)), seconds * 1000)
  })
  return Promise.race([promise, timeout]).finally(() => timer && clearTimeout(timer))
}

export type { ConfigIssue }
