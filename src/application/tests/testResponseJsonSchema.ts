import { writeOperationTestScript } from '../../application'
import { OasMappedOperation } from '../../oas'
import { PostmanMappedOperation } from '../../postman'
import { additionalProperties, ContractTestConfig } from 'types'
import traverse from 'traverse'
import { OpenAPIV3 } from 'openapi-types'

export const testResponseJsonSchema = (
  schemaValidation: ContractTestConfig,
  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
  jsonSchema: any,
  pmOperation: PostmanMappedOperation,
  oaOperation: OasMappedOperation
): PostmanMappedOperation => {
  // overwrite JSON schema validation for additionalProperties
  if (schemaValidation.additionalProperties || schemaValidation.additionalProperties === false) {
    jsonSchema = convertJsonSchemaAdditionalProperties(
      jsonSchema,
      schemaValidation.additionalProperties
    )
  }

  // deletes nullable and adds "null" to type array if nullable is true
  jsonSchema = convertUnsupportedJsonSchemaProperties(jsonSchema)

  const jsonSchemaString = JSON.stringify(jsonSchema)
  const containsRef = jsonSchemaString.includes('$ref')
  let pmTest = ''

  // Check - Response json schema check
  pmTest = [
    `// Response Validation\n`,
    `const schema = ${jsonSchemaString}\n\n`,
    `// Validate if response matches JSON schema \n`,
    `pm.test("[${pmOperation.method.toUpperCase()}]::${pmOperation.path}`,
    ` - Schema is valid", function() {\n`,
    `    pm.response.to.have.jsonSchema(schema,{unknownFormats: ["int32", "int64"]});\n`,
    `});\n`
  ].join('')

  if (containsRef) {
    pmTest = [
      `// Response Validation Disabled due to Circular Reference\n`,
      `console.log('${oaOperation.id} response is not being validated against your spec!');\n`
    ].join('')
  }

  writeOperationTestScript(pmOperation, pmTest)
  return pmOperation
}

/**
 * function to convert unsupported OpenAPI(3.0) properties to valid JSON schema properties
 * @param {*} oaSchema openAPI schema
 * @returns {*} Modified openAPI schema object that is compatible with JSON schema validation
 */
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
export const convertUnsupportedJsonSchemaProperties = (oaSchema: any): any => {
  const jsonSchema = JSON.parse(JSON.stringify(oaSchema)) // Deep copy of the schema object

  // Convert unsupported OpenAPI(3.0) properties to valid JSON schema properties
  // let jsonSchemaNotSupported = ['nullable', 'discriminator', 'readOnly', 'writeOnly', 'xml',
  //   'externalDocs', 'example', 'deprecated'];

  if (
    jsonSchema?.maxItems === 2 &&
    (jsonSchema?.type === 'array' || jsonSchema?.type.includes('array'))
  ) {
    // deletes maxItems on the root level of the jsonSchema, which is added unwanted by oaToPostman.convert
    // TODO find another way to respect the maxItems that might be passed by OpenAPI
    delete jsonSchema.maxItems
  }
  if (
    jsonSchema?.minItems === 2 &&
    (jsonSchema?.type === 'array' || jsonSchema?.type.includes('array'))
  ) {
    // deletes minItems on the root level of the jsonSchema, which is added unwanted by oaToPostman.convert
    // TODO find another way to respect the minItems that might be passed by OpenAPI
    delete jsonSchema.minItems
  }

  // Recurse through OpenAPI Schema
  const traverse = obj => {
    for (const k in obj) {
      if (typeof obj[k] === 'object') {
        if (obj[k]?.nullable === true) {
          // deletes nullable and adds "null" to type array if nullable is true
          const jsonTypes: string[] = []
          jsonTypes.push(obj[k].type)
          jsonTypes.push('null')
          obj[k].type = jsonTypes
          delete obj[k].nullable
        }
        if (
          obj[k]?.maxItems === 2 &&
          (obj[k]?.type === 'array' || obj[k]?.type.includes('array'))
        ) {
          // deletes maxItems, which is added unwanted by oaToPostman.convert
          // TODO find another way to respect the maxItems that might be passed by OpenAPI
          delete obj[k].maxItems
        }
        if (
          obj[k]?.minItems === 2 &&
          (obj[k]?.type === 'array' || obj[k]?.type.includes('array'))
        ) {
          // deletes minItems, which is added unwanted by oaToPostman.convert
          // TODO find another way to respect the minItems that might be passed by OpenAPI
          delete obj[k].minItems
        }
        traverse(obj[k])
      }
    }
  }
  traverse(jsonSchema)
  return jsonSchema
}

/**
 * function to convert all additional properties of the OpenAPI(3.0) JSON schema
 * @param {*} oaSchema openAPI schema
 * @param additionalProperties
 */
export const convertJsonSchemaAdditionalProperties = (
  oaSchema: OpenAPIV3.SchemaObject,
  additionalProperties: additionalProperties | boolean
): OpenAPIV3.SchemaObject => {
  const jsonSchema = JSON.parse(JSON.stringify(oaSchema)) // Deep copy of the schema object

  // Recurse through schema
  traverse(jsonSchema).forEach(function (node) {
    // Handle object
    if (node?.type === 'object') {
      node.additionalProperties = additionalProperties
      this.update(node)
    }
  })

  return jsonSchema
}
