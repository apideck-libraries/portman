import { OpenAPIV3 } from 'openapi-types'

export interface IOasMappedOperation {
  id?: string
  path: string
  method: string
  pathRef: string
  schema: OpenAPIV3.OperationObject
  requestHeaders: OpenAPIV3.ParameterObject[]
  pathParams: OpenAPIV3.ParameterObject[]
  queryParams: OpenAPIV3.ParameterObject[]
  cookieParams: OpenAPIV3.ParameterObject[]

  requestBody(): OpenAPIV3.RequestBodyObject | undefined
}

export class OasMappedOperation implements IOasMappedOperation {
  public id?: string
  public path: string
  public method: string
  public pathRef: string
  public requestHeaders: OpenAPIV3.ParameterObject[]
  public pathParams: OpenAPIV3.ParameterObject[]
  public queryParams: OpenAPIV3.ParameterObject[]
  public cookieParams: OpenAPIV3.ParameterObject[]
  public schema: OpenAPIV3.OperationObject

  constructor(path: string, method: string, operation: OpenAPIV3.OperationObject) {
    this.schema = { ...operation }
    this.id = this.schema?.operationId
    this.method = method.toUpperCase()
    this.path = path
    this.pathRef = `${this.method}::${path}`
    this.requestHeaders = this.mapParameters('header')
    this.pathParams = this.mapParameters('path')
    this.queryParams = this.mapParameters('query')
    this.cookieParams = this.mapParameters('cookie')
  }

  private mapParameters(paramIn: string): OpenAPIV3.ParameterObject[] {
    if (!this.schema?.parameters) return []

    return (
      (this.schema.parameters as OpenAPIV3.ParameterObject[]).filter(
        parameter => (parameter.in as string) === paramIn
      ) || []
    )
  }

  requestBody(): OpenAPIV3.RequestBodyObject | undefined {
    return this.schema?.requestBody as OpenAPIV3.RequestBodyObject
  }

  requestBodySchema(mediaType: string): OpenAPIV3.SchemaObject | undefined {
    const requestBody = this.requestBody()
    if (!requestBody || !requestBody?.content?.[mediaType]?.schema) return

    return requestBody.content[mediaType].schema as OpenAPIV3.SchemaObject
  }
}
