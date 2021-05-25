/* eslint-disable @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any */
export const disableOptionalParams = (obj: any): any => {
  if (!obj?.item) {
    return obj
  }

  obj.item.map(resource => {
    const hasQuery = resource.item.filter(({ request: { url } }) => {
      return (
        url.query.filter(({ key }) => {
          return [
            'cursor',
            'filter[email]',
            'filter[first_name]',
            'filter[last_name]',
            'filter[name]'
          ].includes(key)
        }).length > 0
      )
    })

    hasQuery &&
      hasQuery.map(item => {
        item.request.url.query.map(item => {
          if (
            [
              'cursor',
              'filter[email]',
              'filter[first_name]',
              'filter[last_name]',
              'filter[name]'
            ].includes(item.key)
          ) {
            item.disabled = true
          }
        })
      })
  })
  return obj
}
