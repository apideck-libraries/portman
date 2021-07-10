import { betterAjvErrors, ValidationError } from '@apideck/better-ajv-errors'
import Ajv from 'ajv'
import draft from 'ajv/lib/refs/json-schema-draft-06.json'
import * as Either from 'fp-ts/lib/Either'
import type { JSONSchema6 } from 'json-schema'
import { PortmanConfig } from '../types/PortmanConfig'
import PortmanConfigSchema from './portman-config-schema.json'

export const validate = (data: unknown): Either.Either<ValidationError[], PortmanConfig> => {
  const ajv = new Ajv({
    allErrors: true
  })

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  ajv.addMetaSchema(draft)
  const valid = ajv.validate(PortmanConfigSchema, data)

  if (!valid) {
    const betterErrors = betterAjvErrors({
      schema: PortmanConfigSchema as JSONSchema6,
      data,
      errors: ajv.errors
    })
    return Either.left(betterErrors)
  } else {
    return Either.right(data as PortmanConfig)
  }
}
