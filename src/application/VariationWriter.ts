import { Collection, Item, ItemGroup, Header } from 'postman-collection'
import { OasMappedOperation } from 'src/oas'
import { OpenAPIV3 } from 'openapi-types'
import { PostmanMappedOperation } from '../postman'
import {
  IntegrationTest,
  OverwriteRequestConfig,
  PortmanTestTypes,
  VariationConfig,
  VariationTestConfig
} from '../types'
import { TestSuite } from './'
import { Fuzzer } from './Fuzzer'
import { changeCase } from 'openapi-format'
import {
  parseOpenApiResponse,
  parseOpenApiRequest,
  matchWildcard,
  getRequestBodyExample,
  getRawLanguageFromContentType
} from '../utils'

export type VariationWriterOptions = {
  testSuite: TestSuite
  variationFolderName: string
}

export class VariationWriter {
  testSuite: TestSuite
  fuzzer: Fuzzer
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

    // Inject Fuzz Variations
    this.fuzzer = new Fuzzer({ testSuite: this.testSuite, variationWriter: this })

    variations.map(variation => {
      const folderId = pmOperation.getParentFolderId()
      const folderName = pmOperation.getParentFolderName()
      const baseName = name || `${pmOperation.item.name}[${variation.name}]`

      let targetOaRequest = variation?.openApiRequest
      if (!targetOaRequest && (variationMeta as any)?.openApiRequest) {
        targetOaRequest = (variationMeta as any).openApiRequest
      }
      const reqInfo = parseOpenApiRequest(targetOaRequest)

      let reqContentTypes: (string | undefined)[] = []
      if (
        reqInfo?.contentType &&
        reqInfo.contentType.includes('*') &&
        oaOperation?.schema?.requestBody
      ) {
        const reqObj = oaOperation.schema.requestBody as OpenAPIV3.RequestBodyObject
        if (reqObj?.content) {
          reqContentTypes = Object.keys(reqObj.content).filter(ct =>
            matchWildcard(ct, reqInfo.contentType as string)
          )
        }
      }
      if (reqContentTypes.length === 0) {
        reqContentTypes = [reqInfo?.contentType]
      }

      let targetOaResponse = variation?.openApiResponse
      if (!targetOaResponse && variationMeta?.openApiResponse) {
        targetOaResponse = variationMeta.openApiResponse
      }
      const respInfo = parseOpenApiResponse(targetOaResponse)

      let respContentTypes: (string | undefined)[] = []
      if (
        respInfo?.contentType &&
        respInfo.contentType.includes('*') &&
        oaOperation?.schema?.responses?.[respInfo.code]
      ) {
        const respObj = oaOperation.schema.responses[respInfo.code] as OpenAPIV3.ResponseObject
        if (respObj?.content) {
          respContentTypes = Object.keys(respObj.content).filter(ct =>
            matchWildcard(ct, respInfo.contentType as string)
          )
        }
      }
      if (respContentTypes.length === 0) {
        respContentTypes = [respInfo?.contentType]
      }

      reqContentTypes.forEach(reqCt => {
        respContentTypes.forEach(ct => {
          const reqSuffix = reqCt && reqContentTypes.length > 1 ? `[${reqCt}]` : ''
          const respSuffix = ct && respContentTypes.length > 1 ? `[${ct}]` : ''
          const variationName = `${baseName}${reqSuffix}${respSuffix}`
          const fuzzingSet = variation.fuzzing
          const updatedVariation = {
            ...variation,
            openApiRequest: reqCt || variation.openApiRequest,
            openApiResponse: respInfo
              ? `${respInfo.code}${ct ? `::${ct}` : ''}`
              : variation.openApiResponse,
            name: `${variation.name}${reqSuffix}${respSuffix}`
          }

          if (fuzzingSet) {
            this.fuzzer = new Fuzzer({ testSuite: this.testSuite, variationWriter: this })
            // Generate new variation for each Fuzz of the request body
            this.fuzzer.injectFuzzRequestBodyVariations(
              pmOperation,
              oaOperation,
              updatedVariation,
              variationMeta
            )

            // Generate new variation for each Fuzz of the request query params
            this.fuzzer.injectFuzzRequestQueryParamsVariations(
              pmOperation,
              oaOperation,
              updatedVariation,
              variationMeta
            )

            // Generate new variation for each Fuzz of the request headers
            this.fuzzer.injectFuzzRequestHeadersVariations(
              pmOperation,
              oaOperation,
              updatedVariation,
              variationMeta
            )

            // Inject fuzzed variations to the folder
            this.fuzzer.fuzzVariations.map(operationVariation => {
              this.addToLocalCollection(operationVariation, folderId, folderName)
            })
          } else {
            // Normal variation
            const operationVariation = pmOperation.clone({
              newId: changeCase(variationName, 'camelCase'),
              name: variationName
            })

            // Set/Update Portman operation test type
            this.testSuite.registerOperationTestType(operationVariation, PortmanTestTypes.variation)

            this.injectVariations(operationVariation, oaOperation, updatedVariation, variationMeta)
            this.addToLocalCollection(operationVariation, folderId, folderName)
          }
        })
      })
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

    let targetOaRequest = variation?.openApiRequest
    if (!targetOaRequest && (variationMeta as any)?.openApiRequest) {
      targetOaRequest = (variationMeta as any).openApiRequest
    }
    const reqInfo = parseOpenApiRequest(targetOaRequest)

    let targetOaResponse = variation?.openApiResponse
    if (!targetOaResponse && variationMeta?.openApiResponse) {
      targetOaResponse = variationMeta.openApiResponse
    }
    const respInfo = parseOpenApiResponse(targetOaResponse)

    if (respInfo?.contentType) {
      pmOperation.item.request.upsertHeader({
        key: 'Accept',
        value: respInfo.contentType
      } as Header)
    }

    if (reqInfo?.contentType) {
      pmOperation.item.request.upsertHeader({
        key: 'Content-Type',
        value: reqInfo.contentType
      } as Header)

      const reqBodyObj = oaOperation?.schema?.requestBody as OpenAPIV3.RequestBodyObject
      const example = getRequestBodyExample(reqBodyObj, reqInfo.contentType)
      if (example && pmOperation.item.request.body) {
        pmOperation.item.request.body.mode = 'raw'
        pmOperation.item.request.body.raw = example
        const lang = getRawLanguageFromContentType(reqInfo.contentType)
        ;(pmOperation.item.request.body as any).options = {
          raw: { language: lang, headerFamily: lang }
        }
      }
    }

    if (overwrites) {
      this.overwriteMap[pmOperation.item.id as string] = overwrites
      this.testSuite.injectOverwrites([pmOperation], overwrites)
    }

    if (oaOperation && tests?.contractTests) {
      // Generate contract tests
      this.testSuite.generateContractTests(
        [pmOperation],
        oaOperation,
        tests.contractTests,
        respInfo?.code,
        respInfo?.contentType
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
