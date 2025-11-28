import Ajv from 'ajv'
import { OpenAPIV3, OpenAPIV3_1 } from 'openapi-types'

interface jsonSchemaTest {
  validJsonSchema: boolean
  error?: unknown
}

export const testJsonSchema = (
  jsonSchema: OpenAPIV3.SchemaObject | OpenAPIV3_1.SchemaObject
): jsonSchemaTest => {
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
