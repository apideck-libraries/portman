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

  // Check if the current auth method matches the type we want to overwrite
  // if (overwrite[authConfig.type]) {
  const authType = authConfig.type
  const newAuthDefinition: RequestAuthDefinition = {}
  const authMap = {}

  // Overwrite auth type with another type
  if (authType && !Object.keys(overwrite).includes(authType)) {
    // Unset the original request auth
    pmOperation.item.request.auth?.clear(authType)
  }

  // Add overwrite members to the map (overwriting if keys are the same)
  Object.entries(overwrite).forEach(([authKeyRaw, authValue]) => {
    const authKey = authKeyRaw.toLowerCase()
    if (!authTypes.includes(authType)) {
      return // Skip this authKey
    }

    // Initiate new mapping for overwrite auth type
    authMap[authKey] = new Map()

    // Add existing authDefinition members to the map
    if (authConfig[authKey]) {
      const authParams = authConfig[authKey].toJSON()
      authParams.forEach(member => {
        authMap[authKey].set(member.key, member.value)
      })
    }

    console.log(authKey, authValue)
    if (Array.isArray(overwrite[authKeyRaw])) {
      // Handle array of {key, value} objects
      overwrite[authKeyRaw].forEach(member => {
        authMap[authKey].set(member.key, member.value)
      })
    } else if (typeof overwrite[authKeyRaw] === 'object') {
      // Handle object with multiple key:value pairs
      Object.entries(overwrite[authKeyRaw]).forEach(([key, value]) => {
        authMap[authKey].set(key, value)
      })
    }

    newAuthDefinition.type = authKey as RequestAuthDefinition['type']
    newAuthDefinition[authKey] = Array.from(authMap[authKey], ([key, value]) => ({ key, value }))
    const requestAuth = new RequestAuth(newAuthDefinition)
    pmOperation.item.request.auth?.clear(authType)
    pmOperation.item.request.auth = requestAuth
  })

  return pmOperation
}
