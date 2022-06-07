import { camelCase } from 'camel-case'
import { OasMappedOperation } from 'src/oas'
import { PostmanMappedOperation } from '../postman'
import {
  fuzzingConfig,
  FuzzingSchemaItems,
  fuzzRequestBody,
  fuzzRequestHeader,
  fuzzRequestQueryParam,
  IntegrationTest,
  OverwriteQueryParamConfig,
  OverwriteRequestBodyConfig,
  OverwriteRequestHeadersConfig,
  PortmanFuzzTypes,
  PortmanTestTypes,
  VariationConfig,
  VariationTestConfig
} from '../types'
import traverse from 'traverse'
import { TestSuite, VariationWriter } from './'
import { OpenAPIV3 } from 'openapi-types'
import { getByPath, getJsonContentType } from '../utils'
import { QueryParam } from 'postman-collection'
import { PostmanDynamicVarGenerator } from '../services/PostmanDynamicVarGenerator'

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

  public injectFuzzRequestBodyVariations(
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

    // Analyse request body & content-type
    const reqBody = oaOperation?.schema?.requestBody as unknown as OpenAPIV3.RequestBodyObject
    const jsonContentType = getJsonContentType(Object.keys(reqBody?.content))

    // No JSON content-type defined
    if (!jsonContentType) return

    // Analyse JSON schema
    const schema = reqBody?.content?.[jsonContentType]?.schema as OpenAPIV3.SchemaObject
    const fuzzItems = this.analyzeFuzzJsonSchema(schema)

    const fuzzReqBodySet = fuzzingSet.filter(fuzz => fuzz?.requestBody) as fuzzingConfig[]

    // Loop over all the fuzzing configurations
    fuzzReqBodySet.map(fuzzItem => {
      const fuzzSet = fuzzItem?.requestBody as fuzzRequestBody[]
      fuzzSet.map(fuzz => {
        if (fuzz?.requiredFields?.enabled === true) {
          this.injectFuzzRequiredVariation(
            pmOperation,
            oaOperation,
            variation,
            variationMeta,
            fuzzItems
          )
        }

        if (fuzz?.minimumNumberFields?.enabled === true) {
          this.injectFuzzMinimumVariation(
            pmOperation,
            oaOperation,
            variation,
            variationMeta,
            fuzzItems
          )
        }

        if (fuzz?.maximumNumberFields?.enabled === true) {
          this.injectFuzzMaximumVariation(
            pmOperation,
            oaOperation,
            variation,
            variationMeta,
            fuzzItems
          )
        }

        if (fuzz?.minLengthFields?.enabled === true) {
          this.injectFuzzMinLengthVariation(
            pmOperation,
            oaOperation,
            variation,
            variationMeta,
            fuzzItems
          )
        }

        if (fuzz?.maxLengthFields?.enabled === true) {
          this.injectFuzzMaxLengthVariation(
            pmOperation,
            oaOperation,
            variation,
            variationMeta,
            fuzzItems
          )
        }
      })
    })
  }

  public injectFuzzRequestQueryParamsVariations(
    pmOperation: PostmanMappedOperation,
    oaOperation: OasMappedOperation | null,
    variation: VariationConfig,
    variationMeta: VariationTestConfig | IntegrationTest | null
  ): void {
    const fuzzingSet = variation?.fuzzing || []
    // Early exit if no fuzzingSet defined
    if (fuzzingSet.length === 0) return

    // No request query params defined
    if (!oaOperation?.queryParams) return

    const reqQueryParams = oaOperation?.queryParams as unknown as OpenAPIV3.ParameterObject[]
    reqQueryParams.map(queryParam => {
      // Analyse query param schema
      const fuzzItems = this.analyzeQuerySchema(queryParam)

      const fuzzQueryParamSet = fuzzingSet.filter(fuzz => fuzz?.requestQueryParams)

      // Loop over all the fuzzing configurations
      fuzzQueryParamSet.map(fuzzItem => {
        const fuzzSet = fuzzItem?.requestQueryParams as fuzzRequestQueryParam[]
        fuzzSet.map(fuzz => {
          if (fuzz?.requiredFields?.enabled === true) {
            this.injectFuzzRequiredVariation(
              pmOperation,
              oaOperation,
              variation,
              variationMeta,
              fuzzItems
            )
          }

          if (fuzz?.minimumNumberFields?.enabled === true) {
            this.injectFuzzMinimumVariation(
              pmOperation,
              oaOperation,
              variation,
              variationMeta,
              fuzzItems
            )
          }

          if (fuzz?.maximumNumberFields?.enabled === true) {
            this.injectFuzzMaximumVariation(
              pmOperation,
              oaOperation,
              variation,
              variationMeta,
              fuzzItems
            )
          }

          if (fuzz?.minLengthFields?.enabled === true) {
            this.injectFuzzMinLengthVariation(
              pmOperation,
              oaOperation,
              variation,
              variationMeta,
              fuzzItems
            )
          }

          if (fuzz?.maxLengthFields?.enabled === true) {
            this.injectFuzzMaxLengthVariation(
              pmOperation,
              oaOperation,
              variation,
              variationMeta,
              fuzzItems
            )
          }
        })
      })
    })
  }

  public injectFuzzRequestHeadersVariations(
    pmOperation: PostmanMappedOperation,
    oaOperation: OasMappedOperation | null,
    variation: VariationConfig,
    variationMeta: VariationTestConfig | IntegrationTest | null
  ): void {
    const fuzzingSet = variation?.fuzzing || []
    // Early exit if no fuzzingSet defined
    if (fuzzingSet.length === 0) return

    // No request headers defined
    if (!oaOperation?.requestHeaders) return

    const reqHeaders = oaOperation?.requestHeaders as unknown as OpenAPIV3.ParameterObject[]
    reqHeaders.map(header => {
      // Analyse header schema
      const fuzzItems = this.analyzeHeaderSchema(header)

      const fuzzHeaderSet = fuzzingSet.filter(fuzz => fuzz?.requestHeaders)

      // Loop over all the fuzzing configurations
      fuzzHeaderSet.map(fuzzItem => {
        const fuzzSet = fuzzItem?.requestHeaders as fuzzRequestHeader[]
        fuzzSet.map(fuzz => {
          if (fuzz?.requiredFields?.enabled === true) {
            this.injectFuzzRequiredVariation(
              pmOperation,
              oaOperation,
              variation,
              variationMeta,
              fuzzItems
            )
          }

          if (fuzz?.minimumNumberFields?.enabled === true) {
            this.injectFuzzMinimumVariation(
              pmOperation,
              oaOperation,
              variation,
              variationMeta,
              fuzzItems
            )
          }

          if (fuzz?.maximumNumberFields?.enabled === true) {
            this.injectFuzzMaximumVariation(
              pmOperation,
              oaOperation,
              variation,
              variationMeta,
              fuzzItems
            )
          }

          if (fuzz?.minLengthFields?.enabled === true) {
            this.injectFuzzMinLengthVariation(
              pmOperation,
              oaOperation,
              variation,
              variationMeta,
              fuzzItems
            )
          }

          if (fuzz?.maxLengthFields?.enabled === true) {
            this.injectFuzzMaxLengthVariation(
              pmOperation,
              oaOperation,
              variation,
              variationMeta,
              fuzzItems
            )
          }
        })
      })
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

      // Clone postman operation as new variation operation
      const operationVariation = pmOperation.clone({
        newId: camelCase(variationFuzzName),
        name: variationFuzzName
      })

      // Set/Update Portman operation test type
      this.testSuite.registerOperationTestType(
        operationVariation,
        PortmanTestTypes.variation,
        false
      )

      // Remove requiredField from Postman operation
      const newVariation = JSON.parse(JSON.stringify(clonedVariation))
      if (!newVariation?.overwrites) newVariation.overwrites = []

      if (fuzzItems?.fuzzType === PortmanFuzzTypes.requestBody) {
        const fuzzRequestBody = { key: requiredField, remove: true } as OverwriteRequestBodyConfig
        this.addOverwriteRequestBody(newVariation, fuzzRequestBody)
      }

      if (fuzzItems?.fuzzType === PortmanFuzzTypes.requestQueryParam) {
        const fuzzRequestQueryParam = {
          key: requiredField,
          remove: true
        } as OverwriteQueryParamConfig
        this.addOverwriteRequestQueryParam(newVariation, fuzzRequestQueryParam)
      }

      if (fuzzItems?.fuzzType === PortmanFuzzTypes.requestHeader) {
        const fuzzRequestHeader = {
          key: requiredField,
          remove: true
        } as OverwriteRequestHeadersConfig
        this.addOverwriteRequestHeader(newVariation, fuzzRequestHeader)
      }

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
    // Early exit if no fuzzing fields defined
    const minimumNumberFields = fuzzItems?.minimumNumberFields || []
    if (minimumNumberFields.length === 0) return
    if (
      !(PortmanFuzzTypes.requestBody === fuzzItems?.fuzzType) &&
      !(PortmanFuzzTypes.requestQueryParam === fuzzItems?.fuzzType) &&
      !(PortmanFuzzTypes.requestHeader === fuzzItems?.fuzzType)
    )
      return

    const clonedVariation = JSON.parse(JSON.stringify(variation))

    minimumNumberFields.forEach(field => {
      // Set Pm request name
      const variationFuzzName = `${pmOperation.item.name}[${variation.name}][minimum number value ${field.path}]`

      // Transform to number
      const numberVal = typeof field.value === 'number' ? field.value - 1 : Number(field.value) - 1

      // Clone postman operation as new variation operation
      const operationVariation = pmOperation.clone({
        newId: camelCase(variationFuzzName),
        name: variationFuzzName
      })

      // Set/Update Portman operation test type
      this.testSuite.registerOperationTestType(
        operationVariation,
        PortmanTestTypes.variation,
        false
      )

      // Change the value of the Postman the request property
      const newVariation = JSON.parse(JSON.stringify(clonedVariation))
      if (!newVariation?.overwrites) newVariation.overwrites = []

      if (fuzzItems?.fuzzType === PortmanFuzzTypes.requestBody) {
        const fuzzRequestBody = {
          key: field.path,
          value: numberVal,
          overwrite: true
        } as OverwriteRequestBodyConfig
        this.addOverwriteRequestBody(newVariation, fuzzRequestBody)
      }

      if (fuzzItems?.fuzzType === PortmanFuzzTypes.requestQueryParam) {
        const fuzzRequestQueryParam = {
          key: field.path,
          value: numberVal.toString(), // Query params should passed as string to Postman
          overwrite: true
        } as unknown as OverwriteQueryParamConfig
        this.addOverwriteRequestQueryParam(newVariation, fuzzRequestQueryParam)
      }

      if (fuzzItems?.fuzzType === PortmanFuzzTypes.requestHeader) {
        const fuzzRequestHeader = {
          key: field.path,
          value: numberVal.toString(),
          overwrite: true
        } as OverwriteRequestHeadersConfig
        this.addOverwriteRequestHeader(newVariation, fuzzRequestHeader)
      }

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
    if (
      !(PortmanFuzzTypes.requestBody === fuzzItems?.fuzzType) &&
      !(PortmanFuzzTypes.requestQueryParam === fuzzItems?.fuzzType) &&
      !(PortmanFuzzTypes.requestHeader === fuzzItems?.fuzzType)
    )
      return

    const clonedVariation = JSON.parse(JSON.stringify(variation))

    maximumNumberFields.forEach(field => {
      // Set Pm request name
      const variationFuzzName = `${pmOperation.item.name}[${variation.name}][maximum number value ${field.path}]`

      // Transform to number
      const numberVal = typeof field.value === 'number' ? field.value + 1 : Number(field.value) + 1

      // Clone postman operation as new variation operation
      const operationVariation = pmOperation.clone({
        newId: camelCase(variationFuzzName),
        name: variationFuzzName
      })

      // Set/Update Portman operation test type
      this.testSuite.registerOperationTestType(
        operationVariation,
        PortmanTestTypes.variation,
        false
      )

      // Change the value of the Postman the request property
      const newVariation = JSON.parse(JSON.stringify(clonedVariation))
      if (!newVariation?.overwrites) newVariation.overwrites = []

      if (fuzzItems?.fuzzType === PortmanFuzzTypes.requestBody) {
        const fuzzRequestBody = {
          key: field.path,
          value: numberVal,
          overwrite: true
        } as OverwriteRequestBodyConfig
        this.addOverwriteRequestBody(newVariation, fuzzRequestBody)
      }

      if (fuzzItems?.fuzzType === PortmanFuzzTypes.requestQueryParam) {
        const fuzzRequestQueryParam = {
          key: field.path,
          value: numberVal.toString(), // Query params should passed as string to Postman
          overwrite: true
        } as unknown as OverwriteQueryParamConfig
        this.addOverwriteRequestQueryParam(newVariation, fuzzRequestQueryParam)
      }

      if (fuzzItems?.fuzzType === PortmanFuzzTypes.requestHeader) {
        const fuzzRequestHeader = {
          key: field.path,
          value: numberVal.toString(),
          overwrite: true
        } as OverwriteRequestHeadersConfig
        this.addOverwriteRequestHeader(newVariation, fuzzRequestHeader)
      }

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
    if (
      !(PortmanFuzzTypes.requestBody === fuzzItems?.fuzzType) &&
      !(PortmanFuzzTypes.requestQueryParam === fuzzItems?.fuzzType) &&
      !(PortmanFuzzTypes.requestHeader === fuzzItems?.fuzzType)
    )
      return

    const clonedVariation = JSON.parse(JSON.stringify(variation))

    minLengthFields.forEach(field => {
      // Set Pm request name
      const variationFuzzName = `${pmOperation.item.name}[${variation.name}][minimum length ${field.path}]`

      let reqObj, reqValue
      if (fuzzItems?.fuzzType === PortmanFuzzTypes.requestBody) {
        // Get request body value
        reqObj = JSON.parse(pmOperation?.item?.request?.body?.raw || '')
        reqValue = getByPath(reqObj, field.path)
        // reqValueLength = reqValue?.toString().length || 0
      }

      if (fuzzItems?.fuzzType === PortmanFuzzTypes.requestQueryParam) {
        // Get request query param value
        const queryParams = JSON.parse(JSON.stringify(pmOperation.item.request.url.query))
        const pmQueryParam = queryParams.find(obj => {
          return obj.key === field.field
        }) as QueryParam
        reqValue = pmQueryParam?.value
        // reqValueLength = reqValue?.toString().length || 0
      }

      if (fuzzItems?.fuzzType === PortmanFuzzTypes.requestHeader) {
        // Get request header value
        const reqHeaders = JSON.parse(JSON.stringify(pmOperation.item.request.headers))
        const pmHeader = reqHeaders.find(obj => {
          return obj.key === field.field
        }) as QueryParam
        reqValue = pmHeader?.value
        // reqValueLength = reqValue?.toString().length || 0
      }

      // Detect & Replace Postman dynamic variables
      if (typeof reqValue === 'string' && reqValue.includes('{{') && reqValue.includes('}}')) {
        if (reqValue.includes('{{$')) {
          const pmVarGen = new PostmanDynamicVarGenerator()
          reqValue = pmVarGen.replaceDynamicVar(reqValue)
        } else {
          // Plain Postman variable, let skip this
          return
        }
      }

      // Change length of value
      let newLenVal
      if (typeof reqValue === 'number' && typeof field.value === 'number') {
        newLenVal = Number(reqValue.toString().substr(0, field.value - 1)) || 0
      }
      if (typeof reqValue === 'string' && typeof field.value === 'number') {
        newLenVal = reqValue.substring(0, field.value - 1)
      }

      // Clone postman operation as new variation operation
      const operationVariation = pmOperation.clone({
        newId: camelCase(variationFuzzName),
        name: variationFuzzName
      })

      // Set/Update Portman operation test type
      this.testSuite.registerOperationTestType(
        operationVariation,
        PortmanTestTypes.variation,
        false
      )

      // Change the length of the Postman the request property
      const newVariation = JSON.parse(JSON.stringify(clonedVariation))
      if (!newVariation?.overwrites) newVariation.overwrites = []

      if (fuzzItems?.fuzzType === PortmanFuzzTypes.requestBody && newLenVal !== undefined) {
        const fuzzRequestBody = {
          key: field.path,
          value: newLenVal,
          overwrite: true
        } as OverwriteRequestBodyConfig
        this.addOverwriteRequestBody(newVariation, fuzzRequestBody)
      }

      if (fuzzItems?.fuzzType === PortmanFuzzTypes.requestQueryParam && newLenVal !== undefined) {
        const fuzzRequestQueryParam = {
          key: field.path,
          value: newLenVal.toString(), // Query params should passed as string to Postman
          overwrite: true
        } as OverwriteQueryParamConfig
        this.addOverwriteRequestQueryParam(newVariation, fuzzRequestQueryParam)
      }

      if (fuzzItems?.fuzzType === PortmanFuzzTypes.requestHeader) {
        const fuzzRequestHeader = {
          key: field.path,
          value: newLenVal.toString(),
          overwrite: true
        } as OverwriteRequestHeadersConfig
        this.addOverwriteRequestHeader(newVariation, fuzzRequestHeader)
      }

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
    if (
      !(PortmanFuzzTypes.requestBody === fuzzItems?.fuzzType) &&
      !(PortmanFuzzTypes.requestQueryParam === fuzzItems?.fuzzType) &&
      !(PortmanFuzzTypes.requestHeader === fuzzItems?.fuzzType)
    )
      return

    const clonedVariation = JSON.parse(JSON.stringify(variation))

    maxLengthFields.forEach(field => {
      // Set Pm request name
      const variationFuzzName = `${pmOperation.item.name}[${variation.name}][maximum length ${field.path}]`

      let reqObj, reqValue
      if (fuzzItems?.fuzzType === PortmanFuzzTypes.requestBody) {
        // Get request body value
        reqObj = JSON.parse(pmOperation?.item?.request?.body?.raw || '')
        reqValue = getByPath(reqObj, field.path)
        // reqValueLength = reqValue?.toString().length || 0
      }

      if (fuzzItems?.fuzzType === PortmanFuzzTypes.requestQueryParam) {
        // Get request query param value
        const queryParams = JSON.parse(JSON.stringify(pmOperation.item.request.url.query))
        const pmQueryParam = queryParams.find(obj => {
          return obj.key === field.field
        }) as QueryParam
        reqValue = pmQueryParam?.value
        // reqValueLength = reqValue?.toString().length || 0
      }

      if (fuzzItems?.fuzzType === PortmanFuzzTypes.requestHeader) {
        // Get request header value
        const reqHeaders = JSON.parse(JSON.stringify(pmOperation.item.request.headers))
        const pmHeader = reqHeaders.find(obj => {
          return obj.key === field.field
        }) as QueryParam
        reqValue = pmHeader?.value
        // reqValueLength = reqValue?.toString().length || 0
      }

      // Detect & Replace Postman dynamic variables
      if (typeof reqValue === 'string' && reqValue.includes('{{') && reqValue.includes('}}')) {
        if (reqValue.includes('{{$')) {
          const pmVarGen = new PostmanDynamicVarGenerator()
          reqValue = pmVarGen.replaceDynamicVar(reqValue)
        } else {
          // Plain Postman variable, let skip this
          return
        }
      }

      // Change length of value
      if (reqValue && typeof reqValue === 'number' && typeof field.value === 'number') {
        field.value = Number(reqValue.toString().padEnd(field.value + 1, '0')) || reqValue
      }
      if (reqValue && typeof reqValue === 'string' && typeof field.value === 'number' && reqValue) {
        field.value = reqValue.padEnd(field.value + 1, reqValue.charAt(0))
      }

      // Clone postman operation as new variation operation
      const operationVariation = pmOperation.clone({
        newId: camelCase(variationFuzzName),
        name: variationFuzzName
      })

      // Set/Update Portman operation test type
      this.testSuite.registerOperationTestType(
        operationVariation,
        PortmanTestTypes.variation,
        false
      )

      // Change the length of the Postman the request property
      const newVariation = JSON.parse(JSON.stringify(clonedVariation))
      if (!newVariation?.overwrites) newVariation.overwrites = []

      if (fuzzItems?.fuzzType === PortmanFuzzTypes.requestBody && reqValue !== undefined) {
        const fuzzRequestBody = {
          key: field.path,
          value: field.value,
          overwrite: true
        } as OverwriteRequestBodyConfig
        this.addOverwriteRequestBody(newVariation, fuzzRequestBody)
      }

      if (fuzzItems?.fuzzType === PortmanFuzzTypes.requestQueryParam && reqValue !== undefined) {
        const fuzzRequestQueryParam = {
          key: field.path,
          value: field.value.toString(), // Query params should passed as string to Postman
          overwrite: true
        } as OverwriteQueryParamConfig
        this.addOverwriteRequestQueryParam(newVariation, fuzzRequestQueryParam)
      }

      if (fuzzItems?.fuzzType === PortmanFuzzTypes.requestHeader) {
        const fuzzRequestHeader = {
          key: field.path,
          value: field.value.toString(),
          overwrite: true
        } as OverwriteRequestHeadersConfig
        this.addOverwriteRequestHeader(newVariation, fuzzRequestHeader)
      }

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
    originalJsonSchema: OpenAPIV3.SchemaObject | undefined
  ): FuzzingSchemaItems | null {
    const fuzzItems = {
      fuzzType: PortmanFuzzTypes.requestBody,
      requiredFields: [],
      minimumNumberFields: [],
      maximumNumberFields: [],
      minLengthFields: [],
      maxLengthFields: []
    } as FuzzingSchemaItems

    if (!originalJsonSchema) return fuzzItems
    // Copy jsonSchema to keep the original jsonSchema untouched
    const jsonSchema = { ...originalJsonSchema } as OpenAPIV3.SchemaObject

    // Handle allOf properties
    if (jsonSchema.allOf) {
      // Merge allOf properties
      jsonSchema.allOf.forEach(function (s) {
        if ('properties' in s) {
          jsonSchema.properties = Object.assign(jsonSchema.properties || {}, s.properties)
        }
      })
      delete jsonSchema.allOf
    }

    // Handle anyOf properties
    if (jsonSchema.anyOf) {
      // Merge anyOf properties
      jsonSchema.anyOf.forEach(function (s) {
        if ('properties' in s) {
          jsonSchema.properties = Object.assign(jsonSchema.properties || {}, s.properties)
          return
        }
      })
      delete jsonSchema.anyOf
    }

    // Handle oneOf properties
    if (jsonSchema.oneOf) {
      // Merge oneOf properties
      jsonSchema.oneOf.forEach(function (s) {
        if ('properties' in s) {
          jsonSchema.properties = Object.assign(jsonSchema.properties || {}, s.properties)
          return
        }
      })
      delete jsonSchema.oneOf
    }

    const skipSchemaKeys = ['properties', 'items', 'allOf', 'anyOf', 'oneOf']
    traverse(jsonSchema).forEach(function (node) {
      let path = ``

      if (
        node?.minimum ||
        node?.maximum ||
        node?.minLength ||
        node?.maxLength ||
        node?.required ||
        node?.nullable
      ) {
        // Build up fuzzing prop schema path from parents array
        this.parents.forEach(item => {
          // Handle object
          if (item?.key && item?.node?.type === 'object' && !skipSchemaKeys.includes(item?.key)) {
            path += `${item.key}.`
          }
          // Handle array
          if (item?.key && item?.node?.type === 'array') {
            path += `${item.key}[0].`
          }
          // Handle root array
          if (item?.isRoot && item?.node?.type === 'array') {
            path += `[0].`
          }
        })
      }

      if (node?.required) {
        // Build path for nested required properties
        if (node?.type === 'object' && this.key && !skipSchemaKeys.includes(this.key)) {
          path += `${this.key}.`
        }
        // Register fuzz-able required fields
        const requiredFuzz = node.required.map(req => `${path}${req}`)
        fuzzItems.requiredFields = fuzzItems.requiredFields.concat(requiredFuzz) || []
      }

      // Unregister fuzz-able nullable required fields
      if (node?.nullable === true && fuzzItems.requiredFields.length > 0) {
        fuzzItems.requiredFields = fuzzItems.requiredFields.filter(
          item => item !== `${path}${this.key}`
        )
      }

      // Register all fuzz-able items
      if (node?.minimum) {
        fuzzItems?.minimumNumberFields?.push({
          path: `${path}${this.key}`,
          field: this.key,
          value: node.minimum
        })
      }
      if (node?.maximum) {
        fuzzItems?.maximumNumberFields?.push({
          path: `${path}${this.key}`,
          field: this.key,
          value: node.maximum
        })
      }
      if (node?.minLength) {
        fuzzItems?.minLengthFields?.push({
          path: `${path}${this.key}`,
          field: this.key,
          value: node.minLength
        })
      }
      if (node?.maxLength) {
        fuzzItems?.maxLengthFields?.push({
          path: `${path}${this.key}`,
          field: this.key,
          value: node.maxLength
        })
      }
    })

    return fuzzItems
  }

  public analyzeQuerySchema(
    queryParam: OpenAPIV3.ParameterObject | undefined
  ): FuzzingSchemaItems | null {
    const fuzzItems = {
      fuzzType: PortmanFuzzTypes.requestQueryParam,
      requiredFields: [],
      minimumNumberFields: [],
      maximumNumberFields: [],
      minLengthFields: [],
      maxLengthFields: []
    } as FuzzingSchemaItems

    if (!queryParam?.schema || !queryParam.name) return fuzzItems

    const schema = queryParam?.schema as OpenAPIV3.BaseSchemaObject

    // Register all fuzz-able items
    if (queryParam?.required) {
      fuzzItems?.requiredFields?.push(queryParam.name)
    }
    if (schema?.minimum) {
      fuzzItems?.minimumNumberFields?.push({
        path: queryParam.name,
        field: queryParam.name,
        value: schema.minimum
      })
    }
    if (schema?.maximum) {
      fuzzItems?.maximumNumberFields?.push({
        path: queryParam.name,
        field: queryParam.name,
        value: schema.maximum
      })
    }
    if (schema?.minLength) {
      fuzzItems?.minLengthFields?.push({
        path: queryParam.name,
        field: queryParam.name,
        value: schema.minLength
      })
    }
    if (schema?.maxLength) {
      fuzzItems?.maxLengthFields?.push({
        path: queryParam.name,
        field: queryParam.name,
        value: schema.maxLength
      })
    }

    return fuzzItems
  }

  public analyzeHeaderSchema(
    header: OpenAPIV3.ParameterObject | undefined
  ): FuzzingSchemaItems | null {
    const fuzzItems = {
      fuzzType: PortmanFuzzTypes.requestHeader,
      requiredFields: [],
      minimumNumberFields: [],
      maximumNumberFields: [],
      minLengthFields: [],
      maxLengthFields: []
    } as FuzzingSchemaItems

    if (!header?.schema || !header.name) return fuzzItems

    const schema = header?.schema as OpenAPIV3.BaseSchemaObject

    // Register all fuzz-able items
    if (header?.required) {
      fuzzItems?.requiredFields?.push(header.name)
    }
    if (schema?.minimum) {
      fuzzItems?.minimumNumberFields?.push({
        path: header.name,
        field: header.name,
        value: schema.minimum
      })
    }
    if (schema?.maximum) {
      fuzzItems?.maximumNumberFields?.push({
        path: header.name,
        field: header.name,
        value: schema.maximum
      })
    }
    if (schema?.minLength) {
      fuzzItems?.minLengthFields?.push({
        path: header.name,
        field: header.name,
        value: schema.minLength
      })
    }
    if (schema?.maxLength) {
      fuzzItems?.maxLengthFields?.push({
        path: header.name,
        field: header.name,
        value: schema.maxLength
      })
    }

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

  /**
   * Add an OverwriteRequestBodyConfig to a variation
   * @param variation
   * @param fuzzRequestQueryParam
   */
  public addOverwriteRequestQueryParam(
    variation: VariationConfig,
    fuzzRequestQueryParam: OverwriteQueryParamConfig
  ): VariationConfig {
    const idx = variation.overwrites.findIndex(obj => obj.overwriteRequestQueryParams)
    if (idx === -1) {
      variation.overwrites.push({ overwriteRequestQueryParams: [fuzzRequestQueryParam] })
    } else {
      variation.overwrites[idx].overwriteRequestQueryParams.push(fuzzRequestQueryParam)
    }
    return variation
  }

  /**
   * Add an OverwriteRequestHeadersConfig to a variation
   * @param variation
   * @param fuzzRequestHeader
   */
  public addOverwriteRequestHeader(
    variation: VariationConfig,
    fuzzRequestHeader: OverwriteRequestHeadersConfig
  ): VariationConfig {
    const idx = variation.overwrites.findIndex(obj => obj.overwriteRequestHeaders)
    if (idx === -1) {
      variation.overwrites.push({ overwriteRequestHeaders: [fuzzRequestHeader] })
    } else {
      variation.overwrites[idx].overwriteRequestHeaders.push(fuzzRequestHeader)
    }
    return variation
  }
}
