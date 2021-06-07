import { OpenApiParser, PostmanParser } from 'application'

type ResponseCheck = {
  enabled: boolean
}

type StatusSuccess = ResponseCheck
type ContentType = ResponseCheck
type JsonBody = ResponseCheck
type SchemaValidation = ResponseCheck
type HeadersPresent = ResponseCheck

export type ResponseTime = ResponseCheck & {
  maxMs: number
}

export type ResponseChecks = {
  statusSuccess?: StatusSuccess
  contentType?: ContentType
  jsonBody?: JsonBody
  schemaValidation?: SchemaValidation
  headersPresent?: HeadersPresent
  responseTime?: ResponseTime
}

export type ResponseBodyCheck = {
  key: string
  value: string
}

export type GeneratedTestConfig = {
  responseChecks?: ResponseChecks
  limitOperations?: string[]
}

export type ContentCheckConfig = {
  openApiOperationId?: string
  openApiOperation?: string
  checkResponseBody: ResponseBodyCheck[]
}

type OverwriteConfig = {
  key: string
  value?: string
  overwrite?: boolean
  remove?: boolean
}

export type OverwriteQueryParamConfig = OverwriteConfig & {
  disable?: boolean
}
export type OverwriteRequestBodyConfig = OverwriteConfig & {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  value: any
}

export type OverwritePathVariableConfig = OverwriteConfig
export type OverwriteRequestHeadersConfig = OverwriteConfig & {
  disable?: boolean
}

export type OverwriteRequestConfig = {
  openApiOperationId?: string
  openApiOperation?: string
  overwriteRequestQueryParams?: OverwriteQueryParamConfig[]
  overwriteRequestPathVariables?: OverwritePathVariableConfig[]
  overwriteRequestBody?: OverwriteRequestBodyConfig[]
  overwriteRequestHeaders?: OverwriteRequestHeadersConfig[]
}

export type EnvironmentVariableConfig = {
  requestBodyProp?: string
  responseBodyProp?: string
  responseHeaderProp?: string
  name?: string
  value: string
}

export type AssignPmVariablesConfig = {
  openApiOperationId?: string
  openApiOperation?: string
  environmentVariables: EnvironmentVariableConfig[]
}

export interface TestSuiteConfig {
  version: number
  generateTests?: GeneratedTestConfig
  contentChecks?: ContentCheckConfig[]
  overwriteRequests?: OverwriteRequestConfig[]
  assignPmVariables?: AssignPmVariablesConfig[]
}

export interface TestSuiteServiceOptions {
  oasParser: OpenApiParser
  postmanParser: PostmanParser
  testSuiteConfigFile: string
}
