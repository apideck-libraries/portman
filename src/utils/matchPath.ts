import { pathToRegExp } from './pathToRegex'

export const matchPath = (targetPath: string | RegExp, operationPath: string): boolean => {
  // If targetPath is already a regular expression, use it
  const expression = targetPath instanceof RegExp ? targetPath : pathToRegExp(targetPath)
  const match = expression.exec(operationPath) || false

  // If there's no match, return false
  if (!match) return false

  // Split both targetPath and operationPath into segments
  const targetSegments = typeof targetPath === 'string' ? targetPath.split('/') : []
  const operationSegments = operationPath.split('/')

  // Ensure the segment lengths match when there is no wildcard in targetPath
  if (targetSegments.length > 0 && operationSegments.length > 0) {
    const lastTargetSegment = targetSegments[targetSegments.length - 1]
    const lastOperationSegment = operationSegments[operationSegments.length - 1]

    // If the last segment of targetPath is a wildcard (*), we allow any last segment
    if (lastTargetSegment === '*') {
      return true
    }

    // If the lengths of the paths don't match and there is no wildcard, return false
    if (targetSegments.length !== operationSegments.length) {
      return false
    }

    // If the last segment is a parameter (e.g., :id), allow any last segment
    if (lastTargetSegment.startsWith(':')) {
      return true
    }

    // Ensure the last segments match exactly if it's not a wildcard or parameter
    if (lastTargetSegment !== lastOperationSegment) {
      return false
    }
  }

  // Strict match check: the entire matched string should equal the input string
  const matches = targetPath instanceof RegExp ? !!match : !!match && match[0] === match.input

  return matches
}
