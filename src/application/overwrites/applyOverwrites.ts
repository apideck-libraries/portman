import { PostmanMappedOperation } from 'src/postman'
import { OasMappedOperation, OpenApiParser } from 'src/oas'
import {
  GlobalConfig,
  OverwritePathIdVariableConfig,
  OverwritePathVariableConfig,
  OverwriteQueryParamConfig,
  OverwriteRequestBodyConfig,
  OverwriteRequestConfig,
  OverwriteRequestHeadersConfig
} from 'src/types'
import {
  overwriteRequestBody,
  overwriteRequestHeaders,
  overwriteRequestPathIdVariables,
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
    | OverwritePathIdVariableConfig
  pmOperation: PostmanMappedOperation
  oaOperation?: OasMappedOperation | null
  settings?: GlobalConfig
}

export const applyOverwrites = (
  pmOperations: PostmanMappedOperation[],
  overwriteSetting: OverwriteRequestConfig,
  oasParser: OpenApiParser,
  settings?: GlobalConfig
): PostmanMappedOperation[] => {
  return pmOperations.map(pmOperation => {
    // Get OpenApi operation
    const oaOperation = oasParser.getOperationByPath(pmOperation.pathRef) as OasMappedOperation

    // overwrite request body
    const overwriteRequestBodyDto = {
      overwriteValues: overwriteSetting?.overwriteRequestBody || [],
      pmOperation,
      oaOperation,
      settings
    }
    overwriteSetting?.overwriteRequestBody && overwriteRequestBody(overwriteRequestBodyDto)

    // overwrite request query params
    const overwriteRequestQueryParamsDto = {
      overwriteValues: overwriteSetting?.overwriteRequestQueryParams || [],
      pmOperation,
      oaOperation,
      settings
    }
    overwriteSetting?.overwriteRequestQueryParams &&
      overwriteRequestQueryParams(overwriteRequestQueryParamsDto)

    // overwrite request path id variables
    overwriteSetting?.overwriteRequestPathIdVariables &&
      overwriteRequestPathIdVariables(
        overwriteSetting.overwriteRequestPathIdVariables,
        pmOperation,
        oaOperation
      )

    // overwrite request path variables
    const overwriteRequestPathVariablesDto = {
      overwriteValues: overwriteSetting?.overwriteRequestPathVariables || [],
      pmOperation,
      oaOperation,
      settings
    }
    overwriteSetting?.overwriteRequestPathVariables &&
      overwriteRequestPathVariables(overwriteRequestPathVariablesDto)

    // overwrite request headers
    const overwriteRequestHeadersDto = {
      overwriteValues: overwriteSetting?.overwriteRequestHeaders || [],
      pmOperation,
      oaOperation,
      settings
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
