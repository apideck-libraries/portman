import { Collection, Item, ItemGroup } from 'postman-collection'
import { OasMappedOperation } from 'src/oas'
import { PostmanMappedOperation } from '../postman'
import { VariationConfig } from '../types'
import { TestSuite } from './'

export type VariationWriterOptions = {
  testSuite: TestSuite
}

export class VariationWriter {
  testSuite: TestSuite
  public variationCollection: Collection
  public operationFolders: Record<string, string>

  constructor(options: VariationWriterOptions) {
    const { testSuite } = options
    this.testSuite = testSuite
    this.operationFolders = {}
    this.variationCollection = new Collection()
  }

  public add(
    pmOperation: PostmanMappedOperation,
    oaOperation: OasMappedOperation | null,
    variations: VariationConfig[]
  ): void {
    variations.map(variation => {
      const folderId = pmOperation.getParentFolderId()
      const folderName = pmOperation.getParentFolderName()
      const variationName = `${pmOperation.item.name}-${variation.name}`
      const operationVariation = pmOperation.clone(variationName)

      this.injectVariations(operationVariation, oaOperation, variation)

      this.addToLocalCollection(operationVariation, folderId, folderName)
    })
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

  private addToLocalCollection(
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

  injectVariations(
    pmOperation: PostmanMappedOperation,
    oaOperation: OasMappedOperation | null,
    variation: VariationConfig
  ): void {
    const { overwrites, tests, assignVariables } = variation

    if (overwrites) {
      this.testSuite.injectOverwrites([pmOperation], overwrites)
    }

    if (oaOperation && tests?.contractTests) {
      this.testSuite.generateContractTests([pmOperation], oaOperation, tests.contractTests)
    }

    if (tests?.contentTests) {
      this.testSuite.injectContentTests([pmOperation], tests.contentTests)
    }

    if (tests?.extendTests) {
      this.testSuite.injectExtendedTests([pmOperation], tests.extendTests)
    }

    if (assignVariables) {
      this.testSuite.injectAssignVariables([pmOperation], assignVariables)
    }
  }
}
