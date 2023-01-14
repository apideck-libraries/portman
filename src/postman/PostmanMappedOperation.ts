import { Event, Item, ItemGroup } from 'postman-collection'
import { OasMappedOperation } from '../oas'

export type PostmanMappedOperationOptions = {
  item: Item
  operationIdMap?: Record<string, OasMappedOperation>
  id?: string
}

export class PostmanMappedOperation {
  public id?: string
  public path: string
  public method: string
  public pathRef: string
  public pathVar: string
  public requestHeaders: Record<string, unknown>
  public queryParams: Record<string, unknown>
  public pathParams: Record<string, unknown>
  public testJsonDataInjected: boolean
  public mappedVars: string[]
  public item: Item
  public postmanItemId?: string

  constructor(options: PostmanMappedOperationOptions) {
    const { item, operationIdMap, id } = options
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

    this.id =
      !id && operationIdMap && operationIdMap[this.pathRef]?.id
        ? operationIdMap[this.pathRef]?.id
        : (id as string)

    this.postmanItemId = item?.id as string

    this.testJsonDataInjected = false
    this.mappedVars = []
  }

  public getTests(): Event {
    return this.item.events.find(e => e?.listen === 'test', null)
  }

  getParent(): ItemGroup<Item> | null {
    const parent = this.item.parent()
    const isParent = ItemGroup.isItemGroup(parent)
    return isParent ? (parent as ItemGroup<Item>) : null
  }

  public getParentFolderId(): string | null {
    const parent = this.getParent()
    return parent ? parent.id : null
  }

  public getParentFolderName(): string | null {
    const parent = this.getParent()
    return parent ? parent.name : null
  }

  public clone({ newId, name }: { newId: string; name: string }): PostmanMappedOperation {
    // clone item for variation testing purposes
    // remove ids from item and response so we get a unique reference
    const clonedJsonItem = { ...this.item.toJSON() }
    const { id, ...clone } = clonedJsonItem

    if (name) {
      clone.name = name
      clone?.request ? (clone.request.name = name) : null
    }

    if (clone?.response?.length) {
      clone.response = clone.response.map(response => {
        const { id, ...clonedResponse } = response
        return clonedResponse
      })
    }
    const clonedPmItem = new Item(clone)
    clonedPmItem.events.clear()

    return new PostmanMappedOperation({
      item: clonedPmItem,
      id: newId
    })
  }

  public normalizedPathRef(method: string): string {
    const {
      item: {
        request: { url }
      }
    } = this

    const path = url?.path
      ?.map(segment => {
        return segment.includes(':') ? `{${segment}}`.replace(':', '') : segment
      })
      ?.map(segment => {
        return segment.includes('{{') ? segment.replace('{{', '{').replace('}}', '}') : segment
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

  public registerVar(variable: string): boolean {
    if (!this.mappedVars.includes(variable)) {
      this.mappedVars.push(variable)
      return true
    }
    return false
  }
}
