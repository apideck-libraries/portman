/* eslint-disable @typescript-eslint/no-explicit-any */
import { OpenApiParser } from '../oas'
import { PostmanParser } from '../postman'

type ContractTest = {
  enabled: boolean
}

type StatusSuccess = ContractTest

type ContentType = ContractTest
type JsonBody = ContractTest
type SchemaValidation = ContractTest
type HeadersPresent = ContractTest

export type ResponseTime = ContractTest & {
  maxMs: number
}

export type StatusCode = ContractTest & {
  code?: number
}

export type ContractTestConfig = {
  openApiOperationIds?: string[]
  openApiOperationId?: string
  openApiOperation?: string
  excludeForOperations?: string[]
  statusSuccess?: StatusSuccess
  statusCode?: StatusCode
  contentType?: ContentType
  jsonBody?: JsonBody
  schemaValidation?: SchemaValidation
  headersPresent?: HeadersPresent
  responseTime?: ResponseTime
}

export type ContentTestConfig = {
  openApiOperationIds?: string[]
  openApiOperationId?: string
  openApiOperation?: string
  excludeForOperations?: string[]
  responseBodyTests: ResponseBodyTest[]
}

export type IntegrationTestConfig = {
  name: string
  operations: IntegrationTest[]
}

export type IntegrationTest = {
  openApiOperationId: string
  variations: VariationConfig[]
}

export type VariationTestConfig = {
  openApiOperationIds?: string[]
  openApiOperationId?: string
  openApiOperation?: string
  excludeForOperations?: string[]
  variations: VariationConfig[]
}

export type VariationConfig = {
  name: string
  openApiResponse?: string
  overwrites?: any
  tests: any
  assignVariables?: AssignVariablesConfig[]
  extendTests?: ExtendTestsConfig[]
  operationPreRequestScripts?: OperationPreRequestScriptConfig[]
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
  openApiOperationIds?: string[]
  openApiOperationId?: string
  openApiOperation?: string
  excludeForOperations?: string[]
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

export type AssignVariablesConfig = {
  openApiOperationIds?: string[]
  openApiOperationId?: string
  openApiOperation?: string
  excludeForOperations?: string[]
  collectionVariables: CollectionVariableConfig[]
}

export type ExtendTestsConfig = {
  openApiOperationIds?: string[]
  openApiOperationId?: string
  openApiOperation?: string
  excludeForOperations?: string[]
  tests: string[]
  overwrite?: boolean
  append?: boolean
}

export type OperationPreRequestScriptConfig = {
  openApiOperationIds?: string[]
  openApiOperationId?: string
  openApiOperation?: string
  excludeForOperations?: string[]
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
  portmanReplacements?: GlobalReplacement[]
  orderOfOperations?: string[]
}

export interface TestSuiteOptions {
  config: PortmanConfig
  oasParser: OpenApiParser
  postmanParser: PostmanParser
}

export type TestConfig = {
  contractTests?: ContractTestConfig[]
  contentTests?: ContentTestConfig[]
  extendTests?: ExtendTestsConfig[]
  variationTests?: VariationTestConfig[]
  integrationTests?: IntegrationTestConfig[]
}

export interface PortmanConfig {
  version?: number
  globals?: GlobalConfig
  tests?: TestConfig
  overwrites?: OverwriteRequestConfig[]
  assignVariables?: AssignVariablesConfig[]
  operationPreRequestScripts?: OperationPreRequestScriptConfig[]
}
