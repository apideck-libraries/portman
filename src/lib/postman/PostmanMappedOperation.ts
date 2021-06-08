import { OasMappedOperation } from 'lib/oas/OasMappedOperation'
import { Event, Item } from 'postman-collection'

export interface IPostmanMappedOperation {
  id?: string
  path: string
  method: string
  pathRef: string
  requestHeaders: Record<string, unknown>
  queryParams: Record<string, unknown>
  pathParams: Record<string, unknown>
  item: Item
}

export class PostmanMappedOperation implements IPostmanMappedOperation {
  public id?: string
  public path: string
  public method: string
  public pathRef: string
  public pathVar: string
  public requestHeaders: Record<string, unknown>
  public queryParams: Record<string, unknown>
  public pathParams: Record<string, unknown>
  public item: Item
  public testJsonDataInjected: boolean

  constructor(item: Item, operationIdMap: Record<string, OasMappedOperation>) {
    this.item = item
    const { request } = item

    this.method = request.method.toUpperCase()
    this.path = request.url.path ? `/${request.url.path.join('/')}` : '/'
    this.pathRef = this.normalizedPathRef(this.method)
    this.pathVar = this.normalizedPathVar(this.method)

    this.requestHeaders = request.headers.toJSON().map(({ key, value, description }) => {
      return { name: key, value, description: description?.content }
    })

    this.queryParams = request.url.query.map(({ key, value }) => {
      return { name: key, value }
    })

    this.pathParams = request.url.variables.toJSON().map(({ key, value, description }) => {
      return { name: key, value, description: description?.content }
    })

    this.id = operationIdMap[this.pathRef]?.id
    this.testJsonDataInjected = false
  }

  public getTests(): Event {
    return this.item.events.find(e => e?.listen === 'test', null)
  }

  private normalizedPathRef(method: string): string {
    const {
      item: {
        request: { url }
      }
    } = this

    const path = url?.path
      ?.map(segment => {
        return segment.includes(':') ? `{${segment}}`.replace(':', '') : segment
      })
      .join('/')
    return `${method}::/${path}`
  }

  private normalizedPathVar(method: string): string {
    const {
      item: {
        request: { url }
      }
    } = this

    const path = url?.path
      ?.map(segment => {
        return segment.includes(':') ? `{${segment}}`.replace(':', '') : segment
      })
      .join('/')
      .replace(/#|\//g, '-')
    return `${method.toLowerCase()}::${path}`
  }
}
