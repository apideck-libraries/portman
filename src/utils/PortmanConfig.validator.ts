import { betterAjvErrors, ValidationError } from '@apideck/better-ajv-errors'
import Ajv from 'ajv'
import type { JSONSchema6 } from 'json-schema'
import { PortmanConfig } from '../types/PortmanConfig'
import PortmanConfigSchema from './portman-config-schema.json'

export const validate = (data: unknown): PortmanConfig | ValidationError[] => {
  const ajv = new Ajv({
    allErrors: true
  })

  const valid = ajv.validate(PortmanConfigSchema, data)

  if (!valid) {
    const betterErrors = betterAjvErrors({
      schema: PortmanConfigSchema as JSONSchema6,
      data,
      errors: ajv.errors
    })
    return betterErrors
  } else {
    return data as PortmanConfig
  }
}
