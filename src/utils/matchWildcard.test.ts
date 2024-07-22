import { matchWildcard } from './matchWildcard'

describe('matchWildcard', () => {
  it('should match query key with single wildcard pattern', () => {
    expect(matchWildcard('filter[0]', 'filter[*]')).toBe(true)
    expect(matchWildcard('filter[1]', 'filter[*]')).toBe(true)
    expect(matchWildcard('filter[something]', 'filter[*]')).toBe(true)
    expect(matchWildcard('filter[0][value]', 'filter[*]')).toBe(true)
    expect(matchWildcard('filter_0_value', 'filter_*_value')).toBe(true)
    expect(matchWildcard('filter_123_value', 'filter_*_value')).toBe(true)
    expect(matchWildcard('Filter_0_Value', 'Filter_*_Value')).toBe(true)
    expect(matchWildcard('filter0Value', 'filter*Value')).toBe(true)
    expect(matchWildcard('filterXValue', 'filter*Value')).toBe(true)
    expect(matchWildcard('filter123Value', 'filter*Value')).toBe(true)
    expect(matchWildcard('filterXYZvalue', 'filter*value')).toBe(true)
    expect(matchWildcard('filter.special', 'filter.*')).toBe(true)
    expect(matchWildcard('filter+special', 'filter+*')).toBe(true)
    expect(matchWildcard('filter[special]', 'filter[*]')).toBe(true)
    expect(matchWildcard('filter(special)', 'filter(*)')).toBe(true)
  })

  it('should match query key with double wildcard pattern', () => {
    expect(matchWildcard('filter[0][value]', 'filter[*][*]')).toBe(true)
    expect(matchWildcard('filter[1][something]', 'filter[*][*]')).toBe(true)
    expect(matchWildcard('filter[0][value][extra]', 'filter[*][*]')).toBe(true)
  })

  it('should not match query key without correct pattern', () => {
    expect(matchWildcard('filter[0]', 'filter[*][*]')).toBe(false)
    expect(matchWildcard('filter_0_value', 'Filter_*_Value')).toBe(false)
    expect(matchWildcard('filter0value', 'filter*Value')).toBe(false)
    expect(matchWildcard('filterXvalue', 'filter*Value')).toBe(false)
    expect(matchWildcard('anotherKey', 'filter[*]')).toBe(false)
    expect(matchWildcard('filter[0]', 'anotherPattern[*]')).toBe(false)
    expect(matchWildcard('', 'filter[*]')).toBe(false)
    expect(matchWildcard('filter[0]', '')).toBe(false)
    expect(matchWildcard('filter[0]', 'filter')).toBe(false)
  })
})
