import { PostmanMappedOperation } from '../../postman'
import { OverwriteRequestBodyConfig } from '../../types'
import { getByPath, isObject, omitByPath, setByPath } from '../../utils'
import { FormParam, PropertyList } from 'postman-collection'

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

  if (pmOperation.item?.request?.body?.raw) {
    // Overwrite JSON values
    overwriteRequestBodyJson(overwriteValues, pmOperation)
  }
  if (pmOperation.item?.request?.body?.formdata) {
    // Overwrite Form values
    overwriteRequestBodyForm(overwriteValues, pmOperation)
  }

  return pmOperation
}

/**
 * Overwrite JSON values in the request body values
 * @param overwriteValues
 * @param pmOperation
 */
export const overwriteRequestBodyJson = (
  overwriteValues: OverwriteRequestBodyConfig[],
  pmOperation: PostmanMappedOperation
  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
): PostmanMappedOperation => {
  // Early exit if request body is not defined
  if (!pmOperation.item?.request?.body?.raw) return pmOperation
  const requestBody = pmOperation.item.request.body.raw

  // Make postman body safe
  const requestBodySafe = makeJsonSafeDynamicPmVars(requestBody)

  // Overwrite values for Keys
  let bodyData = JSON.parse(requestBodySafe)
  overwriteValues.map(overwriteValue => {
    if (overwriteValue.key && typeof overwriteValue.value !== 'undefined') {
      const root = overwriteValue.key === '.'
      const originalValue = root ? bodyData : getByPath(bodyData, overwriteValue.key)

      let newValue = overwriteValue.value

      if (overwriteValue.overwrite === false) {
        if (Array.isArray(originalValue) && Array.isArray(newValue)) {
          newValue = originalValue.concat(newValue)
        } else if (isObject(originalValue)) {
          newValue = { ...(originalValue as Record<string, unknown>), newValue }
        } else {
          newValue = originalValue + newValue
        }
      }

      bodyData = root
        ? { ...bodyData, ...newValue }
        : setByPath(bodyData, overwriteValue.key, newValue)
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

/**
 * Overwrite Formdata values in the request body values
 * @param overwriteValues
 * @param pmOperation
 */
export const overwriteRequestBodyForm = (
  overwriteValues: OverwriteRequestBodyConfig[],
  pmOperation: PostmanMappedOperation
  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
): PostmanMappedOperation => {
  // Early exit if request body form data is not defined
  if (!pmOperation.item?.request?.body?.formdata) return pmOperation
  const formData = pmOperation.item.request.body.formdata as PropertyList<FormParam>

  // Early exit if request body form data is empty defined
  if (formData.count() === 0) return pmOperation

  // New form data members
  const formMembers = [] as FormParam[]

  const formKeys = formData.map(({ key }) => key)
  // Detect overwrite form params that do not exist in the Postman collection
  const insertNewKeys = overwriteValues.filter(x => !formKeys.includes(x.key))

  formData.each(pmFormParam => {
    // Overwrite values for Keys
    const overwriteItem = overwriteValues.find(obj => {
      return obj.key === pmFormParam.key
    })

    // Test suite - Overwrite/extend request body form data param value
    if (overwriteItem?.value !== undefined && pmFormParam?.value) {
      const orgValue = pmFormParam.value
      let newValue = overwriteItem.value

      if (overwriteItem.overwrite === false) {
        newValue = orgValue + newValue
      }
      pmFormParam.value = newValue || 'boolean' === typeof newValue ? `${newValue}`.toString() : ''
    }

    // Test suite - Disable form data param
    if (overwriteItem?.disable === true) {
      pmFormParam.disabled = true
    }

    // Set Postman form data param
    if (!(overwriteItem?.remove === true)) {
      formMembers.push(pmFormParam)
    }
  })

  // Test suite - Add form data param
  insertNewKeys
    .filter(overwriteItem => !(overwriteItem.insert === false))
    .filter(overwriteItem => !(overwriteItem.remove === true))
    .map(formMember => {
      // Initialize new Postman query param
      const pmFormParam = {
        key: formMember.key,
        value: '',
        // description: '',
        disabled: false
      } as FormParam

      // Set form param properties based on the OverwriteValues
      if (formMember.value) pmFormParam.value = formMember.value
      if (formMember.disable === true) pmFormParam.disabled = true
      if (formMember.description) pmFormParam.description = formMember.description

      // Add Postman form data
      formMembers.push(pmFormParam)
    })

  // Clear existing & add new members
  formData.clear()
  formData.assimilate(formMembers, false)

  return pmOperation
}

/**
 * Helper - Encode Dynamic Postman variables for safe processing
 * @param jsonString
 */
export const makeJsonSafeDynamicPmVars = (jsonString: string): string => {
  // Handle {{$randomInt}},{{$randomCreditCardMask}} conversion from unescaped values to safe values
  const find = [
    // ': {{$randomInt}},',
    // ': {{$randomCreditCardMask}},',
    // ': {{$randomBankAccount}},',
    ': {{',
    '}},',
    '}}\n'
  ]
  const replace = [
    // ': "{{$randomInt}}",',
    // ': "{{$randomCreditCardMask}}",',
    // ': "{{$randomBankAccount}}",',
    ': "{{{',
    '}}}",',
    '}}}"\n'
  ]
  find.forEach(function (item, index) {
    // eslint-disable-next-line no-useless-escape
    const escapedFind = item.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, '\\$1')
    jsonString = jsonString.replace(new RegExp(escapedFind, 'g'), replace[index])
  })
  return jsonString
}

/**
 * Helper - Decode Dynamic Postman variables for safe processing
 * @param jsonString
 */
export const decodeDynamicPmVars = (jsonString: string): string => {
  // Handle {{$randomInt}},{{$randomCreditCardMask}} conversion from string to escaped number/boolean
  const find = [
    '"{{$randomInt}}"',
    '"{{$randomCreditCardMask}}"',
    '"{{$randomBankAccount}}"',
    '"{{{',
    '}}}"'
  ]
  const replace = [
    '{{$randomInt}}',
    '{{$randomCreditCardMask}}',
    '{{$randomBankAccount}}',
    '{{',
    '}}'
  ]
  find.forEach(function (item, index) {
    // eslint-disable-next-line no-useless-escape
    const escapedFind = item.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, '\\$1')
    jsonString = jsonString.replace(new RegExp(escapedFind, 'g'), replace[index])
  })
  return jsonString
}
