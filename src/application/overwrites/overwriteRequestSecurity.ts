import { PostmanMappedOperation } from 'src/postman'
import { OverwriteRequestSecurityConfig } from 'src/types'
import { RequestAuth, RequestAuthDefinition } from 'postman-collection'

export const overwriteRequestSecurity = (
  overwrite: OverwriteRequestSecurityConfig,
  pmOperation: PostmanMappedOperation
): PostmanMappedOperation => {
  // Handle remove property
  if (overwrite?.remove) {
    const authType = pmOperation.item.request.auth?.type
    if (authType) {
      pmOperation.item.request.auth?.clear(authType)
      pmOperation.item.request.authorizeUsing('noauth')
    }
    return pmOperation
  }

  // Get the current auth method
  const authConfig = pmOperation.item.getAuth()
  const authTypes = [
    'oauth2',
    'hawk',
    'noauth',
    'basic',
    'oauth1',
    'apikey',
    'digest',
    'bearer',
    'awsv4',
    'edgegrid',
    'ntlm',
    undefined
  ]

  const authType = authConfig.type
  const newAuthDefinition: RequestAuthDefinition = {}
  const authMap = {}

  // Overwrite auth type with another type
  if (authType && !Object.keys(overwrite).includes(authType)) {
    // Unset the original request auth
    pmOperation.item.request.auth?.clear(authType)
  }

  Object.entries(overwrite).forEach(([authKeyRaw]) => {
    const authKey = authKeyRaw.toLowerCase()
    if (!authTypes.includes(authType)) {
      return // Skip this authKey
    }

    // Initiate new mapping for overwrite auth type
    authMap[authKey] = new Map()

    // Add existing auth type props to the map
    if (authConfig[authKey]) {
      const authParams = authConfig[authKey].toJSON()
      authParams.forEach(member => {
        authMap[authKey].set(member.key, member.value)
      })
    }

    // Add overwrite auth type props to the map
    if (Array.isArray(overwrite[authKeyRaw])) {
      overwrite[authKeyRaw].forEach(member => {
        authMap[authKey].set(member.key, member.value)
      })
    } else if (typeof overwrite[authKeyRaw] === 'object') {
      Object.entries(overwrite[authKeyRaw]).forEach(([key, value]) => {
        authMap[authKey].set(key, value)
      })
    }

    // Create Postman Auth definition
    newAuthDefinition.type = authKey as RequestAuthDefinition['type']
    newAuthDefinition[authKey] = Array.from(authMap[authKey], ([key, value]) => ({ key, value }))
    const requestAuth = new RequestAuth(newAuthDefinition)

    // Set the new Postman Auth to the request
    pmOperation.item.request.auth?.clear(authType)
    pmOperation.item.request.auth = requestAuth
  })

  return pmOperation
}
