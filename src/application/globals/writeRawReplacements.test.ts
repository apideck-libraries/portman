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

  it('should use config :: to replace all found values in string', () => {
    const config = [
      {
        searchFor: '::',
        replaceWith: ':-:'
      }
    ]

    const string = '{"exec": ["[GET]::/ - Status code is 2xx"]}'
    const result = writeRawReplacements(string, config)
    expect(result).toStrictEqual('{"exec": ["[GET]:-:/ - Status code is 2xx"]}')
  })

  it('should use config :: to replace all found values in escaped string', () => {
    const config = [
      {
        searchFor: '::',
        replaceWith: ':-:'
      }
    ]

    const string = '{"exec": ["// Validate status 2xx \npm.test("[GET]::/portal/"]}'
    const result = writeRawReplacements(string, config)
    console.log('result', result)
    expect(result).toStrictEqual('{"exec": ["// Validate status 2xx \npm.test("[GET]:-:/portal/"]}')
  })
})
