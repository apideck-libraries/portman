// TODO review this method to use cleaner implementation

/**
 * Method to set the value of a nested property from an object by passing a path notation
 * @param obj the nested object
 * @param path the path definition (example: website[0].url)
 * @param newValue the new value
 */
export const setByPath = (
  obj: Record<string, unknown>,
  path: string,
  newValue: any
): Record<string, unknown> => {
  const keys = path.replace('[', '.').replace(']', '').split('.')
  const last = keys.length - 1

  for (let i = 0; i < last; i++) {
    const prop = keys[i]
    if (!obj[prop]) obj[prop] = {}
    obj = obj[prop]
  }

  obj[keys[last]] = newValue
  return obj
}
