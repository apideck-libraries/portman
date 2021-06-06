/**
 * A check if the OpenApi operation item matches a target definition .
 * @param {object} operationItem the OpenApi operation item to match
 * @param {object} target the entered path definition that is a combination of the method & path, like GET::/lists
 * @returns {boolean} matching information
 */
export const isMatchOperationItem = (operationItem: any, target: any): boolean => {
  if (target.openApiOperationId) {
    return (
      operationItem.properties &&
      operationItem.properties.operationId &&
      operationItem.properties.operationId === target.openApiOperationId
    )
  }

  if (target.openApiOperation) {
    const targetSplit = target.openApiOperation.split('::/')
    if (targetSplit[0] && targetSplit[1]) {
      let targetMethod = [targetSplit[0].toLowerCase()]
      const targetPath = targetSplit[1].toLowerCase()
      // Wildcard support
      if (targetMethod.includes('*')) {
        // These are the methods supported in the PathItem schema
        // https://github.com/OAI/OpenAPI-Specification/blob/master/versions/3.0.2.md#pathItemObject
        targetMethod = ['get', 'put', 'post', 'delete', 'options', 'head', 'patch', 'trace']
      }
      return (
        operationItem.method &&
        targetMethod.includes(operationItem.method.toLowerCase()) &&
        operationItem.path &&
        matchPath(targetPath, operationItem.path.toLowerCase())
      )
    }
  }

  return false
}

/**
 * Converts a string path to a Regular Expression.
 * Transforms path parameters into named RegExp groups.
 * @param {*} path the path pattern to match
 * @returns {RegExp} Return a regex
 * @no-unit-tests
 */
export const pathToRegExp = (path: string): RegExp => {
  const pattern = path
    // Escape literal dots
    .replace(/\./g, '\\.')
    // Escape literal slashes
    .replace(/\//g, '/')
    // Escape literal question marks
    .replace(/\?/g, '\\?')
    // Ignore trailing slashes
    .replace(/\/+$/, '')
    // Replace wildcard with any zero-to-any character sequence
    .replace(/\*+/g, '.*')
    // Replace parameters with named capturing groups
    .replace(/:([^\d|^\/][a-zA-Z0-9_]*(?=(?:\/|\\.)|$))/g, (_, paramName) => {
      return `(?<${paramName}>[^\/]+?)`
    })
    // Allow optional trailing slash
    .concat('(\\/|$)')
  return new RegExp(pattern, 'gi')
}

/**
 * Matches a given url against a path, with Wildcard support (based on the node-match-path package)
 * @param {*} path the path pattern to match
 * @param {*} url the entered URL is being evaluated for matching
 * @returns {Object} matching information
 */
export const matchPath = (path: RegExp, url: string): boolean => {
  const expression = path instanceof RegExp ? path : pathToRegExp(path),
    match = expression.exec(url) || false
  // Matches in strict mode: match string should equal to input (url)
  // Otherwise loose matches will be considered truthy:
  // match('/messages/:id', '/messages/123/users') // true
  // eslint-disable-next-line one-var,no-implicit-coercion
  const matches = path instanceof RegExp ? !!match : !!match && match[0] === match.input
  return matches
  // return {
  //   matches,
  //   params: match && matches ? match.groups || null : null
  // };
}
