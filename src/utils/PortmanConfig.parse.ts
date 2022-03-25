import $RefParser from '@apidevtools/json-schema-ref-parser'
import { PortmanConfig } from 'types'

export const parsePortmanConfig = async (data: PortmanConfig): Promise<PortmanConfig> => {
  try {
    return (await $RefParser.dereference(data)) as PortmanConfig
  } catch (err) {
    throw new Error(`${err} doesn't exist.`)
  }
}
