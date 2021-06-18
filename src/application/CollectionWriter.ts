import { CollectionDefinition } from 'postman-collection'
import {
  injectEnvVariables,
  orderCollectionRequests,
  overwriteCollectionKeyValues,
  overwriteCollectionValues,
  writeCollectionPreRequestScripts,
  writeRawReplacements
} from '.'
import { PortmanConfig, PortmanOptions } from '../types'

export class CollectionWriter {
  public collection: CollectionDefinition
  config: PortmanConfig
  options: PortmanOptions

  constructor(config: PortmanConfig, options: PortmanOptions, collection: CollectionDefinition) {
    this.config = config
    this.options = options
    this.collection = collection
  }

  public execute(): void {
    if (!this.config?.globals) return

    const { envFile, baseUrl } = this.options

    const {
      globals: {
        collectionPreRequestScripts,
        keyValueReplacements,
        valueReplacements,
        rawReplacements,
        orderOfOperations
      }
    } = this.config

    // --- Portman - Search for keys in dictionary to set the value if key is found anywhere in collection
    let collection = this.collection
    if (keyValueReplacements) {
      collection = overwriteCollectionKeyValues(collection, keyValueReplacements)
    }

    // --- Portman - Search for keys in dictionary to set the values if value is found anywhere in collection
    if (valueReplacements) {
      collection = overwriteCollectionValues(collection, valueReplacements)
    }

    // --- Portman - Use .env to inject variables on Collection
    if (envFile) {
      collection = injectEnvVariables(collection, envFile, baseUrl)
    }

    // --- Portman - Set manually order Postman requests
    if (orderOfOperations) {
      collection = orderCollectionRequests(collection, orderOfOperations)
    }

    // --- Portman - Set Postman pre-requests
    if (collectionPreRequestScripts) {
      collection = writeCollectionPreRequestScripts(collection, collectionPreRequestScripts)
    }

    // --- Portman - Replace & clean-up Postman
    if (rawReplacements) {
      const collectionString = writeRawReplacements(
        JSON.stringify(collection, null, 2),
        rawReplacements
      )
      this.collection = JSON.parse(collectionString)
    } else {
      this.collection = collection
    }
  }
}
