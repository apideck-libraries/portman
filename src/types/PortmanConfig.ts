/* eslint-disable @typescript-eslint/no-explicit-any */
import { OpenApiParser } from '../oas'
import { PostmanParser } from '../postman'

type ContractTest = {
  enabled: boolean
  excludeForOperations?: string[]
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
  responseBodyTests?: ResponseBodyTest[]
  responseHeaderTests?: ResponseHeaderTest[]
}

export type IntegrationTestConfig = {
  name: string
  operations: IntegrationTest[]
}

export type IntegrationTest = {
  openApiOperationId: string
  openApiResponse?: string
  variations: VariationConfig[]
}

export type VariationTestConfig = {
  openApiOperationIds?: string[]
  openApiOperationId?: string
  openApiOperation?: string
  excludeForOperations?: string[]
  openApiResponse?: string
  variations: VariationConfig[]
}

export type VariationConfig = {
  name: string
  openApiResponse?: string
  overwrites?: any
  fuzzing?: fuzzingConfig[]
  tests: any
  assignVariables?: AssignVariablesConfig[]
  extendTests?: ExtendTestsConfig[]
  operationPreRequestScripts?: OperationPreRequestScriptConfig[]
}

export type ResponseBodyTest = {
  key: string
  value?: string | number | boolean
  contains?: string
  length?: any
}

export type ResponseHeaderTest = {
  key: string
  value?: string | number | boolean
  contains?: string
  length?: any
}

type OverwriteConfig = {
  key: string
  value?: string
  overwrite?: boolean
  remove?: boolean
}

export type OverwriteQueryParamConfig = OverwriteConfig & {
  disable?: boolean
  insert?: boolean
  description?: string
}

export type OverwriteRequestBodyConfig = Omit<OverwriteConfig, 'value'> & {
  value?: any
}

export type OverwritePathVariableConfig = Omit<OverwriteConfig, 'remove'>
export type OverwriteRequestHeadersConfig = OverwriteConfig & {
  disable?: boolean
  insert?: boolean
  description?: string
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
  overwriteRequestSecurity?: OverwriteRequestSecurityConfig
}

export type OverwriteRequestSecurityConfig = SecurityOverwrite

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

export type SecurityOverwrite = {
  apiKey?: SecurityApiKey
  bearer?: SecurityBearer
  basic?: SecurityBasicAuth
  other?: {
    type: string
    [key: string]: unknown | unknown[]
  }
}

export type SecurityApiKey = {
  key?: string
  value: string
  in?: string
}

export type SecurityBearer = {
  token: string
}

export type SecurityBasicAuth = {
  username: string
  password: string
}

export type GlobalReplacement = {
  searchFor: string
  replaceWith: string
}

export type GlobalConfig = {
  collectionPreRequestScripts?: string[]
  securityOverwrites?: SecurityOverwrite
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

type fuzzingSchemaItem = {
  path: string
  field?: string
  value: string | number
}

export const PortmanFuzzTypes = {
  requestBody: 'requestBody',
  requestQueryParam: 'requestQueryParam',
  requestHeader: 'requestHeader'
} as const

export type PortmanFuzzType = typeof PortmanFuzzTypes[keyof typeof PortmanFuzzTypes]

export type FuzzingSchemaItems = {
  fuzzType: PortmanFuzzType
  requiredFields: string[]
  minimumNumberFields?: fuzzingSchemaItem[]
  maximumNumberFields?: fuzzingSchemaItem[]
  minLengthFields?: fuzzingSchemaItem[]
  maxLengthFields?: fuzzingSchemaItem[]
}

type fuzzingOptions = {
  enabled: boolean
}

export type fuzzRequestBody = {
  requiredFields?: fuzzingOptions
  minimumNumberFields?: fuzzingOptions
  maximumNumberFields?: fuzzingOptions
  minLengthFields?: fuzzingOptions
  maxLengthFields?: fuzzingOptions
}

export type fuzzRequestQueryParam = {
  requiredFields?: fuzzingOptions
  minimumNumberFields?: fuzzingOptions
  maximumNumberFields?: fuzzingOptions
  minLengthFields?: fuzzingOptions
  maxLengthFields?: fuzzingOptions
}

export type fuzzRequestHeader = {
  requiredFields?: fuzzingOptions
  minimumNumberFields?: fuzzingOptions
  maximumNumberFields?: fuzzingOptions
  minLengthFields?: fuzzingOptions
  maxLengthFields?: fuzzingOptions
}

export type fuzzingConfig = {
  requestBody?: fuzzRequestBody[]
  requestQueryParams?: fuzzRequestQueryParam[]
  requestHeaders?: fuzzRequestHeader[]
}

/**
 * @summary Portman Configuration
 * @description Portman by Apideck allows you to port your OpenApi Spec to a Postman Collection, inject a powerful test suite, and run your tests with Newman. Details about all configuration options can be found at http://getportman.com.
 */
export interface PortmanConfig {
  version?: number
  globals?: GlobalConfig
  tests?: TestConfig
  overwrites?: OverwriteRequestConfig[]
  assignVariables?: AssignVariablesConfig[]
  operationPreRequestScripts?: OperationPreRequestScriptConfig[]
}
