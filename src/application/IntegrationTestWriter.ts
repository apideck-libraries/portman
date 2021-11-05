import { Collection, Item, ItemGroup } from 'postman-collection'
import {
  IntegrationTestConfig,
  VariationConfig,
  PortmanRequestTypes,
  pmRequestType
} from '../types'
import { TestSuite, VariationWriter } from './'

export class IntegrationTestWriter {
  public testSuite: TestSuite
  integrationTestFolder: ItemGroup<Item>
  integrationTestCollection: Collection

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
    this.integrationTestCollection = new Collection()
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

      const oaOperation = testSuite.oasParser.getOperationByPath(pmOperation.pathRef)

      // Build request type
      const registerPm = {
        postmanItemId: pmOperation.item.id,
        postmanName: pmOperation.item.name,
        requestType: PortmanRequestTypes.integration
      } as pmRequestType

      // Set/Update pmOperation request type
      const idx = this.testSuite.pmRequestTypes.findIndex(
        x => x.postmanItemId == registerPm.postmanItemId
      )
      if (idx === -1) {
        this.testSuite.pmRequestTypes.push(registerPm)
      } else {
        this.testSuite.pmRequestTypes[idx] = registerPm
      }

      // Handle integration variations
      variations.map(variation => {
        const variationName = variation.name

        const operationVariation = pmOperation.clone({
          newId: `${variationName}-${Math.random()}`,
          name: variationName
        })

        variationWriter.injectVariations(operationVariation, oaOperation, variation, operation)
        variationWriter.addToFolder(operationVariation, variationWriter.variationFolder)
      })
    })

    this.integrationTestCollection = variationWriter.mergeToCollection(
      this.integrationTestCollection
    )
  }

  public mergeToCollection(collection: Collection): Collection {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.integrationTestCollection.items.map((item: any) => {
      this.integrationTestFolder.items.add(item)
    })

    collection.items.add(this.integrationTestFolder)
    return collection
  }
}
