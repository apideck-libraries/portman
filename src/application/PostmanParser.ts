import fs from 'fs-extra'
import path from 'path'
import { Collection, Item, ItemGroup, Request } from 'postman-collection'
import { IOpenApiParser } from '../application'
import { PostmanMappedOperation } from '../lib/postman/PostmanMappedOperation'

export interface PostmanParserConfig {
  inputFile: string
  oasParser?: IOpenApiParser
}

export interface IPostmanParser {
  collection: Collection
  mappedOperations: PostmanMappedOperation[]
  requests: Request[]
  getOperationById(operationId: string): PostmanMappedOperation | null
  getOperationByPath(path: string): PostmanMappedOperation | null
}

export class PostmanParser {
  public collection: Collection
  public mappedOperations: PostmanMappedOperation[]
  public requests: Request[]
  public pmItems: []

  private oasParser?: IOpenApiParser

  constructor(options: PostmanParserConfig) {
    const { inputFile, oasParser } = options
    const postmanJson = path.resolve(inputFile)
    this.oasParser = oasParser
    this.collection = new Collection(JSON.parse(fs.readFileSync(postmanJson).toString()))
    this.requests = []
    this.pmItems = []
    this.itemsToOperations()
  }

  getRequests = (item: Item | ItemGroup<Item>): void => {
    const { requests } = this
    if (Item.isItem(item)) {
      const request = (item as Item).request
      if (request && Request.isRequest(request)) {
        requests.push(request)
        this.pmItems.push({ pmItem: item as Item, pmRequest: request as Request })
      }
    }
    // Check if this is a nested folder
    else if (ItemGroup.isItemGroup(item)) {
      const items = (item as ItemGroup<Item>).items
      // Check if this is an empty folder
      if (items && items.count() === 0) return

      items.map(item => {
        return this.getRequests(item)
      })
    }
  }

  itemsToOperations = (): void => {
    const { collection, requests } = this

    collection.items.map(item => {
      // Check if this is a request at the top level
      if (Item.isItem(item)) {
        return this.getRequests(item)
      }
      // Check if this is a folder at the top level
      else if (ItemGroup.isItemGroup(item)) {
        const items = (item as ItemGroup<Item>).items

        items.each(item => {
          return this.getRequests(item)
        })
      }
    })

    const operationIdMap = this.oasParser?.operationIdMap || {}
    this.mappedOperations = this.pmItems.map(request => {
      return new PostmanMappedOperation(request.pmItem, request.pmRequest, operationIdMap)
    })
  }

  public getOperationByPath(path: string): PostmanMappedOperation | null {
    return this.mappedOperations.find(({ pathRef }) => pathRef === path) || null
  }

  public getOperationById(operationId: string): PostmanMappedOperation | null {
    return this.mappedOperations.find(({ id }) => id === operationId) || null
  }
}
