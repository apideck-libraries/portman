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

    const obj = {
      event: [
        {
          listen: 'test',
          script: {
            id: 'b7904efa-d19f-424e-88aa-09829bec8643',
            type: 'text/javascript',
            exec: [
              '// Validate status 2xx \npm.test("[GET]::/portal/v1/tenants/:tenantId/maildomains - Status code is 2xx", function () {\n   pm.response.to.be.success;\n});\n'
            ]
          }
        }
      ]
    }
    const string = JSON.stringify(obj, null, 4)
    const result = writeRawReplacements(string, config)
    const resultObj = JSON.parse(result)
    expect(resultObj).toStrictEqual({
      event: [
        {
          listen: 'test',
          script: {
            id: 'b7904efa-d19f-424e-88aa-09829bec8643',
            type: 'text/javascript',
            exec: [
              '// Validate status 2xx \npm.test("[GET]:-:/portal/v1/tenants/:tenantId/maildomains - Status code is 2xx", function () {\n   pm.response.to.be.success;\n});\n'
            ]
          }
        }
      ]
    })
  })
})
