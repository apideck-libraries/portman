/**
 * Method to render a safe, optional chained path notation
 * @param path the path definition (example: website[0].url)
 * @param legacyMode force Portman to render the full path
 */
export const renderChainPath = (path: string, legacyMode = false): string => {
  // Get Node version
  const m = process.version.match(/(\d+)\.(\d+)\.(\d+)/) || ['10.0.0', '10']
  const [major] = m.slice(1).map(_ => parseInt(_))
  if (major < 14 || legacyMode) {
    // Optional chaining is only supported from Node version 14, for lower versions we will return the less safe path
    return renderSafeFullPath(path)
  }
  // Transform the path to optional chained syntax
  // eslint-disable-next-line no-useless-escape
  return path
    .replace(/\./g, '?.')
    .replace(/\[+/g, '?.[')
    .replace(/\?\.\?\.+/g, '?.')
}

export const renderSafeFullPath = (path: string): string => {
  const s = path.split('.')
  if (s.length === 1) {
    return path
  }

  let newPath = ``
  for (let index = 0; index < s.length; index++) {
    const nextPath = s.slice(0, index + 1)
    newPath += `${nextPath.join('.')} && `
  }
  return `${newPath.slice(0, -4)}`
}
