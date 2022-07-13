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

export const renderSafePath = (path: string): string => {
  // Convert JS object with special characters @-^ in key names to bracket notation
  const specialChars = ['`', '@', '^', '-', '?', '*', ')', '/', '>', 'ル']
  let newPath = ``

  // Convert dot notation to bracket notation
  // const rawPath = path.split('.').reduce((fullPath, arg) => {
  //   fullPath + `['${arg}']`
  // })
  const rawPath = path.split('.').forEach(val => {
    const rawPart = val.split('[').shift()

    if (rawPart) {
      const pathIsSpecial = specialChars.some(char => rawPart.includes(char))
      if (pathIsSpecial) {
        return newPath + `["${rawPart}"]`
      }
    }

    return newPath + `["${rawPart}"]`
  })
  console.log('rawPath', rawPath)

  // Replace special characters with brackets
  // const s = path.split('.')
  // if (s.length === 1) {
  //   const pathIsSpecial = specialChars.some(char => path.includes(char))
  //   if (pathIsSpecial) {
  //     return `["${path}"]`
  //   }
  //   return path
  // }

  // for (let index = 0; index < s.length; index++) {
  //   // Replace special characters with brackets
  //   const nextPath = s.slice(0, index + 1)
  //
  //   // Check if the next path is a special character
  //   const nextPathIsSpecial = specialChars.some(char => nextPath.includes(char))
  //
  //   // If the next path is a special character, we need to wrap it in brackets
  //   if (nextPathIsSpecial) {
  //     newPath += `[${nextPath.join('.')}]`
  //   }
  // }

  // specialChars.map(specialChar => {
  //   path = path.replace(new RegExp(specialChar, 'g'), `[${specialChar}]`)
  // })

  return newPath
}
