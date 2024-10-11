import { matchPath } from './matchPath'

describe('matchPath', () => {
  it('should match a path when targetPath is the same', () => {
    const targetPath = '/messages/123'
    const operationPath = '/messages/123'
    expect(matchPath(targetPath, operationPath)).toBe(true)
  })

  it('should not match a path when targetPath is different', () => {
    const targetPath = '/messages/456'
    const operationPath = '/messages/123'
    expect(matchPath(targetPath, operationPath)).toBe(false)
  })

  it('should not match a path when targetPath does not match operationPath', () => {
    const targetPath = '/messages/:id'
    const operationPath = '/users/123'
    expect(matchPath(targetPath, operationPath)).toBe(false)
  })

  it('should not match a path when targetPath does not match operationPath with wildcard', () => {
    const targetPath = '/*/{id}'
    const operationPath = '/plaid_accounts/fetch'
    expect(matchPath(targetPath, operationPath)).toBe(false)
  })

  it('should match a path when targetPath is a RegExp', () => {
    const targetPath = /^\/messages\/\d+$/
    const operationPath = '/messages/123'
    expect(matchPath(targetPath, operationPath)).toBe(true)
  })

  it('should return false for paths that do not match the RegExp', () => {
    const targetPath = /^\/messages\/\d+$/
    const operationPath = '/messages/abc'
    expect(matchPath(targetPath, operationPath)).toBe(false)
  })

  it('should handle edge cases where operationPath is empty', () => {
    const targetPath = '/messages/:id'
    const operationPath = ''
    expect(matchPath(targetPath, operationPath)).toBe(false)
  })

  it('should handle cases where targetPath is a RegExp with strict matching', () => {
    const targetPath = /^\/messages\/\d+$/
    const operationPath = '/messages/123/users'
    expect(matchPath(targetPath, operationPath)).toBe(false)
  })

  it('should match a path with deeper nesting when targetPath contains a parameter', () => {
    const targetPath = '/messages/:id/details'
    const operationPath = '/messages/123/details'
    expect(matchPath(targetPath, operationPath)).toBe(true)
  })

  it('should not match when operationPath has more segments than targetPath', () => {
    const targetPath = '/messages/:id'
    const operationPath = '/messages/123/details'
    expect(matchPath(targetPath, operationPath)).toBe(false)
  })

  it('should match a path with a wildcard spanning multiple segments', () => {
    const targetPath = '/messages/*'
    const operationPath = '/messages/123/details/extra'
    expect(matchPath(targetPath, operationPath)).toBe(true)
  })

  it('should return false when targetPath is empty', () => {
    const targetPath = ''
    const operationPath = '/messages/123'
    expect(matchPath(targetPath, operationPath)).toBe(false)
  })

  it('should match any operationPath when targetPath is only a wildcard', () => {
    const targetPath = '*'
    const operationPath = '/any/path/here'
    expect(matchPath(targetPath, operationPath)).toBe(true)
  })

  it('should match multiple segments with multiple wildcards in targetPath', () => {
    const targetPath = '/*/*/details'
    const operationPath = '/messages/123/details'
    expect(matchPath(targetPath, operationPath)).toBe(true)
  })
})
