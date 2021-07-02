import fs from 'fs-extra'
import path from 'path'
import { Collection, CollectionDefinition, Item, ItemGroup, Request } from 'postman-collection'
import { IOpenApiParser } from '../oas/OpenApiParser'
import { matchPath, METHODS } from '../utils'
import { PostmanMappedOperation } from './PostmanMappedOperation'

export interface PostmanParserConfig {
  inputFile?: string
  collection?: Collection
  oasParser?: IOpenApiParser
}

export interface IPostmanParser {
  collection: Collection
  mappedOperations: PostmanMappedOperation[]
  pmItems: Item[]
  getOperationById(operationId: string): PostmanMappedOperation | null
  getOperationByPath(path: string): PostmanMappedOperation | null
}

export class PostmanParser implements IPostmanParser {
  public collection: Collection
  public mappedOperations: PostmanMappedOperation[]
  public pmItems: Item[]

  private oasParser?: IOpenApiParser

  constructor(options: PostmanParserConfig) {
    const { inputFile, collection, oasParser } = options
    this.oasParser = oasParser

    if (collection) {
      this.collection = collection
    } else if (inputFile) {
      const postmanJson = path.resolve(inputFile)
      this.collection = new Collection(JSON.parse(fs.readFileSync(postmanJson).toString()))
    }

    this.map()
  }

  // collection is optional so we can call from constructor, but also pass in collection to be remapped
  public map(collection?: CollectionDefinition): void {
    if (collection) {
      this.collection = new Collection(collection)
    }

    this.pmItems = []
    this.itemsToOperations()
  }

  getItems = (item: Item | ItemGroup<Item>): void => {
    if (Item.isItem(item)) {
      const request = (item as Item).request
      if (request && Request.isRequest(request)) {
        this.pmItems.push(item as Item)
      }
    }
    // Check if this is a nested folder
    else if (ItemGroup.isItemGroup(item)) {
      const items = (item as ItemGroup<Item>)?.items
      // Check if this is an empty folder
      if (items && items.count() === 0) return

      items.map(item => {
        return this.getItems(item)
      })
    }
  }

  itemsToOperations = (): void => {
    const { collection } = this
    collection?.items.map(item => {
      // Check if this is a request at the top level
      if (Item.isItem(item)) {
        return this.getItems(item)
      }
      // Check if this is a folder at the top level
      else if (ItemGroup.isItemGroup(item)) {
        const items = (item as ItemGroup<Item>).items

        items.each(item => {
          return this.getItems(item)
        })
      }
    })

    const operationIdMap = this.oasParser?.operationIdMap || {}
    this.mappedOperations = this.pmItems.map(item => {
      return new PostmanMappedOperation({ item, operationIdMap })
    })
  }

  public getOperationByPath(path: string): PostmanMappedOperation | null {
    return this.mappedOperations.find(({ pathRef }) => pathRef === path) || null
  }

  public getOperationById(operationId: string): PostmanMappedOperation | null {
    return this.mappedOperations.find(({ id }) => id === operationId) || null
  }

  public getOperationsByIds(operationIds: string[]): PostmanMappedOperation[] {
    return this.mappedOperations.filter(({ id }) => id && operationIds.includes(id))
  }

  public getOperationByItemId(itemId: string): PostmanMappedOperation | null {
    return this.mappedOperations.find(mappedOperation => mappedOperation.item.id === itemId) || null
  }

  public getOperationsByPath(path: string): PostmanMappedOperation[] {
    const targetSplit = path.split('::')
    const targetMethod = targetSplit[0].includes('*') ? METHODS : targetSplit[0]
    const targetPath = targetSplit[1]

    return this.mappedOperations.filter(mappedOperation => {
      return (
        targetMethod.includes(mappedOperation.method) &&
        matchPath(targetPath, mappedOperation.pathRef.split('::')[1])
      )
    })
  }
}
