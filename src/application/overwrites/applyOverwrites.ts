import { PostmanMappedOperation } from 'src/postman'
import { OasMappedOperation, OpenApiParser } from 'src/oas'
import { OverwriteRequestConfig } from 'src/types'
import {
  overwriteRequestBody,
  overwriteRequestHeaders,
  overwriteRequestPathIdVariables,
  overwriteRequestPathVariables,
  overwriteRequestQueryParams,
  overwriteRequestBaseUrl,
  overwriteRequestSecurity
} from '.'

export const applyOverwrites = (
  pmOperations: PostmanMappedOperation[],
  overwriteSetting: OverwriteRequestConfig,
  oasParser: OpenApiParser
): PostmanMappedOperation[] => {
  return pmOperations.map(pmOperation => {
    // Get OpenApi operation
    const oaOperation = oasParser.getOperationByPath(pmOperation.pathRef) as OasMappedOperation

    // overwrite request body
    overwriteSetting?.overwriteRequestBody &&
      overwriteRequestBody(overwriteSetting.overwriteRequestBody, pmOperation, oaOperation)

    // overwrite request query params
    overwriteSetting?.overwriteRequestQueryParams &&
      overwriteRequestQueryParams(
        overwriteSetting.overwriteRequestQueryParams,
        pmOperation,
        oaOperation
      )

    // overwrite request path id variables
    overwriteSetting?.overwriteRequestPathIdVariables &&
      overwriteRequestPathIdVariables(
        overwriteSetting.overwriteRequestPathIdVariables,
        pmOperation,
        oaOperation
      )

    // overwrite request path variables
    overwriteSetting?.overwriteRequestPathVariables &&
      overwriteRequestPathVariables(
        overwriteSetting.overwriteRequestPathVariables,
        pmOperation,
        oaOperation
      )

    // overwrite request headers
    overwriteSetting?.overwriteRequestHeaders &&
      overwriteRequestHeaders(overwriteSetting.overwriteRequestHeaders, pmOperation, oaOperation)

    // overwrite request base url
    overwriteSetting?.overwriteRequestBaseUrl &&
      overwriteRequestBaseUrl(overwriteSetting.overwriteRequestBaseUrl, pmOperation)

    overwriteSetting?.overwriteRequestSecurity &&
      overwriteRequestSecurity(overwriteSetting.overwriteRequestSecurity, pmOperation)

    return pmOperation
  })
}
