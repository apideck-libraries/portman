/* eslint-disable @typescript-eslint/no-explicit-any */
import { OpenApiParser } from 'oas'
import { PostmanParser } from 'postman'

type ResponseTest = {
  enabled: boolean
}

type StatusSuccess = ResponseTest
type ContentType = ResponseTest
type JsonBody = ResponseTest
type SchemaValidation = ResponseTest
type HeadersPresent = ResponseTest

export type ResponseTime = ResponseTest & {
  maxMs: number
}

export type ResponseTestConfig = {
  openApiOperationId?: string
  openApiOperation?: string
  statusSuccess?: StatusSuccess
  contentType?: ContentType
  jsonBody?: JsonBody
  schemaValidation?: SchemaValidation
  headersPresent?: HeadersPresent
  responseTime?: ResponseTime
}

export type ContentTestConfig = {
  openApiOperationId?: string
  openApiOperation?: string
  responseBodyTest: ResponseBodyTest[]
}

export type VariationTestConfig = {
  openApiOperationId?: string
  openApiOperation?: string
  variations: VariationConfig[]
}

export type VariationConfig = {
  name: string
  options?: any
  success: any
}

export type ResponseBodyTest = {
  key: string
  value?: any
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

export type OverwriteRequestBodyConfig = Omit<OverwriteConfig, 'value'> & {
  value?: any
}

export type OverwritePathVariableConfig = Omit<OverwriteConfig, 'remove'>
export type OverwriteRequestHeadersConfig = OverwriteConfig & {
  disable?: boolean
}

export type OverwritePathIdVariableConfig = {
  enabled: boolean
}

export type OverwriteRequestConfig = {
  openApiOperationId?: string
  openApiOperation?: string
  overwriteRequestQueryParams?: OverwriteQueryParamConfig[]
  overwriteRequestPathVariables?: OverwritePathVariableConfig[]
  overwriteRequestPathIdVariables?: OverwritePathIdVariableConfig[]
  overwriteRequestBody?: OverwriteRequestBodyConfig[]
  overwriteRequestHeaders?: OverwriteRequestHeadersConfig[]
}

export type CollectionVariableConfig = {
  requestBodyProp?: string
  responseBodyProp?: string
  responseHeaderProp?: string
  name?: string
  value?: any
}

export type AssignPmVariablesConfig = {
  openApiOperationId?: string
  openApiOperation?: string
  collectionVariables: CollectionVariableConfig[]
}

export type ExtendTestsConfig = {
  openApiOperationId?: string
  openApiOperation?: string
  tests: string[]
  overwrite?: boolean
  append?: boolean
}

export type OperationPreRequestScriptConfig = {
  openApiOperationId?: string
  openApiOperation?: string
  scripts: string[]
}

export type GlobalReplacement = {
  searchFor: string
  replaceWith: string
}

export type GlobalConfig = {
  collectionPreRequestScripts?: string[]
  keyValueReplacements?: Record<string, unknown>
  valueReplacements?: Record<string, unknown>
  rawReplacements?: GlobalReplacement[]
  orderOfOperations?: string[]
}

export type TestConfig = {
  responseTests?: ResponseTestConfig[]
  contentTests?: ContentTestConfig[]
  variationTests?: VariationTestConfig[]
  limitOperations?: string[]
}

export interface TestSuiteOptions {
  config: PortmanConfig
  oasParser: OpenApiParser
  postmanParser: PostmanParser
}

export interface PortmanConfig {
  version?: number
  globals?: GlobalConfig
  tests?: TestConfig
  overwrites?: OverwriteRequestConfig[]
  contentTests?: ContentTestConfig[]
  assignPmVariables?: AssignPmVariablesConfig[]
  operationPreRequestScripts?: OperationPreRequestScriptConfig[]
  extendTests?: ExtendTestsConfig[]
}
