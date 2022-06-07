/* eslint-disable no-useless-escape */
export const pathToRegExp = (path: string): RegExp => {
  const pattern = path
    // Transform OpenApi format to Postman format (/crm/leads/{id} => /crm/leads/:id)
    .replace('{', ':')
    .replace('}', '')
    // Escape literal dots
    .replace(/\./g, '\\.')
    // Escape literal slashes
    .replace(/\/\//g, '/')
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
