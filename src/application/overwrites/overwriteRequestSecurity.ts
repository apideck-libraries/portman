import { PostmanMappedOperation } from 'src/postman'
import { OverwriteRequestSecurityConfig } from 'src/types'

export const overwriteRequestSecurity = (
  overwrite: OverwriteRequestSecurityConfig,
  pmOperation: PostmanMappedOperation
): PostmanMappedOperation => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let authDefinition: any

  if (overwrite?.apiKey) {
    authDefinition = { ...overwrite.apiKey, type: 'apikey' }
  } else if (overwrite?.basic) {
    authDefinition = { ...overwrite.basic, type: 'basic' }
  } else if (overwrite?.bearer) {
    authDefinition = { ...overwrite.bearer, type: 'bearer' }
  } else if (overwrite?.other) {
    authDefinition = { ...overwrite.other }
  }

  // Get the current auth method
  const authConfig = pmOperation.item.getAuth()

  // Check if the current auth method matches the type we want to overwrite
  if (authConfig.type === authDefinition.type) {
    const members = authConfig[authDefinition.type]?.members?.reduce((acc, member) => {
      acc[member.key] = member.value
      return acc
    }, {})
    authDefinition = { ...members, ...authDefinition }
  }

  authDefinition && pmOperation.item.request.authorizeUsing({ ...authDefinition })

  return pmOperation
}
