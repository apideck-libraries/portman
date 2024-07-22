export const matchWildcard = (input: string, pattern: string): boolean => {
  // Use the * wildcard to match a pattern
  const escapeRegExp = (str: string) => str.replace(/([.+?^=!:${}()|[\]/\\])/g, '\\$1')
  const regexPattern = escapeRegExp(pattern).replace(/\*/g, '.*')

  const regex = new RegExp(`^${regexPattern}$`)

  // Test the input against the regex
  return regex.test(input)
}
