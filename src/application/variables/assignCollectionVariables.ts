import {
  assignVarFromRequestBody,
  assignVarFromResponseBody,
  assignVarFromResponseHeader,
  assignVarFromValue
} from '..'
import { OasMappedOperation } from '../../oas'
import { PostmanMappedOperation } from '../../postman'
import {
  AssignVariablesConfig,
  CollectionVariableConfig,
  GlobalConfig,
  PortmanOptions
} from '../../types'

export interface assignCollectionVariablesDTO {
  varSetting: CollectionVariableConfig
  pmOperation: PostmanMappedOperation
  oaOperation?: OasMappedOperation | null
  options?: PortmanOptions
  globals?: GlobalConfig
}

export const assignCollectionVariables = (
  pmOperation: PostmanMappedOperation,
  oaOperation: OasMappedOperation | null,
  assignVariableConfig: AssignVariablesConfig,
  fixedValueCounter: number | string,
  options?: PortmanOptions,
  globals?: GlobalConfig
): number | string => {
  if (!assignVariableConfig?.collectionVariables) return fixedValueCounter

  let counter = fixedValueCounter
  // Loop over all defined variable value sources
  assignVariableConfig.collectionVariables.map(varSetting => {
    const assignVariableDto = {
      varSetting,
      pmOperation,
      oaOperation,
      options,
      globals
    }

    // Assign Postman collection variable with a request body value
    varSetting?.requestBodyProp && assignVarFromRequestBody(assignVariableDto)

    // Assign Postman collection variable with a response body value
    varSetting?.responseBodyProp && assignVarFromResponseBody(assignVariableDto)

    // Assign Postman collection variable with a response header value
    varSetting?.responseHeaderProp && assignVarFromResponseHeader(assignVariableDto)

    // Assign Postman collection variable with a fixed value
    if (varSetting.value) {
      if (typeof counter === 'number') {
        counter++
      }
      assignVarFromValue(assignVariableDto, counter)
    }
  })
  return counter
}
