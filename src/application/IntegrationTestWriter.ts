import { Collection, Item, ItemGroup } from 'postman-collection'
import { IntegrationTestConfig, VariationConfig, PortmanTestTypes } from '../types'
import { TestSuite, VariationWriter } from './'
import { PostmanMappedOperation } from 'postman'

export type IntegrationTestWriterOptions = {
  testSuite: TestSuite
  integrationTestFolderName: string
}

export class IntegrationTestWriter {
  public testSuite: TestSuite
  public integrationTestFolder: ItemGroup<Item>
  public integrationTestCollection: Collection
  public operationFolders: Record<string, string>

  constructor(options: IntegrationTestWriterOptions) {
    const { testSuite, integrationTestFolderName } = options
    this.testSuite = testSuite
    this.operationFolders = {}
    this.integrationTestCollection = new Collection()
    this.integrationTestFolder = new ItemGroup<Item>({
      name: integrationTestFolderName
    })
  }

  public add(integrationTest: IntegrationTestConfig): void {
    const { testSuite } = this
    const { name, operations } = integrationTest

    const variationWriter = new VariationWriter({
      testSuite: this.testSuite,
      variationFolderName: name
    })

    operations.map(operation => {
      const variations = (operation?.variations || []) as VariationConfig[]
      const { openApiOperationId } = operation

      const pmOperation = testSuite.postmanParser.getOperationById(openApiOperationId)

      if (!pmOperation) return

      const folderId = pmOperation.getParentFolderId()
      // const folderName = pmOperation.getParentFolderName()

      const oaOperation = testSuite.oasParser.getOperationByPath(pmOperation.pathRef)

      // Handle integration variations
      variations.map(variation => {
        const variationName = variation.name

        const operationVariation = pmOperation.clone({
          newId: `${variationName}-${Math.random()}`,
          name: variationName
        })

        // Set/Update Portman operation test type
        this.testSuite.registerOperationTestType(operationVariation, PortmanTestTypes.integration)

        variationWriter.injectVariations(operationVariation, oaOperation, variation, operation)
        this.addToLocalCollection(operationVariation, folderId, name)
      })
    })
  }

  public addToLocalCollection(
    operationVariation: PostmanMappedOperation,
    folderId: string | null,
    folderName: string | null
  ): void {
    let target: Collection | ItemGroup<Item>

    if (folderId) {
      if (this.operationFolders[folderId]) {
        // we've done this dance, add to existing folder
        target = this.integrationTestCollection.items.one(
          this.operationFolders[folderId]
        ) as ItemGroup<Item>
      } else {
        // create a new item group and add
        const newFolder = new ItemGroup({
          name: folderName || 'Integrations'
        }) as ItemGroup<Item>

        this.integrationTestCollection.items.add(newFolder)
        this.operationFolders[folderId] = newFolder.id
        target = newFolder
      }
    } else {
      target = this.integrationTestCollection
    }

    target.items.add(operationVariation.item)
  }

  public mergeToCollection(collection: Collection): Collection {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.integrationTestCollection.items.map((item: any) => {
      this.integrationTestFolder.items.add(item)
    })

    collection.items.add(this.integrationTestFolder)
    this.testSuite.postmanParser.collection = collection
    return collection
  }
}
