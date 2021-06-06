// TODO review this method to use cleaner implementation

/**
 * Method to remove a nested property from an object by passing a path notation
 * @param obj the nested object
 * @param path the path definition (example: website[0].url)
 */
export const omitByPath = (obj: Record<string, unknown>, path: string): Record<string, unknown> => {
  // Create new array
  const paths: string[] = []

  // Split to an array with dot notation
  path.split('.').forEach(function (item) {
    // Split to an array with bracket notation
    item.split(/\[([^}]+)\]/g).forEach(function (key) {
      // Push to the new array
      if (key.length > 0) {
        paths.push(key)
      }
    })
  })

  const lastKey: string | undefined = paths.pop()
  const nextLastKey: string | undefined = paths.pop()
  const nextLastObj = paths.reduce((a, key) => a[key], obj)

  // delete version:
  // delete nextLastObj[nextLastKey][lastKey]

  // non-delete version:
  const { [lastKey]: _, ...rest } = nextLastObj[nextLastKey]
  nextLastObj[nextLastKey] = rest
  return obj
}
