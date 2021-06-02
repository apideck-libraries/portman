import { OasMappedOperation } from 'lib/oas/OasMappedOperation'
import { Item, Request } from 'postman-collection'

export interface IPostmanMappedOperation {
  id?: string
  path: string
  method: string
  pathRef: string
  pathRefVariable: string
  requestHeaders: Record<string, unknown>
  queryParams: Record<string, unknown>
  pathParams: Record<string, unknown>
  request: Request
  item: Item
}

export class PostmanMappedOperation implements IPostmanMappedOperation {
  public id?: string
  public path: string
  public method: string
  public pathRef: string
  public pathRefVariable: string
  public requestHeaders: Record<string, unknown>
  public queryParams: Record<string, unknown>
  public pathParams: Record<string, unknown>
  public request: Request
  public item: Item

  constructor(item: Item, request: Request, operationIdMap: Record<string, OasMappedOperation>) {
    this.item = item
    this.request = request
    this.method = request.method.toUpperCase()

    this.path = request.url.path ? `/${request.url.path.join('/')}` : '/'
    this.pathRef = this.normalizedPathRef(this.method)
    this.pathRefVariable = `${this.method}::${request.url.getPath()}`
    this.requestHeaders = request.headers.toJSON().map(({ key, value, description }) => {
      return { name: key, value, description: description?.content }
    })
    this.queryParams = request.url.query.map(({ key, value }) => {
      return { name: key, value }
    })
    this.pathParams = this.request.url.variables.toJSON().map(({ key, value, description }) => {
      return { name: key, value, description: description?.content }
    })

    this.id = operationIdMap[this.pathRef]?.id
  }

  private normalizedPathRef(method: string): string {
    const {
      request: { url }
    } = this
    const path = url?.path
      ?.map(segment => {
        return segment.includes(':') ? `{${segment}}`.replace(':', '') : segment
      })
      .join('/')
    return `${method}::/${path}`
  }
}
