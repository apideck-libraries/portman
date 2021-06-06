import { PostmanMappedOperation } from 'lib/postman/PostmanMappedOperation'

/**
 * Overwrite Postman request path variables with values defined by the portman testsuite
 * @param overwriteValues
 * @param pmOperation
 */
export const overwriteRequestPath = (
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
  // Early exit if overwrite values are not defined
  if (!(overwriteValues instanceof Array)) return pmOperation

  // Early exit if request path variables are not defined
  if (!pmOperation.item?.request) return pmOperation

  pmOperation.item.request.url.path.forEach(pathVar => {
    // Overwrite values for Keys
    overwriteValues.forEach(overwriteValue => {
      // Skip keys when no overwrite is defined
      if (!(overwriteValue.key && pmHeader.key && overwriteValue.key === pmHeader.key)) {
        return
      }

      if (
        overwriteValue.key &&
        pathVar.name &&
        overwriteValue.key === pathVar.name &&
        overwriteValue.hasOwnProperty('value') &&
        pathVar.schema
      ) {
        let orgValue = pathVar.schema.example ? pathVar.schema.example : null,
          newValue = overwriteValue.value

        if (overwriteValue.overwrite === false) {
          newValue = orgValue + newValue
        }
        pathVar.schema.type = 'string' // Set schema as type string dynamic variable
        pathVar.schema.example = newValue

        if (overwriteValue.remove === true) {
          testRequestPathVariables.splice(index, 1)
        }
      }
    })
  })

  return pmOperation
}
