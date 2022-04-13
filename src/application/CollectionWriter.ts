import { CollectionDefinition } from 'postman-collection'
import {
  injectEnvVariables,
  orderCollectionRequests,
  overwriteCollectionKeyValues,
  overwriteCollectionValues,
  overwriteCollectionSecurityValues,
  writeCollectionPreRequestScripts,
  writeRawReplacements
} from '.'
import { GlobalConfig, PortmanConfig, PortmanOptions } from '../types'
import { isEmptyObject } from '../utils'
import { writeCollectionTestScripts } from './globals/writeCollectionTestScripts'

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
    const { envFile, baseUrl } = this.options

    const { globals = {} } = this.config
    const {
      collectionPreRequestScripts = [],
      collectionTestScripts = [],
      securityOverwrites = {},
      keyValueReplacements = {},
      valueReplacements = {},
      rawReplacements = [],
      orderOfOperations = []
    } = globals as GlobalConfig

    let collection = this.collection

    // --- Portman - Set Security values for Postman
    if (securityOverwrites && !isEmptyObject(securityOverwrites)) {
      collection = overwriteCollectionSecurityValues(collection, securityOverwrites)
    }

    // --- Portman - Search for keys in dictionary to set the value if key is found anywhere in collection
    if (keyValueReplacements && !isEmptyObject(keyValueReplacements)) {
      collection = overwriteCollectionKeyValues(collection, keyValueReplacements)
    }

    // --- Portman - Search for keys in dictionary to set the values if value is found anywhere in collection
    if (valueReplacements && !isEmptyObject(valueReplacements)) {
      collection = overwriteCollectionValues(collection, valueReplacements)
    }

    // --- Portman - Use .env to inject variables on Collection
    if (envFile) {
      collection = injectEnvVariables(collection, envFile, baseUrl)
    }

    // --- Portman - Set manually order Postman requests
    if (orderOfOperations && orderOfOperations.length > 0) {
      collection = orderCollectionRequests(collection, orderOfOperations)
    }

    // --- Portman - Set Postman collection pre-requests scripts
    if (collectionPreRequestScripts && collectionPreRequestScripts.length > 0) {
      collection = writeCollectionPreRequestScripts(collection, collectionPreRequestScripts)
    }

    // --- Portman - Set Postman collection test scripts
    if (collectionTestScripts && collectionTestScripts.length > 0) {
      collection = writeCollectionTestScripts(collection, collectionTestScripts)
    }

    // --- Portman - Replace & clean-up Postman
    if (rawReplacements && rawReplacements.length > 0) {
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
