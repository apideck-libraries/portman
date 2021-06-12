import SwaggerParser from '@apidevtools/swagger-parser'
import { OpenAPIV3 } from 'openapi-types'
import path from 'path'
import { matchPath, METHODS } from '../utils'
import { OasMappedOperation } from './OasMappedOperation'

export interface OpenApiParserConfig {
  inputFile: string
}

export interface IOpenApiParser {
  oas: OpenAPIV3.Document
  mappedOperations: OasMappedOperation[]
  operationIdMap: Record<string, OasMappedOperation>
  getOperationById(operationId: string): OasMappedOperation | null
  getOperationByPath(path: string): OasMappedOperation | null
}

export class OpenApiParser {
  public oas: OpenAPIV3.Document
  public mappedOperations: OasMappedOperation[]
  public operationIdMap: Record<string, OasMappedOperation>

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
    this.pathsToOperations()
    this.mapOperationIds()
    return oasDoc
  }

  pathsToOperations = (): OasMappedOperation[] => {
    const paths = this.oas.paths
    const mappedOperations = Object.entries(paths)
      .filter(([_path, operations]) => !!operations)
      .map(([path, operations]) => {
        return (
          operations &&
          Object.entries(operations).map(([method, operation]): OasMappedOperation => {
            return new OasMappedOperation(path, method, operation as OpenAPIV3.OperationObject)
          })
        )
      })
      .reduce<OasMappedOperation[]>((acc, resource) => {
        resource && resource.map(item => acc.push(item))
        return acc
      }, [])

    this.mappedOperations = mappedOperations
    return this.mappedOperations
  }

  mapOperationIds = (): void => {
    const operationIdMap = this.mappedOperations.reduce((acc, operation) => {
      acc[operation.pathRef] = operation
      return acc
    }, {})

    this.operationIdMap = operationIdMap
  }

  public getOperationById(operationId: string): OasMappedOperation | null {
    return this.mappedOperations.find(({ id }) => id === operationId) || null
  }

  public getOperationByPath(path: string): OasMappedOperation | null {
    return this.mappedOperations.find(({ pathRef }) => pathRef === path) || null
  }

  public getOperationsByIds(operationIds: string[]): OasMappedOperation[] {
    return this.mappedOperations.filter(({ id }) => id && operationIds.includes(id))
  }

  public getOperationsByPath(path: string): OasMappedOperation[] {
    const targetSplit = path.split('::')
    const targetMethod = targetSplit[0].includes('*') ? METHODS : targetSplit[0]
    const targetPath = targetSplit[1]

    return this.mappedOperations.filter(mappedOperation => {
      return (
        targetMethod.includes(mappedOperation.method) && matchPath(targetPath, mappedOperation.path)
      )
    })
  }
}
