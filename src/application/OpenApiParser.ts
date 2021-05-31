import SwaggerParser from '@apidevtools/swagger-parser'
import { OpenAPIV3 } from 'openapi-types'
import path from 'path'
import { MappedOperation } from '../lib/oas/MappedOperation'

export interface OpenApiParserConfig {
  inputFile: string
}

export class OpenApiParser {
  public oas: OpenAPIV3.Document
  public mappedOperations: MappedOperation[]

  async convert(options: OpenApiParserConfig): Promise<OpenAPIV3.Document> {
    const inputFile = path.resolve(options.inputFile)
    // Dereference the spec so all entities have encapsulated schemas
    const api = await SwaggerParser.dereference(inputFile)
    const oasDoc = (await SwaggerParser.bundle(api, {
      parse: {
        json: false, // Disable the JSON parser
        yaml: {
          allowEmpty: false // Don't allow empty YAML files
        }
      },
      dereference: {
        circular: false // Don't allow circular $refs
      },
      validate: {
        spec: false // Don't validate against the Swagger spec
      }
    })) as OpenAPIV3.Document

    this.oas = oasDoc
    this.mappedOperations = this.pathsToOperations()
    return oasDoc
  }

  pathsToOperations = (): MappedOperation[] => {
    const paths = this.oas.paths
    const mappedOperations = Object.entries(paths)
      .filter(([_path, operations]) => !!operations)
      .map(([path, operations]) => {
        return (
          operations &&
          Object.entries(operations).map(([method, operation]): MappedOperation => {
            return new MappedOperation(path, method, operation as OpenAPIV3.OperationObject)
          })
        )
      })
      .reduce<MappedOperation[]>((acc, resource) => {
        resource && resource.map(item => acc.push(item))
        return acc
      }, [])

    this.mappedOperations = mappedOperations
    return this.mappedOperations
  }

  public getOperationById(operationId: string): MappedOperation | null {
    return this.mappedOperations.find(({ id }) => id === operationId) || null
  }

  public getOperationByPath(path: string): MappedOperation | null {
    return this.mappedOperations.find(({ pathRef }) => pathRef === path) || null
  }
}
