import { camelCase } from 'camel-case'
import { Collection, Item, ItemGroup } from 'postman-collection'
import { OasMappedOperation } from 'src/oas'
import { PostmanMappedOperation } from '../postman'
import {
  FuzzingSchemaItems,
  IntegrationTest,
  OverwriteRequestBodyConfig,
  OverwriteRequestConfig,
  VariationConfig,
  VariationTestConfig
} from '../types'
import traverse from 'traverse'
import { TestSuite } from './'
import { OpenAPIV3 } from 'openapi-types'
import { getByPath } from '../utils'

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
      const fuzzingSet = variation.fuzzing

      if (fuzzingSet) {
        // Analyse JSON schema
        const reqBody = oaOperation?.schema?.requestBody as unknown as OpenAPIV3.RequestBodyObject
        const schema = reqBody?.content?.['application/json']?.schema as OpenAPIV3.SchemaObject
        const fuzzItems = this.analyzeFuzzJsonSchema(schema) || {}

        // Generate new variation for each Fuzz
        this.injectFuzzRequiredVariation(
          pmOperation,
          oaOperation,
          variation,
          variationMeta,
          fuzzItems
        )

        this.injectFuzzMinimumVariation(
          pmOperation,
          oaOperation,
          variation,
          variationMeta,
          fuzzItems
        )

        this.injectFuzzMaximumVariation(
          pmOperation,
          oaOperation,
          variation,
          variationMeta,
          fuzzItems
        )

        this.injectFuzzMinLengthVariation(
          pmOperation,
          oaOperation,
          variation,
          variationMeta,
          fuzzItems
        )

        this.injectFuzzMaxLengthVariation(
          pmOperation,
          oaOperation,
          variation,
          variationMeta,
          fuzzItems
        )
      } else {
        // Normal variation
        const operationVariation = pmOperation.clone({
          newId: camelCase(variationName),
          name: variationName
        })
        this.injectVariations(operationVariation, oaOperation, variation, variationMeta)
        this.addToLocalCollection(operationVariation, folderId, folderName)
      }
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

  public injectFuzzRequiredVariation(
    pmOperation: PostmanMappedOperation,
    oaOperation: OasMappedOperation | null,
    variation: VariationConfig,
    variationMeta: VariationTestConfig | IntegrationTest | null,
    fuzzItems: FuzzingSchemaItems | null
  ): void {
    const fuzzingSet = variation?.fuzzing || []
    // Early exit if no fuzzingSet defined
    if (fuzzingSet.length === 0) return

    // Early exit if no required fields defined
    const requiredFields = fuzzItems?.requiredFields || []
    if (requiredFields.length === 0) return

    const folderId = pmOperation.getParentFolderId()
    const folderName = pmOperation.getParentFolderName()
    const clonedVariation = JSON.parse(JSON.stringify(variation))

    fuzzingSet.map(fuzz => {
      if (fuzz?.requestBody?.requiredFields?.enabled === true) {
        requiredFields.forEach(requiredField => {
          // Set Pm request name
          const variationFuzzName = `${pmOperation.item.name}[${variation.name}][required ${requiredField}]`

          const operationVariation = pmOperation.clone({
            newId: camelCase(variationFuzzName),
            name: variationFuzzName
          })

          // Remove requiredField from Postman operation
          const newVariation = JSON.parse(JSON.stringify(clonedVariation))
          if (!newVariation?.overwrites) newVariation.overwrites = []
          const fuzzRequestBody = { key: requiredField, remove: true } as OverwriteRequestBodyConfig
          const idx = newVariation.overwrites.findIndex(obj => obj.overwriteRequestBody)
          if (idx === -1) {
            newVariation.overwrites.push = { overwriteRequestBody: [fuzzRequestBody] }
          } else {
            newVariation.overwrites[idx].overwriteRequestBody.push(fuzzRequestBody)
          }

          this.injectVariations(operationVariation, oaOperation, newVariation, variationMeta)
          this.addToLocalCollection(operationVariation, folderId, folderName)
        })
      }
    })
  }

  public injectFuzzMinimumVariation(
    pmOperation: PostmanMappedOperation,
    oaOperation: OasMappedOperation | null,
    variation: VariationConfig,
    variationMeta: VariationTestConfig | IntegrationTest | null,
    fuzzItems: FuzzingSchemaItems | null
  ): void {
    const fuzzingSet = variation?.fuzzing || []
    // Early exit if no fuzzingSet defined
    if (fuzzingSet.length === 0) return

    // Early exit if no fuzzing fields detected
    const minimumNumberFields = fuzzItems?.minimumNumberFields || []
    if (minimumNumberFields.length === 0) return

    const folderId = pmOperation.getParentFolderId()
    const folderName = pmOperation.getParentFolderName()
    const clonedVariation = JSON.parse(JSON.stringify(variation))

    fuzzingSet.map(fuzz => {
      if (fuzz?.requestBody?.minimumNumberFields?.enabled === true) {
        minimumNumberFields.forEach(field => {
          // Set Pm request name
          const variationFuzzName = `${pmOperation.item.name}[${variation.name}][minimum number value ${field.field}]`

          // Transform to number
          const numberVal =
            typeof field.value === 'number' ? field.value - 1 : parseInt(field.value) - 1

          const operationVariation = pmOperation.clone({
            newId: camelCase(variationFuzzName),
            name: variationFuzzName
          })

          // Change the minimum value from Postman the request body
          const newVariation = JSON.parse(JSON.stringify(clonedVariation))
          if (!newVariation?.overwrites) newVariation.overwrites = []
          const fuzzRequestBody = {
            key: field.path,
            value: numberVal,
            overwrite: true
          } as OverwriteRequestBodyConfig
          const idx = newVariation.overwrites.findIndex(obj => obj.overwriteRequestBody)
          if (idx === -1) {
            newVariation.overwrites.push = { overwriteRequestBody: [fuzzRequestBody] }
          } else {
            newVariation.overwrites[idx].overwriteRequestBody.push(fuzzRequestBody)
          }

          this.injectVariations(operationVariation, oaOperation, newVariation, variationMeta)
          this.addToLocalCollection(operationVariation, folderId, folderName)
        })
      }
    })
  }

  public injectFuzzMaximumVariation(
    pmOperation: PostmanMappedOperation,
    oaOperation: OasMappedOperation | null,
    variation: VariationConfig,
    variationMeta: VariationTestConfig | IntegrationTest | null,
    fuzzItems: FuzzingSchemaItems | null
  ): void {
    const fuzzingSet = variation?.fuzzing || []
    // Early exit if no fuzzingSet defined
    if (fuzzingSet.length === 0) return

    // Early exit if no fuzzing fields defined
    const maximumNumberFields = fuzzItems?.maximumNumberFields || []
    if (maximumNumberFields.length === 0) return

    const folderId = pmOperation.getParentFolderId()
    const folderName = pmOperation.getParentFolderName()
    const clonedVariation = JSON.parse(JSON.stringify(variation))

    fuzzingSet.map(fuzz => {
      if (fuzz?.requestBody?.maximumNumberFields?.enabled === true) {
        maximumNumberFields.forEach(field => {
          // Set Pm request name
          const variationFuzzName = `${pmOperation.item.name}[${variation.name}][maximum number value ${field.field}]`

          // Transform to number
          const numberVal =
            typeof field.value === 'number' ? field.value + 1 : parseInt(field.value) + 1

          const operationVariation = pmOperation.clone({
            newId: camelCase(variationFuzzName),
            name: variationFuzzName
          })

          // Change the maximum value from Postman the request body
          const newVariation = JSON.parse(JSON.stringify(clonedVariation))
          if (!newVariation?.overwrites) newVariation.overwrites = []
          const fuzzRequestBody = {
            key: field.path,
            value: numberVal,
            overwrite: true
          } as OverwriteRequestBodyConfig
          const idx = newVariation.overwrites.findIndex(obj => obj.overwriteRequestBody)
          if (idx === -1) {
            newVariation.overwrites.push = { overwriteRequestBody: [fuzzRequestBody] }
          } else {
            newVariation.overwrites[idx].overwriteRequestBody.push(fuzzRequestBody)
          }

          this.injectVariations(operationVariation, oaOperation, newVariation, variationMeta)
          this.addToLocalCollection(operationVariation, folderId, folderName)
        })
      }
    })
  }

  public injectFuzzMinLengthVariation(
    pmOperation: PostmanMappedOperation,
    oaOperation: OasMappedOperation | null,
    variation: VariationConfig,
    variationMeta: VariationTestConfig | IntegrationTest | null,
    fuzzItems: FuzzingSchemaItems | null
  ): void {
    const fuzzingSet = variation?.fuzzing || []
    // Early exit if request body is not defined
    if (!pmOperation.item?.request?.body?.raw) return

    // Early exit if no fuzzingSet defined
    if (fuzzingSet.length === 0) return

    // Early exit if no fuzzing fields detected
    const minLengthFields = fuzzItems?.minLengthFields || []
    if (minLengthFields.length === 0) return

    const folderId = pmOperation.getParentFolderId()
    const folderName = pmOperation.getParentFolderName()
    const clonedVariation = JSON.parse(JSON.stringify(variation))

    fuzzingSet.map(fuzz => {
      if (fuzz?.requestBody?.minLengthFields?.enabled === true) {
        minLengthFields.forEach(field => {
          // Set Pm request name
          const variationFuzzName = `${pmOperation.item.name}[${variation.name}][minimum length ${field.field}]`

          // Get request body value
          const reqBodyObj = JSON.parse(pmOperation?.item?.request?.body?.raw || '')
          const reqBodyValue = getByPath(reqBodyObj, field.path)
          // const reqBodyValueLength = reqBodyValue?.toString().length || 0

          // Change length of value
          if (typeof reqBodyValue === 'number' && typeof field.value === 'number') {
            field.value = reqBodyValue / (10 * field.value)
          }
          if (typeof reqBodyValue === 'string' && typeof field.value === 'number') {
            field.value = reqBodyValue.substring(0, field.value - 1)
          }

          const operationVariation = pmOperation.clone({
            newId: camelCase(variationFuzzName),
            name: variationFuzzName
          })

          // Change the minimum value from Postman the request body
          const newVariation = JSON.parse(JSON.stringify(clonedVariation))
          if (!newVariation?.overwrites) newVariation.overwrites = []
          const fuzzRequestBody = {
            key: field.path,
            value: field.value,
            overwrite: true
          } as OverwriteRequestBodyConfig
          const idx = newVariation.overwrites.findIndex(obj => obj.overwriteRequestBody)
          if (idx === -1) {
            newVariation.overwrites.push = { overwriteRequestBody: [fuzzRequestBody] }
          } else {
            newVariation.overwrites[idx].overwriteRequestBody.push(fuzzRequestBody)
          }

          this.injectVariations(operationVariation, oaOperation, newVariation, variationMeta)
          this.addToLocalCollection(operationVariation, folderId, folderName)
        })
      }
    })
  }

  public injectFuzzMaxLengthVariation(
    pmOperation: PostmanMappedOperation,
    oaOperation: OasMappedOperation | null,
    variation: VariationConfig,
    variationMeta: VariationTestConfig | IntegrationTest | null,
    fuzzItems: FuzzingSchemaItems | null
  ): void {
    const fuzzingSet = variation?.fuzzing || []
    // Early exit if request body is not defined
    if (!pmOperation.item?.request?.body?.raw) return

    // Early exit if no fuzzingSet defined
    if (fuzzingSet.length === 0) return

    // Early exit if no fuzzing fields detected
    const maxLengthFields = fuzzItems?.maxLengthFields || []
    if (maxLengthFields.length === 0) return

    const folderId = pmOperation.getParentFolderId()
    const folderName = pmOperation.getParentFolderName()
    const clonedVariation = JSON.parse(JSON.stringify(variation))

    fuzzingSet.map(fuzz => {
      if (fuzz?.requestBody?.maxLengthFields?.enabled === true) {
        maxLengthFields.forEach(field => {
          // Set Pm request name
          const variationFuzzName = `${pmOperation.item.name}[${variation.name}][maximum length ${field.field}]`

          // Get request body value
          const reqBodyObj = JSON.parse(pmOperation?.item?.request?.body?.raw || '')
          const reqBodyValue = getByPath(reqBodyObj, field.path)
          const reqBodyValueLength = reqBodyValue?.toString().length || 0

          // Change length of value
          if (typeof reqBodyValue === 'number' && typeof field.value === 'number') {
            field.value = reqBodyValue * (10 * (reqBodyValueLength - field.value))
          }
          if (typeof reqBodyValue === 'string') {
            field.value =
              reqBodyValue + new Array(reqBodyValueLength + 1).join(reqBodyValue.charAt(0))
          }

          const operationVariation = pmOperation.clone({
            newId: camelCase(variationFuzzName),
            name: variationFuzzName
          })

          // Change the minimum value from Postman the request body
          const newVariation = JSON.parse(JSON.stringify(clonedVariation))
          if (!newVariation?.overwrites) newVariation.overwrites = []
          const fuzzRequestBody = {
            key: field.path,
            value: field.value,
            overwrite: true
          } as OverwriteRequestBodyConfig
          const idx = newVariation.overwrites.findIndex(obj => obj.overwriteRequestBody)
          if (idx === -1) {
            newVariation.overwrites.push = { overwriteRequestBody: [fuzzRequestBody] }
          } else {
            newVariation.overwrites[idx].overwriteRequestBody.push(fuzzRequestBody)
          }

          this.injectVariations(operationVariation, oaOperation, newVariation, variationMeta)
          this.addToLocalCollection(operationVariation, folderId, folderName)
        })
      }
    })
  }

  public analyzeFuzzJsonSchema(
    jsonSchema: OpenAPIV3.SchemaObject | undefined
  ): FuzzingSchemaItems | void {
    if (!jsonSchema) return

    const fuzzItems = {
      requiredFields: [],
      minimumNumberFields: [],
      maximumNumberFields: [],
      minLengthFields: [],
      maxLengthFields: []
    } as FuzzingSchemaItems

    fuzzItems.requiredFields = jsonSchema?.required || []

    traverse(jsonSchema.properties).forEach(function (node) {
      // Register all fuzz-able items
      if (node.minimum) {
        fuzzItems?.minimumNumberFields?.push({
          path: this.path.join('.'),
          field: this.key,
          value: node.minimum
        })
      }
      if (node.maximum) {
        fuzzItems?.maximumNumberFields?.push({
          path: this.path.join('.'),
          field: this.key,
          value: node.maximum
        })
      }
      if (node.minLength) {
        fuzzItems?.minLengthFields?.push({
          path: this.path.join('.'),
          field: this.key,
          value: node.minLength
        })
      }
      if (node.maxLength) {
        fuzzItems?.maxLengthFields?.push({
          path: this.path.join('.'),
          field: this.key,
          value: node.maxLength
        })
      }
    })

    return fuzzItems
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
