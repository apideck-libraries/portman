import { PostmanMappedOperation } from 'src/postman'
import { OasMappedOperation, OpenApiParser } from 'src/oas'
import {
  GlobalConfig,
  OverwritePathVariableConfig,
  OverwriteQueryParamConfig,
  OverwriteRequestBodyConfig,
  OverwriteRequestConfig,
  OverwriteRequestHeadersConfig
} from 'src/types'
import {
  overwriteRequestBody,
  overwriteRequestHeaders,
  overwriteRequestPathVariables,
  overwriteRequestQueryParams,
  overwriteRequestBaseUrl,
  overwriteRequestSecurity
} from '.'

export interface OverwriteRequestDTO {
  overwriteValues?:
    | OverwriteQueryParamConfig[]
    | OverwriteRequestHeadersConfig[]
    | OverwritePathVariableConfig[]
    | OverwriteRequestBodyConfig[]
  pmOperation: PostmanMappedOperation
  oaOperation?: OasMappedOperation | null
  globals?: GlobalConfig
}

export const applyOverwrites = (
  pmOperations: PostmanMappedOperation[],
  overwriteSetting: OverwriteRequestConfig,
  oasParser: OpenApiParser,
  globals?: GlobalConfig
): PostmanMappedOperation[] => {
  return pmOperations.map(pmOperation => {
    // Get OpenApi operation
    const oaOperation = oasParser.getOperationByPath(pmOperation.pathRef) as OasMappedOperation

    // overwrite request body
    const overwriteRequestBodyDto = {
      overwriteValues: overwriteSetting?.overwriteRequestBody || [],
      pmOperation,
      oaOperation,
      globals
    }
    overwriteSetting?.overwriteRequestBody && overwriteRequestBody(overwriteRequestBodyDto)

    // overwrite request query params
    const overwriteRequestQueryParamsDto = {
      overwriteValues: overwriteSetting?.overwriteRequestQueryParams || [],
      pmOperation,
      oaOperation,
      globals
    }
    overwriteSetting?.overwriteRequestQueryParams &&
      overwriteRequestQueryParams(overwriteRequestQueryParamsDto)

    // overwrite request path variables
    const overwriteRequestPathVariablesDto = {
      overwriteValues: overwriteSetting?.overwriteRequestPathVariables || [],
      pmOperation,
      oaOperation,
      globals
    }
    overwriteSetting?.overwriteRequestPathVariables &&
      overwriteRequestPathVariables(overwriteRequestPathVariablesDto)

    // overwrite request headers
    const overwriteRequestHeadersDto = {
      overwriteValues: overwriteSetting?.overwriteRequestHeaders || [],
      pmOperation,
      oaOperation,
      globals
    }
    overwriteSetting?.overwriteRequestHeaders && overwriteRequestHeaders(overwriteRequestHeadersDto)

    // overwrite request base url
    overwriteSetting?.overwriteRequestBaseUrl &&
      overwriteRequestBaseUrl(overwriteSetting.overwriteRequestBaseUrl, pmOperation)

    overwriteSetting?.overwriteRequestSecurity &&
      overwriteRequestSecurity(overwriteSetting.overwriteRequestSecurity, pmOperation)

    return pmOperation
  })
}
