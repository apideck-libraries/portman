import { writeOperationTestScript } from '../../application'
import { OasMappedOperation } from '../../oas'
import { PostmanMappedOperation } from '../../postman'
import { additionalProperties, ContractTestConfig, GlobalConfig } from 'types'
import traverse from 'neotraverse/legacy'
import { OpenAPIV3 } from 'openapi-types'
import Ajv from 'ajv'
import chalk from 'chalk'

export const testResponseJsonSchema = (
  schemaValidation: ContractTestConfig,
  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
  jsonSchema: any,
  pmOperation: PostmanMappedOperation,
  _oaOperation: OasMappedOperation,
  extraUnknownFormats: string[] = [],
  config?: GlobalConfig
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

  const split = config?.separatorSymbol ?? '::'
  const targetName = `${pmOperation.method.toUpperCase()}]${split}${pmOperation.path}`

  // Validate jsonSchema with AJV
  let validJsonSchema = true
  try {
    const ajv = new Ajv({ allErrors: true, strict: false, logger: false })
    ajv.compile(jsonSchema)
  } catch (e) {
    validJsonSchema = false
    // When invalid JSON schema, show a warning during conversion
    console.log(
      chalk.red(
        `schemaValidation skipped for[${pmOperation.method.toUpperCase()}]${split}${
          pmOperation.path
        }  ` + `${e.message}`
      )
    )
  }

  const jsonSchemaString = JSON.stringify(jsonSchema)
  const containsRef = jsonSchemaString.includes('$ref')
  let pmTest = ''

  const unknownFormats =
    '[' +
    ['int32', 'int64', 'float', 'double']
      .concat(extraUnknownFormats)
      .map(fmt => `"${fmt}"`)
      .join(', ') +
    ']'

  // Check - Response json schema check
  pmTest = [
    `// Response Validation\n`,
    `const schema = ${jsonSchemaString}\n\n`,
    `// Validate if response matches JSON schema \n`,
    `pm.test("[${targetName}`,
    ` - Schema is valid", function() {\n`,
    `    pm.response.to.have.jsonSchema(schema,{unknownFormats: ${unknownFormats}});\n`,
    `});\n`
  ].join('')

  if (!validJsonSchema) {
    pmTest = [
      `// Response Validation - Disabled due to Invalid JSON Schema\n`,
      `console.log('${targetName} response is not being validated against your spec!');\n`
    ].join('')
  }

  if (containsRef) {
    pmTest = [
      `// Response Validation - Disabled due to Circular Reference\n`,
      `console.log('${targetName} response is not being validated against your spec!');\n`
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

  // OpenAPI-specific fields to remove, since not relevant for the response validation
  const openApiSpecificFields = [
    'discriminator',
    'readOnly',
    'writeOnly',
    'xml',
    'externalDocs',
    'example',
    'deprecated'
  ]

  // Recurse through OpenAPI Schema
  const traverse = obj => {
    for (const k in obj) {
      if (typeof obj[k] === 'object' && obj[k] !== null) {
        // Convert 'types' to 'type' if found
        if (obj[k]?.types) {
          obj[k].type = obj[k].types
          delete obj[k].types
        }

        // Handle nullable: add 'null' to type and remove nullable
        if (obj[k]?.nullable === true) {
          // Merge the existing type(s) with "null" correctly
          if (Array.isArray(obj[k].type)) {
            if (!obj[k].type.includes('null')) {
              obj[k].type.push('null')
            }
          } else {
            // deletes nullable and adds "null" to type array if nullable is true
            const jsonTypes: string[] = []
            jsonTypes.push(obj[k].type)
            jsonTypes.push('null')
            obj[k].type = jsonTypes
          }
          delete obj[k].nullable
        }

        // Remove OpenAPI-specific fields
        openApiSpecificFields.forEach(field => {
          if (field in obj[k]) {
            delete obj[k][field]
          }
        })

        // Recursively traverse the object
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
