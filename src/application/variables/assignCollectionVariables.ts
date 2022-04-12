import {
  assignVarFromRequestBody,
  assignVarFromResponseBody,
  assignVarFromResponseHeader,
  assignVarFromValue
} from '..'
import { PostmanMappedOperation } from '../../postman'
import { AssignVariablesConfig, PortmanOptions } from '../../types'

export const assignCollectionVariables = (
  pmOperation: PostmanMappedOperation,
  assignVariableConfig: AssignVariablesConfig,
  fixedValueCounter: number | string,
  options?: PortmanOptions
): number | string => {
  if (!assignVariableConfig?.collectionVariables) return fixedValueCounter

  let counter = fixedValueCounter
  // Loop over all defined variable value sources
  assignVariableConfig.collectionVariables.map(varSetting => {
    // Assign Postman collection variable with a request body value
    varSetting?.requestBodyProp && assignVarFromRequestBody(varSetting, pmOperation, options)

    // Assign Postman collection variable with a response body value
    varSetting?.responseBodyProp && assignVarFromResponseBody(varSetting, pmOperation, options)

    // Assign Postman collection variable with a response header value
    varSetting?.responseHeaderProp && assignVarFromResponseHeader(varSetting, pmOperation, options)

    // Assign Postman collection variable with a fixed value
    if (varSetting.value) {
      if (typeof counter === 'number') {
        counter++
      }
      assignVarFromValue(varSetting, pmOperation, counter, options)
    }
  })
  return counter
}
