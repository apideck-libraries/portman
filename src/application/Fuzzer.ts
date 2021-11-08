import { camelCase } from 'camel-case'
import { OasMappedOperation } from 'src/oas'
import { PostmanMappedOperation } from '../postman'
import {
  FuzzingSchemaItems,
  IntegrationTest,
  OverwriteRequestBodyConfig,
  VariationConfig,
  VariationTestConfig
} from '../types'
import traverse from 'traverse'
import { TestSuite, VariationWriter } from './'
import { OpenAPIV3 } from 'openapi-types'
import { getByPath } from '../utils'

export type FuzzerOptions = {
  testSuite: TestSuite
  variationWriter: VariationWriter
}

export class Fuzzer {
  testSuite: TestSuite
  variationWriter: VariationWriter
  public fuzzVariations: any[]

  constructor(options: FuzzerOptions) {
    const { testSuite, variationWriter } = options
    this.testSuite = testSuite
    this.variationWriter = variationWriter
    this.fuzzVariations = []
  }

  public injectFuzzVariations(
    pmOperation: PostmanMappedOperation,
    oaOperation: OasMappedOperation | null,
    variation: VariationConfig,
    variationMeta: VariationTestConfig | IntegrationTest | null
  ): void {
    const fuzzingSet = variation?.fuzzing || []
    // Early exit if no fuzzingSet defined
    if (fuzzingSet.length === 0) return

    // No request body defined
    if (!oaOperation?.schema?.requestBody) return

    // Analyse JSON schema
    const reqBody = oaOperation?.schema?.requestBody as unknown as OpenAPIV3.RequestBodyObject
    const schema = reqBody?.content?.['application/json']?.schema as OpenAPIV3.SchemaObject
    const fuzzItems = this.analyzeFuzzJsonSchema(schema) || {}

    // Loop over all the fuzzing configurations
    fuzzingSet.map(fuzz => {
      if (fuzz?.requestBody?.requiredFields?.enabled === true) {
        this.injectFuzzRequiredVariation(
          pmOperation,
          oaOperation,
          variation,
          variationMeta,
          fuzzItems
        )
      }

      if (fuzz?.requestBody?.minimumNumberFields?.enabled === true) {
        this.injectFuzzMinimumVariation(
          pmOperation,
          oaOperation,
          variation,
          variationMeta,
          fuzzItems
        )
      }

      if (fuzz?.requestBody?.maximumNumberFields?.enabled === true) {
        this.injectFuzzMaximumVariation(
          pmOperation,
          oaOperation,
          variation,
          variationMeta,
          fuzzItems
        )
      }

      if (fuzz?.requestBody?.minLengthFields?.enabled === true) {
        this.injectFuzzMinLengthVariation(
          pmOperation,
          oaOperation,
          variation,
          variationMeta,
          fuzzItems
        )
      }

      if (fuzz?.requestBody?.maxLengthFields?.enabled === true) {
        this.injectFuzzMaxLengthVariation(
          pmOperation,
          oaOperation,
          variation,
          variationMeta,
          fuzzItems
        )
      }
    })
  }

  public injectFuzzRequiredVariation(
    pmOperation: PostmanMappedOperation,
    oaOperation: OasMappedOperation | null,
    variation: VariationConfig,
    variationMeta: VariationTestConfig | IntegrationTest | null,
    fuzzItems: FuzzingSchemaItems | null
  ): void {
    // Early exit if no required fields defined
    const requiredFields = fuzzItems?.requiredFields || []
    if (requiredFields.length === 0) return

    const clonedVariation = JSON.parse(JSON.stringify(variation))

    requiredFields.map(requiredField => {
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
      this.addOverwriteRequestBody(newVariation, fuzzRequestBody)

      this.variationWriter.injectVariations(
        operationVariation,
        oaOperation,
        newVariation,
        variationMeta
      )

      // Build up list of Fuzz Variations
      this.fuzzVariations.push(operationVariation)
    })
  }

