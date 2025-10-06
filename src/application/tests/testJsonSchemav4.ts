import Ajv from 'ajv-draft-04'
import { OpenAPIV3_1 } from 'openapi-types'

interface jsonSchemaTest {
  validJsonSchema: boolean
  error?: unknown
}

export const testJsonSchemav4 = (jsonSchema: OpenAPIV3_1.SchemaObject): jsonSchemaTest => {
  const validJsonSchema: jsonSchemaTest = { validJsonSchema: true }
  try {
    const ajv = new Ajv({ allErrors: true, strict: false, logger: false })
    ajv.compile(jsonSchema)
  } catch (e) {
    validJsonSchema.validJsonSchema = false
    validJsonSchema.error = e
  }

  return validJsonSchema
}
