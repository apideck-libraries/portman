import { PostmanMappedOperation } from '../../postman'
import { parseTpl, getByPath, hasTpl, isObject, omitByPath, setByPath } from '../../utils'
import { FormParam, PropertyList, QueryParam } from 'postman-collection'
import { OverwriteRequestDTO } from './applyOverwrites'

/**
 * Overwrite Postman request body with values defined by the portman testsuite
 * @param dto
 */
export const overwriteRequestBody = (dto: OverwriteRequestDTO): PostmanMappedOperation => {
  const { overwriteValues, pmOperation } = dto

  // Early exit if overwrite values are not defined
  if (!(overwriteValues instanceof Array)) return pmOperation

  if (pmOperation.item?.request?.body?.raw) {
    // Overwrite JSON values
    overwriteRequestBodyJson(dto)
    return pmOperation
  }
  if (pmOperation.item?.request?.body?.formdata) {
    // Overwrite Form data values
    overwriteRequestBodyFormData(dto)
    return pmOperation
  }
  if (pmOperation.item?.request?.body?.urlencoded) {
    // Overwrite Form url encoded values
    overwriteRequestBodyFormUrlEncoded(dto)
    return pmOperation
  }

  return pmOperation
}

/**
 * Overwrite JSON values in the request body values
 * @param dto
 */
export const overwriteRequestBodyJson = (dto: OverwriteRequestDTO): PostmanMappedOperation => {
  const { overwriteValues, pmOperation, oaOperation, globals } = dto
  // Early exit if overwrite values are not defined
  if (!(overwriteValues instanceof Array)) return pmOperation

  // Early exit if request body is not defined
  if (!pmOperation.item?.request?.body?.raw) return pmOperation
  const requestBody = pmOperation.item.request.body.raw

  // Make postman body safe
  const requestBodySafe = makeJsonSafeDynamicPmVars(requestBody)

  // Overwrite values for Keys
  let bodyData = JSON.parse(requestBodySafe)
  overwriteValues.map(overwriteItem => {
    if (overwriteItem?.key && typeof overwriteItem?.value !== 'undefined') {
      const root = overwriteItem.key === '.'
      const originalValue = root ? bodyData : getByPath(bodyData, overwriteItem.key)
      const generatedName = parseTpl({
        template: overwriteItem.value,
        oaOperation: oaOperation,
        options: {
          casing: globals?.variableCasing
        }
      })

      let newValue =
        overwriteItem?.value && hasTpl(overwriteItem.value) ? generatedName : overwriteItem?.value

      if (overwriteItem?.overwrite === false) {
        if (Array.isArray(originalValue) && Array.isArray(newValue)) {
          newValue = originalValue.concat(newValue)
        } else if (isObject(originalValue)) {
          newValue = { ...(originalValue as Record<string, unknown>), ...newValue }
        } else {
          newValue = originalValue + newValue
        }
      }

      if (root) {
        bodyData = overwriteItem.overwrite ? newValue : { ...bodyData, ...newValue }
      } else {
        bodyData = setByPath(bodyData, overwriteItem.key, newValue)
      }
    }

    if (overwriteItem.key && overwriteItem.remove === true) {
      bodyData = omitByPath(bodyData, overwriteItem.key)
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
 * Overwrite form-data values in the request body values
 * @param dto
 */
export const overwriteRequestBodyFormData = (dto: OverwriteRequestDTO): PostmanMappedOperation => {
  const { overwriteValues, pmOperation, oaOperation, globals } = dto
  // Early exit if overwrite values are not defined
  if (!(overwriteValues instanceof Array)) return pmOperation

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
    if (overwriteItem?.value !== undefined) {
      const pmFormParamAny = pmFormParam as any
      const orgValue = pmFormParamAny.value || pmFormParamAny.src
      const generatedName = parseTpl({
        template: overwriteItem.value,
        oaOperation: oaOperation,
        options: {
          casing: globals?.variableCasing
        }
      })
      let newValue =
        overwriteItem?.value && hasTpl(overwriteItem.value) ? generatedName : overwriteItem?.value

      if (overwriteItem.overwrite === false && typeof orgValue === 'string') {
        newValue = orgValue + newValue
      }

      if (pmFormParamAny.type === 'file') {
        pmFormParamAny.src = newValue as string
      } else {
        pmFormParamAny.value = (newValue || typeof newValue === 'boolean') ? `${newValue}`.toString() : ''
      }
    }

    // Test suite - Disable form data param
    if (overwriteItem?.disable === true) {
      pmFormParam.disabled = true
    }

    if (overwriteItem?.description !== undefined && pmFormParam?.description) {
      pmFormParam.description = overwriteItem.description
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
 * Overwrite x-www-form-urlencoded values in the request body values
 * @param dto
 */
export const overwriteRequestBodyFormUrlEncoded = (
  dto: OverwriteRequestDTO
): PostmanMappedOperation => {
  const { overwriteValues, pmOperation, oaOperation, globals } = dto
  // Early exit if overwrite values are not defined
  if (!(overwriteValues instanceof Array)) return pmOperation

  // Early exit if request body form url encoded is not defined
  if (!pmOperation.item?.request?.body?.urlencoded) return pmOperation
  const formEncoded = pmOperation.item.request.body.urlencoded as PropertyList<QueryParam>

  // Early exit if request body form data is empty defined
  if (formEncoded.count() === 0) return pmOperation

  // New form encoded members
  const formMembers = [] as QueryParam[]

  const formKeys = formEncoded.map(({ key }) => key)
  // Detect overwrite form params that do not exist in the Postman collection
  const insertNewKeys = overwriteValues.filter(x => !formKeys.includes(x.key))

  formEncoded.each(pmFormParam => {
    // Overwrite values for Keys
    const overwriteItem = overwriteValues.find(obj => {
      return obj.key === pmFormParam.key
    })

    // Test suite - Overwrite/extend request body form encoded param value
    if (overwriteItem?.value !== undefined && pmFormParam?.value) {
      const orgValue = pmFormParam.value
      const generatedName = parseTpl({
        template: overwriteItem.value,
        oaOperation: oaOperation,
        options: {
          casing: globals?.variableCasing
        }
      })
      let newValue =
        overwriteItem?.value && hasTpl(overwriteItem.value) ? generatedName : overwriteItem?.value

      if (overwriteItem.overwrite === false) {
        newValue = orgValue + newValue
      }
      pmFormParam.value = newValue || 'boolean' === typeof newValue ? `${newValue}`.toString() : ''
    }

    // Test suite - Disable form encoded param
    if (overwriteItem?.disable === true) {
      pmFormParam.disabled = true
    }

    if (overwriteItem?.description !== undefined && pmFormParam?.description) {
      pmFormParam.description = overwriteItem.description
    }

    // Set Postman form encoded param
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
      } as QueryParam

      // Set form param properties based on the OverwriteValues
      if (formMember.value) pmFormParam.value = formMember.value
      if (formMember.disable === true) pmFormParam.disabled = true
      if (formMember.description) pmFormParam.description = formMember.description

      // Add Postman form encoded param
      formMembers.push(pmFormParam)
    })

  // Clear existing & add new members
  formEncoded.clear()
  formEncoded.assimilate(formMembers, false)

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
