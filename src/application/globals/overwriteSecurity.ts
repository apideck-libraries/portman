import { CollectionDefinition } from 'postman-collection'
import { SecurityOverwrite } from 'types'

export const overwriteSecurityValues = (
  collectionJson: CollectionDefinition | Partial<CollectionDefinition>,
  { apiKey, basic, bearer }: SecurityOverwrite
): CollectionDefinition => {
  // Early exit if no auth is defined
  if (!collectionJson.auth) return collectionJson

  // Handle OAS securitySchemes type apiKey
  if (collectionJson?.auth?.apikey && Array.isArray(collectionJson.auth.apikey) && apiKey?.value) {
    collectionJson.auth.apikey = collectionJson.auth.apikey.map(el =>
      el.key === 'value' ? { ...el, value: apiKey.value } : el
    )
  }

  // Handle OAS securitySchemes type:http, schema: basic
  if (
    collectionJson?.auth?.basic &&
    Array.isArray(collectionJson.auth.basic) &&
    basic?.username &&
    basic?.password
  ) {
    collectionJson.auth.basic = collectionJson.auth.basic.map(el =>
      el.key === 'username' ? { ...el, value: basic?.username } : el
    )
    collectionJson.auth.basic = collectionJson.auth.basic.map(el =>
      el.key === 'password' ? { ...el, value: basic?.password } : el
    )
  }

  // Handle OAS securitySchemes type:http, schema: basic
  if (collectionJson?.auth?.bearer && Array.isArray(collectionJson.auth.bearer) && bearer?.token) {
    collectionJson.auth.bearer = collectionJson.auth.bearer.map(el =>
      el.key === 'token' ? { ...el, value: bearer?.token } : el
    )
  }

  return collectionJson
}
