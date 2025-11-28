import { OpenAPI, OpenAPIV3, OpenAPIV3_1 } from 'openapi-types'

type requestBody = OpenAPIV3.RequestBodyObject | OpenAPIV3_1.RequestBodyObject
type responseObject = OpenAPIV3.ResponseObject | OpenAPIV3_1.ResponseObject
type schemaObject =
  | OpenAPIV3.SchemaObject
  | OpenAPIV3_1.SchemaObject
  | OpenAPIV3.ReferenceObject
  | OpenAPIV3_1.ReferenceObject
type operationObject = OpenAPIV3.OperationObject | OpenAPIV3_1.OperationObject
type parameterObject = OpenAPIV3.ParameterObject[] | OpenAPIV3_1.ParameterObject[]

export interface IOasMappedOperation {
  id?: string
  path: string
  method: string
  pathRef: string
  tags: string[]
  schema: operationObject
  requestHeaders: OpenAPI.Parameters
  pathParams: OpenAPI.Parameters
  queryParams: OpenAPI.Parameters
  cookieParams: OpenAPI.Parameters

  requestBody(): requestBody | undefined
}

export class OasMappedOperation implements IOasMappedOperation {
  public id?: string
  public path: string
  public method: string
  public pathRef: string
  public tags: string[]
  public requestHeaders: parameterObject
  public pathParams: parameterObject
  public queryParams: parameterObject
  public cookieParams: parameterObject
  public schema: operationObject
  public responseCodes: string[]

  constructor(path: string, method: string, operation: operationObject) {
    this.schema = { ...operation } as operationObject
    this.id = this.schema?.operationId
    this.method = method.toUpperCase()
    this.path = path
    this.pathRef = `${this.method}::${path}`
    this.requestHeaders = this.mapParameters('header')
    this.pathParams = this.mapParameters('path')
    this.queryParams = this.mapParameters('query')
    this.cookieParams = this.mapParameters('cookie')
    this.responseCodes = this.mapResponseCodes()
    this.tags = this.schema?.tags as string[]
  }

  private mapParameters(paramIn: string): parameterObject {
    if (!this.schema?.parameters) return []

    return (
      (this.schema.parameters as parameterObject).filter(
        parameter => (parameter.in as string) === paramIn
      ) || []
    )
  }

  requestBody(): requestBody | undefined {
    return this.schema?.requestBody as requestBody
  }

  requestBodySchema(mediaType: string): schemaObject | undefined {
    const requestBody = this.requestBody()
    if (!requestBody || !requestBody?.content?.[mediaType]?.schema) return

    return requestBody.content[mediaType].schema as schemaObject
  }

  private mapResponseCodes(): string[] {
    if (this?.schema?.responses) {
      return Object.keys(this.schema?.responses as unknown as responseObject)
    }
    return []
  }
}
