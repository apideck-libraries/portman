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

  // Convert path to safe path
  const safePath = renderBracketPath(path)

  // Transform safe path to optional chained path
  // eslint-disable-next-line no-useless-escape
  return safePath
    .replace(/\./g, '?.')
    .replace(/\[+/g, '?.[')
    .replace(/\?\.\?\.+/g, '?.')
}

export const detectUnsafeCharacters = (path: string): boolean => {
  // If path is wrapped in quotes already, it's safe/handled
  if (
    (path.startsWith("'") && path.endsWith("'")) ||
    (path.startsWith('"') && path.endsWith('"'))
  ) {
    return false
  }

  // Check if a segment is a valid JS identifier (/^[A-Za-z_$][\w$]*$/)
  const isValidIdentifier = (str: string): boolean => {
    return /^[A-Za-z_$][\w$]*$/.test(str)
  }

  // Get string between brackets
  const getStringBetweenBrackets = (str: string): string => {
    const start = str.indexOf('[')
    const end = str.indexOf(']')
    return str.slice(start + 1, end)
  }

  // Detect if the path is within brackets
  const regexCharacterInBrackets = /\[.*?\]/g
  const matches = path.match(regexCharacterInBrackets)
  if (matches) {
    for (const match of matches) {
      let str = getStringBetweenBrackets(match)
      if (
        (str.startsWith("'") && str.endsWith("'")) ||
        (str.startsWith('"') && str.endsWith('"'))
      ) {
        str = str.slice(1, -1)
      }
      if (!isValidIdentifier(str)) {
        return true
      }
    }
  }

  // If it's a dotted segment or top-level path
  if (!isValidIdentifier(path)) {
    return true
  }

  return false
}

export const renderSafeFullPath = (path: string): string => {
  // Convert path to safe path
  const safePath = renderBracketPath(path)

  const s = safePath.split('.')
  if (s.length === 1) {
    if (detectUnsafeCharacters(safePath)) {
      return `['${safePath}']`
    }
    return safePath
  }

  let newPath = ``
  for (let index = 0; index < s.length; index++) {
    const nextPath = s.slice(0, index + 1)
    newPath += `${nextPath.join('.')} && `
  }
  return `${newPath.slice(0, -4)}`
}

export const renderBracketPath = (path: string): string => {
  const s = path.split('.')
  if (s.length === 1) {
    if (detectUnsafeCharacters(path)) {
      return `["${path}"]`
    }
    return path
  }

  let newPath = ``
  for (let index = 0; index < s.length; index++) {
    const nextPath = s[index]

    // Split path into parts per brackets
    const p = nextPath.split('[')

    // Single path part (no brackets found)
    if (p.length === 1) {
      if (detectUnsafeCharacters(nextPath)) {
        newPath += `["${nextPath}"].`
      } else if (nextPath.includes(']')) {
        newPath += `[${nextPath}.`
      } else {
        newPath += `${nextPath}.`
      }
    }

    // Multiple path parts (split by brackets)
    let newPart = ``
    for (let partIndex = 0; partIndex < p.length; partIndex++) {
      const nextPart = p[partIndex]

      if (detectUnsafeCharacters(nextPart)) {
        newPart += `["${nextPart}"]`
      } else if (nextPart.includes(']')) {
        newPart += `[${nextPart}`
      } else {
        newPart += `${nextPart}`
      }
    }

    // Check every nextPath to see if it is unsafe
    if (p.length > 1) {
      newPath += `${newPart}.`
    }
  }
  return newPath.slice(0, -1).replace(/\.$/, '')
}

export const sanitizeKeyForVar = (key: string): string => {
  // Remove any character that is not a letter, digit, underscore, or dollar sign.
  return key.replace(/[^a-zA-Z0-9_$]/g, '_')
}
