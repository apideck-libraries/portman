import fs from 'fs-extra'
import os from 'os'
import path from 'path'
import { OpenAPIV3 } from 'openapi-types'
import { OasMappedOperation, OpenApiFormatter, OpenApiParser } from '../oas'

export const isUrl = (value: string): boolean => /^https?:\/\//i.test(value)

/** Resolve a local path against the server's working directory; URLs are returned as is */
export const resolveSpecLocation = (spec: string): string =>
  isUrl(spec) ? spec : path.resolve(spec)

/**
 * Parse and dereference an OpenAPI document (local path or http(s) URL) with Portman's
 * OpenApiParser, the same parser the CLI uses to generate tests.
 */
export const loadSpec = async (
  spec: string,
  options: { ignoreCircularRefs?: boolean } = {}
): Promise<OpenApiParser> => {
  let inputFile = resolveSpecLocation(spec)
  let tmpDir: string | undefined

  if (isUrl(spec)) {
    // OpenApiParser expects a file; download it the same way Portman does for --url
    const formatter = new OpenApiFormatter()
    const document = await formatter.parseFile(spec)
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'portman-mcp-spec-'))
    inputFile = path.join(tmpDir, 'openapi.yaml')
    await formatter.writeFile(inputFile, document, { format: 'yaml' })
  } else if (!(await fs.pathExists(inputFile))) {
    throw new Error(`OpenAPI file not found: ${inputFile}`)
  }

  try {
    const parser = new OpenApiParser()
    await parser.convert({ inputFile, ignoreCircularRefs: options.ignoreCircularRefs })
    return parser
  } finally {
    if (tmpDir) await fs.remove(tmpDir)
  }
}

export interface OperationSummary {
  method: string
  path: string
  /** Portman target notation, usable as `openApiOperation` in portman-config */
  openApiOperation: string
  operationId: string | null
  summary: string | null
  tags: string[]
  responseStatusCodes: string[]
  deprecated: boolean
}

export const summariseOperation = (operation: OasMappedOperation): OperationSummary => ({
  method: operation.method,
  path: operation.path,
  openApiOperation: operation.pathRef,
  operationId: operation.id || null,
  summary: operation.schema?.summary || null,
  tags: operation.tags || [],
  responseStatusCodes: operation.responseCodes || [],
  deprecated: Boolean(operation.schema?.deprecated)
})

const HTTP_METHODS = ['GET', 'PUT', 'POST', 'DELETE', 'OPTIONS', 'HEAD', 'PATCH', 'TRACE']

export const listOperations = (parser: OpenApiParser): OperationSummary[] =>
  parser.mappedOperations
    .filter(operation => HTTP_METHODS.includes(operation.method))
    .map(summariseOperation)

export const specInfo = (
  parser: OpenApiParser
): { title: string | null; version: string | null; openapi: string | null } => ({
  title: parser.oas?.info?.title || null,
  version: parser.oas?.info?.version || null,
  openapi: (parser.oas as OpenAPIV3.Document)?.openapi || null
})

/**
 * Find the OpenAPI response object for a status code, following OpenAPI's lookup order:
 * exact code, range ("2XX"), then "default".
 */
export const findResponse = (
  operation: OasMappedOperation,
  status: number | string | null | undefined
): { key: string; response: OpenAPIV3.ResponseObject } | null => {
  const responses = (operation.schema?.responses || {}) as Record<string, OpenAPIV3.ResponseObject>
  if (status !== null && status !== undefined) {
    const code = String(status)
    const candidates = [code, `${code[0]}XX`, `${code[0]}xx`, 'default']
    for (const key of candidates) {
      if (responses[key]) return { key, response: responses[key] }
    }
    return null
  }
  // No status: the first documented success response
  const success = Object.keys(responses).find(key => /^2/.test(key))
  return success ? { key: success, response: responses[success] } : null
}
