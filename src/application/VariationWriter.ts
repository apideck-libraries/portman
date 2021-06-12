import { Collection, Item, ItemGroup } from 'postman-collection'
import { PostmanMappedOperation } from '../postman'
import { VariationConfig } from '../types'

export class VariationWriter {
  public variationCollection: Collection
  public operationFolders: Record<string, string>

  constructor() {
    this.operationFolders = {}
    this.variationCollection = new Collection()
  }

  public add(pmOperation: PostmanMappedOperation, variations: VariationConfig[]): void {
    variations.map(variation => {
      const operationVariation = this.build(pmOperation, variation)
      const folderId = pmOperation.getParentFolderId()
      const folderName = pmOperation.getParentFolderName()

      this.addToLocalCollection(operationVariation, folderId, folderName)
    })
  }

  addToLocalCollection(
    operationVariation: PostmanMappedOperation,
    folderId: string | null,
    folderName: string | null
  ): void {
    let target: Collection | ItemGroup<Item>

    if (folderId) {
      if (this.operationFolders[folderId]) {
        // we've done this dance, add to existing folder
        target = this.variationCollection.items.one(
          this.operationFolders[folderId]
        ) as ItemGroup<Item>
      } else {
        // create a new item group and add
        const newFolder = new ItemGroup({
          name: `${folderName} Variations` || 'Variations'
        }) as ItemGroup<Item>

        this.variationCollection.items.add(newFolder)
        this.operationFolders[folderId] = newFolder.id
        target = newFolder
      }
    } else {
      target = this.variationCollection
    }

    target.items.add(operationVariation.item)
  }

  public mergeToCollection(collection: Collection): Collection {
    const variationFolder = new ItemGroup<Item>({
      name: 'Variation Testing'
    })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.variationCollection.items.map((item: any) => {
      variationFolder.items.add(item)
    })

    collection.items.add(variationFolder)
    return collection
  }

  private build(
    pmOperation: PostmanMappedOperation,
    variation: VariationConfig
  ): PostmanMappedOperation {
    const variationName = `${pmOperation.item.name}-${variation.name}`
    const operationVariation = pmOperation.clone(variationName)

    return operationVariation
  }
}
