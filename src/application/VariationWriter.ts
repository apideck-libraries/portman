import { camelCase } from 'camel-case'
import { Collection, Item, ItemGroup } from 'postman-collection'
import { OasMappedOperation } from 'src/oas'
import { PostmanMappedOperation } from '../postman'
import {
  IntegrationTest,
  OverwriteRequestConfig,
  PortmanTestTypes,
  VariationConfig,
  VariationTestConfig
} from '../types'
import { TestSuite } from './'

export type VariationWriterOptions = {
  testSuite: TestSuite
  variationFolderName: string
}

export class VariationWriter {
  testSuite: TestSuite
  public variationFolder: ItemGroup<Item>
  public variationCollection: Collection
  public operationFolders: Record<string, string>
  public overwriteMap: Record<string, OverwriteRequestConfig[]>

  constructor(options: VariationWriterOptions) {
    const { testSuite, variationFolderName } = options
    this.testSuite = testSuite
    this.operationFolders = {}
    this.overwriteMap = {}
    this.variationCollection = new Collection()
    this.variationFolder = new ItemGroup<Item>({
      name: variationFolderName
    })
  }

  public add(
    pmOperation: PostmanMappedOperation,
    oaOperation: OasMappedOperation | null,
    variation: VariationTestConfig,
    name?: string
  ): void {
    const variations = (variation?.variations as VariationConfig[]) || []
    const { ...variationMeta } = variation

    variations.map(variation => {
      const folderId = pmOperation.getParentFolderId()
      const folderName = pmOperation.getParentFolderName()
      const variationName = name || `${pmOperation.item.name}[${variation.name}]`

      const operationVariation = pmOperation.clone({
        newId: camelCase(variationName),
        name: variationName
      })

      // Set/Update Portman operation test type
      this.testSuite.registerOperationTestType(operationVariation, PortmanTestTypes.variation)

      this.injectVariations(operationVariation, oaOperation, variation, variationMeta)
      this.addToLocalCollection(operationVariation, folderId, folderName)
    })
  }

  public mergeToCollection(collection: Collection): Collection {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.variationCollection.items.map((item: any) => {
      this.variationFolder.items.add(item)
    })

    collection.items.add(this.variationFolder)
    return collection
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

  public addToFolder(operationVariation: PostmanMappedOperation, folder: ItemGroup<Item>): void {
    folder.items.add(operationVariation.item)
  }

  injectVariations(
    pmOperation: PostmanMappedOperation,
    oaOperation: OasMappedOperation | null,
    variation: VariationConfig,
    variationMeta: VariationTestConfig | IntegrationTest | null
  ): void {
    const { overwrites, tests, assignVariables, operationPreRequestScripts } = variation

    if (overwrites) {
      this.overwriteMap[pmOperation.item.id as string] = overwrites
      this.testSuite.injectOverwrites([pmOperation], overwrites)
    }

    if (oaOperation && tests?.contractTests) {
      // Set target OpenAPI response
      let targetOaResponse = variation?.openApiResponse
      if (!targetOaResponse && variationMeta?.openApiResponse) {
        targetOaResponse = variationMeta.openApiResponse
      }

      // Generate contract tests
      this.testSuite.generateContractTests(
        [pmOperation],
        oaOperation,
        tests.contractTests,
        targetOaResponse
      )
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

    if (operationPreRequestScripts) {
      this.testSuite.injectPreRequestScripts([pmOperation], operationPreRequestScripts)
    }
  }
}
