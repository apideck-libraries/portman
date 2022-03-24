import { CollectionDefinition } from 'postman-collection'
import { AuthAttribute, SecurityOverwrite } from 'types'

export const overwriteCollectionSecurityValues = (
  collectionJson: CollectionDefinition | Partial<CollectionDefinition>,
  { apiKey, basic, bearer, awsv4, digest, edgegrid, ntlm, oauth1, oauth2 }: SecurityOverwrite
): CollectionDefinition => {
  let defaultSecurity = false

  // Check default security types
  if (apiKey !== undefined || basic !== undefined || bearer !== undefined) {
    defaultSecurity = true
  }

  // Handle OAS securitySchemes type apiKey
  if (
    collectionJson?.auth?.apikey &&
    Array.isArray(collectionJson.auth.apikey) &&
    apiKey?.value &&
    defaultSecurity
  ) {
    collectionJson.auth.apikey = collectionJson.auth.apikey.map(el =>
      el.key === 'value' ? { ...el, value: apiKey.value } : el
    )

    if (apiKey?.key) {
      collectionJson.auth.apikey = collectionJson.auth.apikey.map(el =>
        el.key === 'key' ? { ...el, value: apiKey.key } : el
      )
    }
    const apikeyInOptions = ['header', 'query']
    if (apiKey?.in && apikeyInOptions.includes(apiKey?.in)) {
      collectionJson.auth.apikey = collectionJson.auth.apikey.map(el =>
        el.key === 'in' ? { ...el, value: apiKey.in } : el
      )
    }
  }

  // Handle OAS securitySchemes type:http, schema: basic
  if (
    collectionJson?.auth?.basic &&
    Array.isArray(collectionJson.auth.basic) &&
    basic?.username &&
    basic?.password &&
    defaultSecurity
  ) {
    collectionJson.auth.basic = collectionJson.auth.basic.map(el =>
      el.key === 'username' ? { ...el, value: basic?.username } : el
    )
    collectionJson.auth.basic = collectionJson.auth.basic.map(el =>
      el.key === 'password' ? { ...el, value: basic?.password } : el
    )
  }

  // Handle OAS securitySchemes type:http, schema: bearer
  if (
    collectionJson?.auth?.bearer &&
    Array.isArray(collectionJson.auth.bearer) &&
    bearer?.token &&
    defaultSecurity
  ) {
    collectionJson.auth.bearer = collectionJson.auth.bearer.map(el =>
      el.key === 'token' ? { ...el, value: bearer?.token } : el
    )
  }

  // Handle Postman securitySchemes types: awsv4, digest, edgegrid, ntlm, oauth1, oauth2
  if (
    defaultSecurity === false &&
    !collectionJson.auth &&
    (awsv4 || digest || edgegrid || ntlm || oauth1 || oauth2)
  ) {
    let type
    let authAttributes = [] as AuthAttribute[]

    if (awsv4) {
      type = 'awsv4'
      authAttributes = awsv4 || []
    }
    if (digest) {
      type = 'digest'
      authAttributes = digest || []
    }
    if (edgegrid) {
      type = 'edgegrid'
      authAttributes = edgegrid || []
    }
    if (ntlm) {
      type = 'ntlm'
      authAttributes = ntlm || []
    }
    if (oauth1) {
      type = 'oauth1'
      authAttributes = oauth1 || []
    }
    if (oauth2) {
      type = 'oauth2'
      authAttributes = oauth2 || []
    }

    if (type) {
      // Build auth object using AuthAttributes
      collectionJson.auth = { type: type }
      collectionJson.auth[type] = authAttributes
    }
  }

  return collectionJson
}
