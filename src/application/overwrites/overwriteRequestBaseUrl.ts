import { PostmanMappedOperation } from '../../postman'
import { OverwriteRequestBaseUrlConfig } from '../../types'
// import { Header } from 'postman-collection'

/**
 * Overwrite Postman request headers with values defined by the portman testsuite
 * @param overwriteValues
 * @param pmOperation
 */
export const overwriteRequestBaseUrl = (
  overwriteItem: OverwriteRequestBaseUrlConfig,
  pmOperation: PostmanMappedOperation
): PostmanMappedOperation => {
  // Early exit if overwrite values are not defined
  if (!(overwriteItem !== undefined)) return pmOperation

  if (overwriteItem?.value !== undefined) {
    const orgValue = pmOperation.item.request.url.getHost()
    let newValue = overwriteItem.value
    if (overwriteItem.overwrite === false) {
      newValue = orgValue + newValue
    }
    pmOperation.item.request.url.update(newValue)
  }

  if (overwriteItem?.remove === true) {
    pmOperation.item.request.url.update('')
  }

  return pmOperation
}
