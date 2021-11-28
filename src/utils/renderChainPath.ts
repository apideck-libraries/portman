/**
 * Method to render a safe, optional chained path notation
 * @param path the path definition (example: website[0].url)
 */
export const renderChainPath = (path: string): string => {
  const m = process.version.match(/(\d+)\.(\d+)\.(\d+)/)
  const [major] = m.slice(1).map(_ => parseInt(_))
  if (major < 14) {
    // Optional chaining is only supported from Node version 14, for lower versions we will return the less safe path
    return path
  }
  // Transform the path to optional chained syntax
  // eslint-disable-next-line no-useless-escape
  return path.replace(/\./g, '?.').replace(/[\[']+/g, '?.[')
}
