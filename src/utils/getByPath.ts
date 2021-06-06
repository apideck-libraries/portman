/**
 * Method to get the value of a nested property from an object by passing a path notation
 * @param obj the nested object
 * @param path the path definition (example: website[0].url)
 * @param defaultValue
 */
export const getByPath = (
  obj: Record<string, unknown>,
  path: string,
  defaultValue = undefined
): string => {
  const travel = regexp =>
    String.prototype.split
      .call(path, regexp)
      .filter(Boolean)
      .reduce((res, key) => (res !== null && res !== undefined ? res[key] : res), obj)
  const result = travel(/[,[\]]+?/) || travel(/[,[\].]+?/)
  return result === undefined || result === obj ? defaultValue : result
}
