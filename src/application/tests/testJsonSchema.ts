import Ajv from 'ajv'

interface jsonSchemaTest {
  validJsonSchema: boolean
  error?: any
}

export const testJsonSchema = (jsonSchema: any): jsonSchemaTest => {
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
