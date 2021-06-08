/* eslint-disable @typescript-eslint/no-explicit-any */
import { OpenApiParser, PostmanParser } from 'application'

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
  value: string
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

export type TestConfig = {
  responseTests?: ResponseTestConfig[]
  contentTests?: ContentTestConfig[]
  variationTests?: VariationTestConfig[]
  limitOperations?: string[]
}

export interface TestSuiteConfig {
  version: number
  tests?: TestConfig
  overwrites?: OverwriteRequestConfig[]
  assignPmVariables?: AssignPmVariablesConfig[]
}

export interface TestSuiteServiceOptions {
  oasParser: OpenApiParser
  postmanParser: PostmanParser
  testSuiteConfigFile: string
}
