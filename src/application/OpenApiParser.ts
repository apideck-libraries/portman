import SwaggerParser from '@apidevtools/swagger-parser'
import { OpenAPI } from 'openapi-types'
import path from 'path'

export interface OpenApiParserConfig {
  inputFile: string
}

export interface PortmanOperation {
  id: string
  pathRef: string
  operation: OpenAPI.Operation
}

export class OpenApiParser {
  public oas: OpenAPI.Document
  public operationMap: PortmanOperation[]

  async convert(options: OpenApiParserConfig): Promise<OpenAPI.Document> {
    const inputFile = path.resolve(options.inputFile)
    const api = await SwaggerParser.dereference(inputFile)
    const oasDoc = await SwaggerParser.bundle(api, {
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
    })
    this.oas = oasDoc
    this.operationMap = this.pathsToOperations()
    return oasDoc
  }

  pathsToOperations = (): PortmanOperation[] => {
    const {
      oas: { paths = {} }
    } = this

    const mappedOperations = Object.entries(paths)
      .map(([path, operations]) => {
        return Object.entries(operations).map(([method, operation]): PortmanOperation => {
          const mappedOperation = operation as OpenAPI.Operation
          return {
            id: mappedOperation?.operationId || '',
            pathRef: `${method.toUpperCase()}::${path}`,
            operation: mappedOperation
          }
        })
      })
      .reduce((acc, resource) => {
        resource.map(item => acc.push(item))
        return acc
      }, [])

    this.operationMap = mappedOperations
    return this.operationMap
  }

  public getOperationById(operationId: string): OpenAPI.Operation | null {
    return this.operationMap.find(({ id }) => id === operationId)?.operation || null
  }

  public getOperationByPath(path: string): OpenAPI.Operation | null {
    return this.operationMap.find(({ pathRef }) => pathRef === path)?.operation || null
  }
}
