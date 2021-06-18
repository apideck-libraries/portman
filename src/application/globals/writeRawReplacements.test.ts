import { writeRawReplacements } from '../../application'

describe('writeRawReplacements', () => {
  it('should use config to replace all found values in string', () => {
    const config = [
      {
        searchFor: 'foo',
        replaceWith: 'bars'
      }
    ]

    const string = '{"root": "foo", "nested": {"foo": "monkey"}, "arr": ["monkey", "foo"]}'
    const result = writeRawReplacements(string, config)
    expect(result).toStrictEqual(
      '{"root": "bars", "nested": {"bars": "monkey"}, "arr": ["monkey", "bars"]}'
    )
  })
})