  public injectFuzzMinimumVariation(
    pmOperation: PostmanMappedOperation,
    oaOperation: OasMappedOperation | null,
    variation: VariationConfig,
    variationMeta: VariationTestConfig | IntegrationTest | null,
    fuzzItems: FuzzingSchemaItems | null
  ): void {
    // Early exit if no fuzzing fields detected
    const minimumNumberFields = fuzzItems?.minimumNumberFields || []
    if (minimumNumberFields.length === 0) return

    const clonedVariation = JSON.parse(JSON.stringify(variation))

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

      // Change the value of the Postman request body
      const newVariation = JSON.parse(JSON.stringify(clonedVariation))
      if (!newVariation?.overwrites) newVariation.overwrites = []
      const fuzzRequestBody = {
        key: field.path,
        value: numberVal,
        overwrite: true
      } as OverwriteRequestBodyConfig
      this.addOverwriteRequestBody(newVariation, fuzzRequestBody)

      this.variationWriter.injectVariations(
        operationVariation,
        oaOperation,
        newVariation,
        variationMeta
      )

      // Build up list of Fuzz Variations
      this.fuzzVariations.push(operationVariation)
    })
  }

  public injectFuzzMaximumVariation(
    pmOperation: PostmanMappedOperation,
    oaOperation: OasMappedOperation | null,
    variation: VariationConfig,
    variationMeta: VariationTestConfig | IntegrationTest | null,
    fuzzItems: FuzzingSchemaItems | null
  ): void {
    // Early exit if no fuzzing fields defined
    const maximumNumberFields = fuzzItems?.maximumNumberFields || []
    if (maximumNumberFields.length === 0) return

    const clonedVariation = JSON.parse(JSON.stringify(variation))

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

      // Change the value of the Postman request body
      const newVariation = JSON.parse(JSON.stringify(clonedVariation))
      if (!newVariation?.overwrites) newVariation.overwrites = []
      const fuzzRequestBody = {
        key: field.path,
        value: numberVal,
        overwrite: true
      } as OverwriteRequestBodyConfig
      this.addOverwriteRequestBody(newVariation, fuzzRequestBody)

      this.variationWriter.injectVariations(
        operationVariation,
        oaOperation,
        newVariation,
        variationMeta
      )

      // Build up list of Fuzz Variations
      this.fuzzVariations.push(operationVariation)
    })
  }

  public injectFuzzMinLengthVariation(
    pmOperation: PostmanMappedOperation,
    oaOperation: OasMappedOperation | null,
    variation: VariationConfig,
    variationMeta: VariationTestConfig | IntegrationTest | null,
    fuzzItems: FuzzingSchemaItems | null
  ): void {
    // Early exit if no fuzzing fields detected
    const minLengthFields = fuzzItems?.minLengthFields || []
    if (minLengthFields.length === 0) return

    const clonedVariation = JSON.parse(JSON.stringify(variation))

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

      // Change the length of the Postman the request body
      const newVariation = JSON.parse(JSON.stringify(clonedVariation))
      if (!newVariation?.overwrites) newVariation.overwrites = []
      const fuzzRequestBody = {
        key: field.path,
        value: field.value,
        overwrite: true
      } as OverwriteRequestBodyConfig
      this.addOverwriteRequestBody(newVariation, fuzzRequestBody)

      this.variationWriter.injectVariations(
        operationVariation,
        oaOperation,
        newVariation,
        variationMeta
      )

      // Build up list of Fuzz Variations
      this.fuzzVariations.push(operationVariation)
    })
  }

  public injectFuzzMaxLengthVariation(
    pmOperation: PostmanMappedOperation,
    oaOperation: OasMappedOperation | null,
    variation: VariationConfig,
    variationMeta: VariationTestConfig | IntegrationTest | null,
    fuzzItems: FuzzingSchemaItems | null
  ): void {
    // Early exit if no fuzzing fields detected
    const maxLengthFields = fuzzItems?.maxLengthFields || []
    if (maxLengthFields.length === 0) return

    const clonedVariation = JSON.parse(JSON.stringify(variation))

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
        field.value = reqBodyValue + new Array(reqBodyValueLength + 1).join(reqBodyValue.charAt(0))
      }

      const operationVariation = pmOperation.clone({
        newId: camelCase(variationFuzzName),
        name: variationFuzzName
      })

      // Change the length of the Postman the request body
      const newVariation = JSON.parse(JSON.stringify(clonedVariation))
      if (!newVariation?.overwrites) newVariation.overwrites = []
      const fuzzRequestBody = {
        key: field.path,
        value: field.value,
        overwrite: true
      } as OverwriteRequestBodyConfig
      this.addOverwriteRequestBody(newVariation, fuzzRequestBody)

      this.variationWriter.injectVariations(
        operationVariation,
        oaOperation,
        newVariation,
        variationMeta
      )

      // Build up list of Fuzz Variations
      this.fuzzVariations.push(operationVariation)
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
      if (node?.minimum) {
        fuzzItems?.minimumNumberFields?.push({
          path: this.path.join('.'),
          field: this.key,
          value: node.minimum
        })
      }
      if (node?.maximum) {
        fuzzItems?.maximumNumberFields?.push({
          path: this.path.join('.'),
          field: this.key,
          value: node.maximum
        })
      }
      if (node?.minLength) {
        fuzzItems?.minLengthFields?.push({
          path: this.path.join('.'),
          field: this.key,
          value: node.minLength
        })
      }
      if (node?.maxLength) {
        fuzzItems?.maxLengthFields?.push({
          path: this.path.join('.'),
          field: this.key,
          value: node.maxLength
        })
      }
    })

    return fuzzItems
  }

  /**
   * Add an OverwriteRequestBodyConfig to a variation
   * @param variation
   * @param fuzzRequestBody
   */
  public addOverwriteRequestBody(
    variation: VariationConfig,
    fuzzRequestBody: OverwriteRequestBodyConfig
  ): VariationConfig {
    const idx = variation.overwrites.findIndex(obj => obj.overwriteRequestBody)
    if (idx === -1) {
      variation.overwrites.push({ overwriteRequestBody: [fuzzRequestBody] })
    } else {
      variation.overwrites[idx].overwriteRequestBody.push(fuzzRequestBody)
    }
    return variation
  }
}
