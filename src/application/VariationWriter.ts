import { Collection } from 'postman-collection'
import { PostmanMappedOperation } from '../postman'
import { VariationConfig } from '../types'

export class VariationWriter {
  public mappedOperations: PostmanMappedOperation[]

  constructor() {
    this.mappedOperations = []
  }

  public add(pmOperation: PostmanMappedOperation, variations: VariationConfig[]): void {
    console.log(variations)
    variations.map(variation => {
      const operationVariation = this.build(pmOperation, variation)
      this.mappedOperations.push(operationVariation)
    })
  }
  public mergeToCollection(collection: Collection): Collection {
    return collection
  }

  private build(
    pmOperation: PostmanMappedOperation,
    variation: VariationConfig
  ): PostmanMappedOperation {
    const operationVariation = pmOperation.clone(variation.name)

    return operationVariation
  }
}
