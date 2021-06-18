import { pathToRegExp } from './pathToRegex'

export const matchPath = (targetPath: string | RegExp, operationPath: string): boolean => {
  const expression = targetPath instanceof RegExp ? targetPath : pathToRegExp(targetPath)
  const match = expression.exec(operationPath) || false
  // Matches in strict mode: match string should equal to input (url)
  // Otherwise loose matches will be considered truthy:
  // match('/messages/:id', '/messages/123/users') // true
  // eslint-disable-next-line one-var,no-implicit-coercion
  const matches = targetPath instanceof RegExp ? !!match : !!match && match[0] === match.input
  return matches
}
