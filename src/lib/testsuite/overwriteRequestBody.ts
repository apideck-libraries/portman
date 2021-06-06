import { PostmanMappedOperation } from 'lib/postman/PostmanMappedOperation'
import { getByPath } from '../../utils/getByPath'
import { setByPath } from '../../utils/setByPath'
import { omitByPath } from '../../utils/omitByPath'

export const overwriteRequestBody = (
  overwriteValues: [
    {
      key: string
      value: string
      overwrite: boolean
      disable: boolean
      remove: boolean
    }
  ],
  pmOperation: PostmanMappedOperation
  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
): PostmanMappedOperation => {
  // Early exit if no request body is defined
  if (!(overwriteValues instanceof Array)) return pmOperation

  // Early exit if no request body is defined
  if (!pmOperation.item?.request?.body?.raw) return pmOperation
  const requestBody = pmOperation.item.request.body.raw

  // Overwrite values for Keys
  let bodyData = JSON.parse(requestBody)
  overwriteValues.map(overwriteValue => {
    if (overwriteValue.key && overwriteValue.value) {
      const orgValue = getByPath(bodyData, overwriteValue.key)
      let newValue = overwriteValue.value

      if (overwriteValue.overwrite === false) {
        newValue = orgValue + newValue
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
