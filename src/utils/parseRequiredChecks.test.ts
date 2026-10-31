import { parseRequiredChecks } from './parseRequiredChecks'

describe('parseRequiredChecks', () => {
  it('should return an empty list when not set', () => {
    expect(parseRequiredChecks(undefined)).toEqual([])
  })

  it('should parse a comma-separated list', () => {
    expect(parseRequiredChecks('statusSuccess, contentType,schemaValidation')).toEqual([
      'statusSuccess',
      'contentType',
      'schemaValidation'
    ])
  })

  it('should parse an array and remove duplicates', () => {
    expect(parseRequiredChecks(['statusSuccess', 'statusSuccess,jsonBody'])).toEqual([
      'statusSuccess',
      'jsonBody'
    ])
  })

  it('should throw on unknown check names', () => {
    expect(() => parseRequiredChecks('statusSuccess,schemaValidaton')).toThrow(
      /Unknown contract test check\(s\): schemaValidaton/
    )
  })
})
