/* eslint-disable @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any */
import pluralize from 'pluralize'

export const overridePathParams = (obj: any): any => {
  obj.item.map(resource => {
    const singular = pluralize.singular(resource.name.toLowerCase())
    const variableName = `{{${singular}Id}}`
    resource.item
      .filter(({ request: { url } }) => {
        return url.path.includes(':id')
      })
      .map(item => {
        item.request.url.variable.map(item => {
          if (item.key === 'id') {
            item.value = variableName
          }
        })
      })
  })
  return obj
}
