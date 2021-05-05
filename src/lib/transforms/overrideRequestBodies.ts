/* eslint-disable @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any */
export const overrideRequestBodies = (obj: any): any => {
  obj.item.map(resource => {
    const create = resource.item.find(({ request: { method } }) => {
      return method === 'POST'
    })

    const update = resource.item.find(({ request: { method } }) => {
      return method === 'PATCH'
    })

    if (update && create) {
      update.request.body = { ...create.request.body }
    }
  })
  return obj
}
