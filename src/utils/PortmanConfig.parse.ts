import $RefParser from '@apidevtools/json-schema-ref-parser'
import * as Either from 'fp-ts/lib/Either'
import { PortmanConfig } from 'types'

export const parsePortmanConfig = async (
  data: PortmanConfig
): Promise<Either.Either<Record<string, unknown>, PortmanConfig>> => {
  try {
    const config = (await $RefParser.dereference(data)) as PortmanConfig
    return Either.right(config)
  } catch (err) {
    return Either.left({
      error: 'Failed to resolve configuration',
      detail: err.message.replace(/(?:\n)+/g, '- ')
    })
  }
}
