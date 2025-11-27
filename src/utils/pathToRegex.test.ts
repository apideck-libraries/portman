import { pathToRegExp } from './pathToRegex'

describe('pathToRegExp', () => {
  it('should convert single OpenAPI parameter to regex', () => {
    expect(pathToRegExp('/users/{id}').test('/users/123')).toBe(true)
    expect(pathToRegExp('/users/{id}').test('/users/abc')).toBe(true)
  })

  it('should convert multiple OpenAPI parameters to regex', () => {
    expect(pathToRegExp('/users/{userId}/posts/{postId}').test('/users/123/posts/456')).toBe(true)
    expect(pathToRegExp('/users/{userId}/posts/{postId}').test('/users/abc/posts/def')).toBe(true)
    expect(pathToRegExp('/users/{userId}/posts/{postId}').test('/users/123/posts')).toBe(false)
  })

  it('should handle paths with three or more parameters', () => {
    expect(pathToRegExp('/orgs/{orgId}/teams/{teamId}/members/{memberId}').test('/orgs/1/teams/2/members/3')).toBe(true)
  })
})
