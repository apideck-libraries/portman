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

  // Clone the pmOperation to not mutate the original object
  const newPm = pmOperation.clone({ newId: `${Math.random()}`, name: `${Math.random()}` })

  if (overwriteItem?.value !== undefined) {
    const orgValue = pmOperation.item.request.url.getHost()
    let newValue = overwriteItem.value
    if (overwriteItem.overwrite === false) {
      newValue = orgValue + newValue
    }
    // Overwrite host & protocol
    newPm.item.request.url.update(newValue)
  }

  if (overwriteItem?.remove === true) {
    newPm.item.request.url.update('')
  }

  // Update protocol, host & port
  pmOperation.item.request.url.protocol = newPm.item.request.url.protocol
  pmOperation.item.request.url.port = newPm.item.request.url.port
  pmOperation.item.request.url.host = newPm.item.request.url.host

  return pmOperation
}
