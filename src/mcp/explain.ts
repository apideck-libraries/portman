import { OpenAPIV3 } from 'openapi-types'
import { JsonReport, JsonReportFailure } from '../application/newman/jsonReport'
import { OasMappedOperation, OpenApiParser } from '../oas'
import { findResponse, summariseOperation, OperationSummary } from './openapi'

const SCHEMA_TEXT_LIMIT = 20000

/** JSON.stringify that survives circular schemas (ignoreCircularRefs) and caps the size */
export const schemaToText = (schema: unknown, limit = SCHEMA_TEXT_LIMIT): string => {
  const seen = new WeakSet<object>()
  const text = JSON.stringify(
    schema,
    (_key, value) => {
      if (value && typeof value === 'object') {
        if (seen.has(value)) return '[Circular]'
        seen.add(value)
      }
      return value
    },
    2
  )
  if (text === undefined) return 'undefined'
  return text.length > limit
    ? `${text.slice(0, limit)}\n... (truncated, ${text.length} chars)`
    : text
}

export const findOperationForFailure = (
  parser: OpenApiParser,
  failure: JsonReportFailure
): OasMappedOperation | null => {
  if (failure.openApiOperationId) {
    const byId = parser.getOperationById(failure.openApiOperationId)
    if (byId) return byId
  }
  if (failure.openApiOperation) {
    const byPath = parser.getOperationByPath(failure.openApiOperation)
    if (byPath) return byPath
    const matches = parser.getOperationsByPath(failure.openApiOperation)
    if (matches.length === 1) return matches[0]
  }
  return null
}

export interface ExpectedResponse {
  /** Response key in the spec that applies: exact code, range ("2XX") or "default" */
  responseKey: string | null
  documentedStatusCodes: string[]
  description: string | null
  contentTypes: string[]
  headers: string[]
  /** JSON schema for the response body, as JSON text (dereferenced, size capped) */
  schema: string | null
}

const describeExpectedResponse = (
  operation: OasMappedOperation,
  status: number | null
): ExpectedResponse => {
  const match = findResponse(operation, status)
  const response = match?.response
  const content = (response?.content || {}) as Record<string, OpenAPIV3.MediaTypeObject>
  const contentTypes = Object.keys(content)
  const jsonType = contentTypes.find(type => /json/i.test(type)) || contentTypes[0]
  const schema = jsonType ? content[jsonType]?.schema : undefined
  return {
    responseKey: match?.key || null,
    documentedStatusCodes: operation.responseCodes || [],
    description: response?.description || null,
    contentTypes,
    headers: Object.keys(response?.headers || {}),
    schema: schema ? schemaToText(schema) : null
  }
}

const FIX_POLICY =
  'Fix the API implementation so it matches the OpenAPI spec. Only change the spec if the ' +
  'current API behaviour is the intended contract, and make that a deliberate, reviewed ' +
  'change. Do not disable or weaken the Portman checks to make the test pass.'

/** A short, factual next step for a failure, based on its type */
export const hintFor = (
  failure: JsonReportFailure,
  expected: ExpectedResponse | null,
  baseUrl: string | null
): string => {
  const status = failure.response?.status
  if (failure.failureType === 'requestError') {
    return (
      `The request did not get a response (${failure.message}). Check that the API is running ` +
      `and reachable at ${baseUrl || 'the baseUrl'}, then run the tests again.`
    )
  }
  if (failure.failureType === 'scriptError') {
    return (
      'A test or pre-request script threw an error. Check custom scripts in the Portman config ' +
      '(extendTests, operationPreRequestScripts, collection scripts) and the response it ran against.'
    )
  }

  switch (failure.testType) {
    case 'schemaValidation':
      return (
        `The response body (status ${status}) does not match the response schema` +
        `${expected?.responseKey ? ` for "${expected.responseKey}"` : ''}. Compare the validation ` +
        `errors in "message" with "expected.schema" (required fields, types, formats, enums, ` +
        `nullable). ${FIX_POLICY}`
      )
    case 'statusSuccess':
      return (
        `The API returned ${status}, not a 2xx status. Check the request data the collection sends ` +
        `(path ids, body, auth variables from the env file) and the server logs for this request. ` +
        `If the request data is wrong, fix it with Portman overwrites or assignVariables; if the ` +
        `API is wrong, fix the implementation.`
      )
    case 'statusCode':
      return `The API returned ${status}, not the status code the test expects. ${FIX_POLICY}`
    case 'contentType':
      return (
        `The response Content-Type does not match the spec, which documents ` +
        `${expected?.contentTypes.length ? expected.contentTypes.join(', ') : 'no content'} for this ` +
        `response. ${FIX_POLICY}`
      )
    case 'jsonBody':
      return `The response body is not the JSON body the spec documents. ${FIX_POLICY}`
    case 'headersPresent':
      return `A response header documented in the spec is missing. ${FIX_POLICY}`
    case 'responseTime':
      return (
        'The response was slower than the configured responseTime.maxMs. Investigate the ' +
        'performance of this endpoint; only raise the limit if the new value is an agreed target.'
      )
    case 'content':
      return (
        'A contentTests assertion from the Portman config failed: the response value does not ' +
        'match the configured expectation. Check whether the test data or the implementation is wrong.'
      )
    case 'variation':
      return (
        'A variation test failed: the API did not respond as the variation expects (often an ' +
        'error status for invalid input). Check how the API validates this input.'
      )
    default:
      return `Inspect the assertion and the response. ${FIX_POLICY}`
  }
}

export interface FailureExplanation {
  reportPath: string
  index: number
  totalFailures: number
  failure: JsonReportFailure
  operation: (OperationSummary & { description: string | null }) | null
  expected: ExpectedResponse | null
  hint: string
  note?: string
}

export const explainFailure = (
  report: JsonReport,
  reportPath: string,
  index: number,
  parser: OpenApiParser | null
): FailureExplanation => {
  const failure = report.failures[index]
  const operation = parser ? findOperationForFailure(parser, failure) : null
  const expected = operation
    ? describeExpectedResponse(operation, failure.response?.status ?? null)
    : null

  let note: string | undefined
  if (!parser)
    note = 'The OpenAPI spec could not be loaded; pass `spec` to include operation details.'
  else if (!operation) note = 'The failure could not be mapped to an operation in the spec.'

  return {
    reportPath,
    index,
    totalFailures: report.failures.length,
    failure,
    operation: operation
      ? { ...summariseOperation(operation), description: operation.schema?.description || null }
      : null,
    expected,
    hint: hintFor(failure, expected, report.baseUrl),
    ...(note ? { note } : {})
  }
}
