import { writeOperationTestScript } from '../../application'
import { OasMappedOperation } from '../../oas'
import { PostmanMappedOperation } from '../../postman'

export const testResponseJsonSchema = (
  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
  jsonSchema: any,
  pmOperation: PostmanMappedOperation,
  _aOperation: OasMappedOperation
): PostmanMappedOperation => {
  // deletes nullable and adds "null" to type array if nullable is true
  jsonSchema = convertUnsupportedJsonSchemaProperties(jsonSchema)

  // Check - Response json schema check
  const pmTest: string = [
    `// Response Validation\n`,
    `const schema = ${JSON.stringify(jsonSchema)}\n\n`,
    `// Validate if response matches JSON schema \n`,
    `pm.test("[${pmOperation.method.toUpperCase()}]::${pmOperation.path}`,
    ` - Schema is valid", function() {\n`,
    `    pm.response.to.have.jsonSchema(schema,{unknownFormats: ["int32", "int64"]});\n`,
    `});\n`
  ].join('')

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
        if (obj[k]?.maxItems === 2 && obj[k]?.type === 'array') {
          // deletes maxItems, which is added unwanted by oaToPostman.convert
          // TODO find another way to respect the maxItems that might be passed by OpenAPI
          delete obj[k].maxItems
        }
        if (obj[k]?.minItems === 2 && obj[k]?.type === 'array') {
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
