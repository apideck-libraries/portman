import { Collection, Item, ItemGroup } from 'postman-collection'
import { IntegrationTestConfig } from 'src/types'
import { TestSuite, VariationWriter } from './'

export class IntegrationTestWriter {
  public testSuite: TestSuite
  integrationTestFolder: ItemGroup<Item>
  integationTestCollection: Collection

  constructor({
    testSuite,
    integrationTestFolderName
  }: {
    testSuite: TestSuite
    integrationTestFolderName: string
  }) {
    this.testSuite = testSuite
    this.integrationTestFolder = new ItemGroup<Item>({
      name: integrationTestFolderName
    })
    this.integationTestCollection = new Collection()
  }

  public add(integrationTest: IntegrationTestConfig): void {
    const { testSuite } = this
    const { name, operations } = integrationTest

    const variationWriter = new VariationWriter({
      testSuite: this.testSuite,
      variationFolderName: name
    })

    operations.map(({ openApiOperationId, variations }) => {
      const pmOperations = testSuite.postmanParser.getOperationsByIds([openApiOperationId])
      const pmOperation = pmOperations[0]
      const oaOperation = testSuite.oasParser.getOperationByPath(pmOperation.pathRef)

      variations.map(variation => {
        const variationName = variation.name

        const operationVariation = pmOperation.clone({
          newId: `${variationName}-${Math.random()}`,
          name: variationName
        })

        variationWriter.injectVariations(operationVariation, oaOperation, variation)
        variationWriter.addToFolder(operationVariation, variationWriter.variationFolder)
      })
    })

    this.integationTestCollection = variationWriter.mergeToCollection(this.integationTestCollection)
  }

  public mergeToCollection(collection: Collection): Collection {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.integationTestCollection.items.map((item: any) => {
      this.integrationTestFolder.items.add(item)
    })

    collection.items.add(this.integrationTestFolder)
    return collection
  }
}
