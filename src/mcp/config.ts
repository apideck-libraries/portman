import * as Either from 'fp-ts/lib/Either'
import fs from 'fs-extra'
import path from 'path'
import { OpenApiFormatter, OpenApiParser } from '../oas'
import { PortmanConfig } from '../types'
import { parsePortmanConfig } from '../utils/PortmanConfig.parse'
import { validate } from '../utils/PortmanConfig.validator'

export const PORTMAN_CONFIG_SCHEMA_URL = 'https://getportman.com/schema/portman-config.json'

export type ConfigInput = string | Record<string, unknown>

export interface ConfigIssue {
  /** JSON path of the offending value, e.g. "tests.contractTests[0].statusSuccess" */
  path: string
  message: string
  suggestion?: string
}

export interface ConfigValidationResult {
  valid: boolean
  source: string
  errors: ConfigIssue[]
  /** Targets that match no operation in the spec (only when a spec is passed) */
  warnings: ConfigIssue[]
}

/** Load a Portman config from a path (JSON or YAML) or take an inline object as is */
export const loadConfigInput = async (
  config: ConfigInput
): Promise<{ data: unknown; source: string }> => {
  if (typeof config !== 'string') return { data: config, source: 'inline' }

  const trimmed = config.trim()
  if (trimmed.startsWith('{')) {
    // Agents sometimes pass the JSON document as a string
    return { data: JSON.parse(trimmed), source: 'inline' }
  }

  const configPath = path.resolve(config)
  if (!(await fs.pathExists(configPath))) {
    throw new Error(`Portman config file not found: ${configPath}`)
  }
  return { data: await new OpenApiFormatter().parseFile(configPath), source: configPath }
}

const normalisePath = (errorPath: string | undefined): string => {
  const cleaned = (errorPath || '').replace(/^\{base\}\.?/, '').replace(/\.(\d+)(?=\.|$)/g, '[$1]')
  return cleaned || '(root)'
}

/** Validate with Portman's own JSON schema (src/utils/portman-config-schema.json) */
export const validateConfigData = async (
  data: unknown
): Promise<{ valid: boolean; errors: ConfigIssue[]; config?: PortmanConfig }> => {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return {
      valid: false,
      errors: [{ path: '(root)', message: 'The Portman config must be a JSON object' }]
    }
  }

  // Resolve $refs the same way the CLI does before validating
  const parsed = await parsePortmanConfig(data as PortmanConfig)
  if (Either.isLeft(parsed)) {
    const detail = parsed.left as { error?: string; detail?: string }
    return {
      valid: false,
      errors: [
        { path: '(root)', message: [detail.error, detail.detail].filter(Boolean).join(': ') }
      ]
    }
  }

  const result = validate(parsed.right)
  if (Either.isLeft(result)) {
    return {
      valid: false,
      errors: result.left.map(error => ({
        path: normalisePath(error.path),
        message: error.message,
        ...(error.suggestion ? { suggestion: error.suggestion } : {})
      }))
    }
  }
  return { valid: true, errors: [], config: result.right }
}

/**
 * Report targets (openApiOperationId(s), openApiOperation, excludeForOperations) that
 * match no operation in the spec. Portman silently skips those, which hides mistakes.
 */
export const findUnmatchedTargets = (config: unknown, parser: OpenApiParser): ConfigIssue[] => {
  const warnings: ConfigIssue[] = []

  const matchesOperation = (target: string): boolean =>
    target.includes('::')
      ? parser.getOperationsByPath(target).length > 0
      : parser.getOperationById(target) !== null

  const visit = (node: unknown, nodePath: string): void => {
    if (Array.isArray(node)) {
      node.forEach((child, index) => visit(child, `${nodePath}[${index}]`))
      return
    }
    if (!node || typeof node !== 'object') return

    Object.entries(node as Record<string, unknown>).forEach(([key, value]) => {
      const childPath = nodePath ? `${nodePath}.${key}` : key
      if (key === 'openApiOperationId' && typeof value === 'string') {
        if (!parser.getOperationById(value)) {
          warnings.push({ path: childPath, message: `No operation with operationId "${value}"` })
        }
      } else if (key === 'openApiOperation' && typeof value === 'string') {
        if (parser.getOperationsByPath(value).length === 0) {
          warnings.push({ path: childPath, message: `No operation matches "${value}"` })
        }
      } else if (
        (key === 'openApiOperationIds' || key === 'excludeForOperations') &&
        Array.isArray(value)
      ) {
        value.forEach((target, index) => {
          if (typeof target === 'string' && !matchesOperation(target)) {
            warnings.push({
              path: `${childPath}[${index}]`,
              message: `No operation matches "${target}"`
            })
          }
        })
      } else {
        visit(value, childPath)
      }
    })
  }

  visit(config, '')
  return warnings
}

export const CONTRACT_CHECKS = [
  'statusSuccess',
  'contentType',
  'jsonBody',
  'schemaValidation',
  'headersPresent',
  'responseTime'
] as const

export type ContractCheck = (typeof CONTRACT_CHECKS)[number]

export const DEFAULT_CHECKS: ContractCheck[] = [
  'statusSuccess',
  'contentType',
  'jsonBody',
  'schemaValidation'
]

export interface ScaffoldOptions {
  checks?: ContractCheck[]
  responseTimeMaxMs?: number
}

/** Build a starter portman-config with one contract test entry for every operation */
export const buildScaffoldConfig = (options: ScaffoldOptions = {}): Record<string, unknown> => {
  const requested = new Set<ContractCheck>(options.checks?.length ? options.checks : DEFAULT_CHECKS)
  if (options.responseTimeMaxMs !== undefined) requested.add('responseTime')
  if (requested.has('responseTime') && options.responseTimeMaxMs === undefined) {
    throw new Error('The responseTime check needs responseTimeMaxMs')
  }

  const contractTest: Record<string, unknown> = { openApiOperation: '*::/*' }
  // Keep a stable order, independent of the order the checks were requested in
  CONTRACT_CHECKS.filter(check => requested.has(check)).forEach(check => {
    contractTest[check] =
      check === 'responseTime'
        ? { enabled: true, maxMs: options.responseTimeMaxMs }
        : { enabled: true }
  })

  return {
    $schema: PORTMAN_CONFIG_SCHEMA_URL,
    version: 1,
    tests: {
      contractTests: [contractTest]
    }
  }
}
