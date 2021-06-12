import { PostmanMappedOperation } from 'postman'
import { OverwriteRequestBodyConfig } from 'types'
import { getByPath, omitByPath, setByPath } from 'utils'

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

  // Overwrite values for Keys
  let bodyData = JSON.parse(requestBody)
  overwriteValues.map(overwriteValue => {
    if (overwriteValue.key && overwriteValue.value) {
      const orgiginalValue = getByPath(bodyData, overwriteValue.key)
      let newValue = overwriteValue.value

      if (overwriteValue.overwrite === false) {
        newValue = orgiginalValue + newValue
      }
      bodyData = setByPath(bodyData, overwriteValue.key, newValue)
    }
    if (overwriteValue.key && overwriteValue.remove === true) {
      bodyData = omitByPath(bodyData, overwriteValue.key)
    }
  })
  let bodyString = JSON.stringify(bodyData, null, 4)

  // Handle {{$randomInt}},{{$randomCreditCardMask}} conversion from string to number
  const find = ['"{{$randomInt}}"', '"{{$randomCreditCardMask}}"', '"{{$randomBankAccount}}"']
  const replace = ['{{$randomInt}}', '{{$randomCreditCardMask}}', '{{$randomBankAccount}}']
  find.forEach(function (item, index) {
    const escapedFind = item.replace(/([.*+?^=!:${}()|\\[\]\\/\\])/g, '\\$1')
    bodyString = bodyString.replace(new RegExp(escapedFind, 'g'), replace[index])
  })

  // Set responseCheckSettings with stringified body
  pmOperation.item.request.body.raw = bodyString

  return pmOperation
}
