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

  it('should use config with space to replace all found values in string', () => {
    const config = [
      {
        searchFor: 'foo bar',
        replaceWith: 'bars lorem'
      }
    ]

    const string = '{"root": "foo", "nested": {"foo bar": "monkey"}, "arr": ["monkey", "foo"]}'
    const result = writeRawReplacements(string, config)
    expect(result).toStrictEqual(
      '{"root": "foo", "nested": {"bars lorem": "monkey"}, "arr": ["monkey", "foo"]}'
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

  it('should use config ?. to replace all found values in string', () => {
    const config = [
      {
        searchFor: '?.',
        replaceWith: '.'
      }
    ]

    const string = 'Set post-data.id as variable for jsonData.id\nif (jsonData?.id) {\n'
    const result = writeRawReplacements(string, config)
    expect(result).toStrictEqual(
      'Set post-data.id as variable for jsonData.id\nif (jsonData.id) {\n'
    )
  })

  it('should use config ?.[0] to replace all found values in string', () => {
    const config = [
      {
        searchFor: '?.[',
        replaceWith: '['
      }
    ]

    const string = 'Set post-data.id as variable for jsonData.id\nif (jsonData?.[0].id) {\n'
    const result = writeRawReplacements(string, config)
    expect(result).toStrictEqual(
      'Set post-data.id as variable for jsonData.id\nif (jsonData[0].id) {\n'
    )
  })

  it('should use multiple configs to replace all found values in string', () => {
    const config = [
      {
        searchFor: '?.[',
        replaceWith: '['
      },
      {
        searchFor: '?.',
        replaceWith: '.'
      }
    ]

    const string = 'Set post-data.id as variable for jsonData.id\nif (jsonData?.[0]?.id) {\n'
    const result = writeRawReplacements(string, config)
    expect(result).toStrictEqual(
      'Set post-data.id as variable for jsonData.id\nif (jsonData[0].id) {\n'
    )
  })

  it('should use config ?.[]*(){} to replace all found values in string', () => {
    const config = [
      {
        searchFor: '?.[]*(){}',
        replaceWith: 'ABCDE'
      }
    ]

    const string = 'Set post-data.id as variable for ?.[]*(){} {\n'
    const result = writeRawReplacements(string, config)
    expect(result).toStrictEqual('Set post-data.id as variable for ABCDE {\n')
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

it('should remove found values in escaped string for schema validation if replaced with empty string', () => {
  const config = [
    {
      searchFor: '"format":"date",',
      replaceWith: ''
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
            '// Response Validation\nconst schema = {\"title\":\"User\",\"type\":\"object\",\"description\":\"\",\"examples\":[{\"id\":142,\"firstName\":\"Alice\",\"dateOfBirth\":\"1997-10-31\",\"signUpDate\":\"2019-08-24\"}],\"properties\":{\"id\":{\"type\":\"integer\"},\"firstName\":{\"type\":\"string\"},\"dateOfBirth\":{\"type\":\"string\",\"format\":\"date\",\"example\":\"1997-10-31\"},\"signUpDate\":{\"type\":\"string\",\"format\":\"date\",\"description\":\"The date that the user was created.\"}},\"required\":[\"id\",\"firstName\"]}\n\n// Validate if response matches JSON schema \npm.test(\"[POST]::/user - Schema is valid\", function() {\n    pm.response.to.have.jsonSchema(schema,{unknownFormats: [\"int32\", \"int64\", \"float\", \"double\"]});\n});\n'
          ]
        }
      }
    ]
  }
  const string = JSON.stringify(obj, null, 2)
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
            '// Response Validation\nconst schema = {\"title\":\"User\",\"type\":\"object\",\"description\":\"\",\"examples\":[{\"id\":142,\"firstName\":\"Alice\",\"dateOfBirth\":\"1997-10-31\",\"signUpDate\":\"2019-08-24\"}],\"properties\":{\"id\":{\"type\":\"integer\"},\"firstName\":{\"type\":\"string\"},\"dateOfBirth\":{\"type\":\"string\",\"example\":\"1997-10-31\"},\"signUpDate\":{\"type\":\"string\",\"description\":\"The date that the user was created.\"}},\"required\":[\"id\",\"firstName\"]}\n\n// Validate if response matches JSON schema \npm.test(\"[POST]::/user - Schema is valid\", function() {\n    pm.response.to.have.jsonSchema(schema,{unknownFormats: [\"int32\", \"int64\", \"float\", \"double\"]});\n});\n'
          ]
        }
      }
    ]
  })
})

it('should replace found values in escaped string for schema validation with correctly escaped strings', () => {
  const config = [
    {
      searchFor: '"format":"date"',
      replaceWith: '"format":"specialDate"'
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
            '// Response Validation\nconst schema = {\"title\":\"User\",\"type\":\"object\",\"description\":\"\",\"examples\":[{\"id\":142,\"firstName\":\"Alice\",\"dateOfBirth\":\"1997-10-31\",\"signUpDate\":\"2019-08-24\"}],\"properties\":{\"id\":{\"type\":\"integer\"},\"firstName\":{\"type\":\"string\"},\"dateOfBirth\":{\"type\":\"string\",\"format\":\"date\",\"example\":\"1997-10-31\"},\"signUpDate\":{\"type\":\"string\",\"format\":\"date\",\"description\":\"The date that the user was created.\"}},\"required\":[\"id\",\"firstName\"]}\n\n// Validate if response matches JSON schema \npm.test(\"[POST]::/user - Schema is valid\", function() {\n    pm.response.to.have.jsonSchema(schema,{unknownFormats: [\"int32\", \"int64\", \"float\", \"double\"]});\n});\n'
          ]
        }
      }
    ]
  }
  const string = JSON.stringify(obj, null, 2)
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
            '// Response Validation\nconst schema = {\"title\":\"User\",\"type\":\"object\",\"description\":\"\",\"examples\":[{\"id\":142,\"firstName\":\"Alice\",\"dateOfBirth\":\"1997-10-31\",\"signUpDate\":\"2019-08-24\"}],\"properties\":{\"id\":{\"type\":\"integer\"},\"firstName\":{\"type\":\"string\"},\"dateOfBirth\":{\"type\":\"string\",\"format\":\"specialDate\",\"example\":\"1997-10-31\"},\"signUpDate\":{\"type\":\"string\",\"format\":\"specialDate\",\"description\":\"The date that the user was created.\"}},\"required\":[\"id\",\"firstName\"]}\n\n// Validate if response matches JSON schema \npm.test(\"[POST]::/user - Schema is valid\", function() {\n    pm.response.to.have.jsonSchema(schema,{unknownFormats: [\"int32\", \"int64\", \"float\", \"double\"]});\n});\n'
          ]
        }
      }
    ]
  })
})
