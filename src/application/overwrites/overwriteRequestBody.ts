import { PostmanMappedOperation } from '../../postman'
import { OverwriteRequestBodyConfig } from '../../types'
import { getByPath, isObject, omitByPath, setByPath } from '../../utils'

/**
 * Overwrite Postman request body with values defined by the portman testsuite
 * @param overwriteValues
 * @param pmOperation
 */
export const overwriteRequestBody = (
  overwriteValues: OverwriteRequestBodyConfig[],
  pmOperation: PostmanMappedOperation
  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
): PostmanMappedOperation => {
  // Early exit if overwrite values are not defined
  if (!(overwriteValues instanceof Array)) return pmOperation

  // Early exit if request body is not defined
  if (!pmOperation.item?.request?.body?.raw) return pmOperation
  const requestBody = pmOperation.item.request.body.raw

  // Make postman body safe
  const requestBodySafe = makeJsonSafeDynamicPmVars(requestBody)

  // Overwrite values for Keys
  let bodyData = JSON.parse(requestBodySafe)
  overwriteValues.map(overwriteValue => {
    if (overwriteValue.key && typeof overwriteValue.value !== 'undefined') {
      const originalValue = getByPath(bodyData, overwriteValue.key)
      let newValue = overwriteValue.value

      if (overwriteValue.overwrite === false) {
        newValue = isObject(originalValue)
          ? { ...(originalValue as Record<string, unknown>), newValue }
          : originalValue + newValue
      }

      bodyData = setByPath(bodyData, overwriteValue.key, newValue, true)
    }
    if (overwriteValue.key && overwriteValue.remove === true) {
      bodyData = omitByPath(bodyData, overwriteValue.key)
    }
  })
  const bodyString = JSON.stringify(bodyData, null, 4)

  // Make postman body safe
  const bodyStringSafe = decodeDynamicPmVars(bodyString)

  // Set responseCheckSettings with stringified body
  pmOperation.item.request.body.raw = bodyStringSafe

  return pmOperation
}
export const makeJsonSafeDynamicPmVars = (jsonString: string): string => {
  // Handle {{$randomInt}},{{$randomCreditCardMask}} conversion from string to number
  const find = [': {{$randomInt}},', ': {{$randomCreditCardMask}},', ': {{$randomBankAccount}},']
  const replace = [
    ': "{{$randomInt}}",',
    ': "{{$randomCreditCardMask}}",',
    ': "{{$randomBankAccount}}",'
  ]
  find.forEach(function (item, index) {
    // eslint-disable-next-line no-useless-escape
    const escapedFind = item.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, '\\$1')
    jsonString = jsonString.replace(new RegExp(escapedFind, 'g'), replace[index])
  })
  return jsonString
}

export const decodeDynamicPmVars = (jsonString: string): string => {
  // Handle {{$randomInt}},{{$randomCreditCardMask}} conversion from string to number
  const find = ['"{{$randomInt}}"', '"{{$randomCreditCardMask}}"', '"{{$randomBankAccount}}"']
  const replace = ['{{$randomInt}}', '{{$randomCreditCardMask}}', '{{$randomBankAccount}}']
  find.forEach(function (item, index) {
    // eslint-disable-next-line no-useless-escape
    const escapedFind = item.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, '\\$1')
    jsonString = jsonString.replace(new RegExp(escapedFind, 'g'), replace[index])
  })
  return jsonString
}
