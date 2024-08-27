import { OpenAPIV3 } from 'openapi-types'
import { getOasMappedOperation } from '../../../__tests__/testUtils/getOasMappedOperation'
import { getPostmanMappedOperation } from '../../../__tests__/testUtils/getPostmanMappedOperation'
import { convertUnsupportedJsonSchemaProperties, testResponseJsonSchema } from '../../application'
import { OasMappedOperation } from '../../oas'
import { PostmanMappedOperation } from '../../postman'
import { ContractTestConfig, GlobalConfig } from '../../types'

describe('testResponseJsonSchema', () => {
  let oasOperation: OasMappedOperation
  let pmOperation: PostmanMappedOperation

  beforeEach(async () => {
    oasOperation = await getOasMappedOperation()
    pmOperation = await getPostmanMappedOperation()
  })

  it('should add test for valid json schema', async () => {
    const response = (oasOperation.schema?.responses?.['200'] as OpenAPIV3.ResponseObject)?.content
    const schema = response?.['application/json'].schema
    pmOperation = testResponseJsonSchema(
      { enabled: true } as ContractTestConfig,
      schema,
      pmOperation,
      oasOperation
    )
    const pmTest = pmOperation.getTests()
    expect(pmTest.script.exec).toMatchSnapshot()
  })

  it('should add test with separator symbol for valid json schema', async () => {
    const globalConfig = { separatorSymbol: '==' } as GlobalConfig
    const schema = (oasOperation.schema?.responses?.['200'] as OpenAPIV3.ResponseObject)?.content
    pmOperation = testResponseJsonSchema(
      { enabled: true } as ContractTestConfig,
      schema,
      pmOperation,
      oasOperation,
      [],
      globalConfig
    )
    const pmTest = pmOperation.getTests()
    expect(pmTest.script.exec).toMatchSnapshot()
  })

  it('should skip test for json schema with $ref', async () => {
    const schema = {
      type: 'object',
      properties: {
        foo: {
          $ref: '#/components/schemas/Foo'
        }
      }
    }

    pmOperation = testResponseJsonSchema(
      {} as ContractTestConfig,
      schema,
      pmOperation,
      oasOperation
    )
    const pmTest = pmOperation.getTests()
    expect(pmTest.script.exec).toMatchSnapshot()
  })

  it('should skip test for invalid json schema', async () => {
    const schema = {
      type: 'array',
      maxItems: 100,
      items: {
        typess: ['object', 'null'],
        required: ['id', 'name'],
        properties: {
          id: { type: 'integer', format: 'int64' },
          name: { type: 'string' },
          tag: { type: 'string' }
        },
        type: [null, 'null']
      }
    }

    pmOperation = testResponseJsonSchema(
      {} as ContractTestConfig,
      schema,
      pmOperation,
      oasOperation
    )
    const pmTest = pmOperation.getTests()
    expect(pmTest.script.exec).toMatchSnapshot()
  })

  it('should add extra unknown formats', async () => {
    const schema = (oasOperation.schema?.responses?.['200'] as OpenAPIV3.ResponseObject)?.content
    pmOperation = testResponseJsonSchema(
      {} as ContractTestConfig,
      schema,
      pmOperation,
      oasOperation,
      ['abc', 'xyz']
    )
    const pmTest = pmOperation.getTests()
    expect(pmTest.script.exec).toMatchSnapshot()
  })

  it.skip('should remove minItems on items levels, for valid json schema', async () => {
    const schema = {
      type: 'array',
      items: {
        required: ['name'],
        properties: {
          id: {
            type: 'integer',
            example: 10
          },
          name: {
            type: 'string',
            example: 'doggie'
          },
          status: {
            type: 'string',
            description: 'pet status in the store',
            enum: ['available']
          }
        },
        type: 'object'
      },
      minItems: 2
    }
    pmOperation = testResponseJsonSchema(
      {} as ContractTestConfig,
      schema,
      pmOperation,
      oasOperation
    )
    const pmTest = pmOperation.getTests()
    expect(pmTest.script.exec).toMatchSnapshot()
  })

  it.skip('should remove minItems on items levels, for types array/null, for valid json schema', async () => {
    const schema = {
      type: ['array', 'null'],
      items: {
        required: ['name'],
        properties: {
          id: {
            type: 'integer',
            example: 10
          },
          name: {
            type: 'string',
            example: 'doggie'
          },
          status: {
            type: 'string',
            description: 'pet status in the store',
            enum: ['available']
          }
        },
        type: 'object'
      },
      minItems: 2
    }
    pmOperation = testResponseJsonSchema(
      {} as ContractTestConfig,
      schema,
      pmOperation,
      oasOperation
    )
    const pmTest = pmOperation.getTests()
    expect(pmTest.script.exec).toMatchSnapshot()
  })

  it.skip('should remove maxItems on items levels, for valid json schema', async () => {
    const schema = {
      type: 'array',
      items: {
        required: ['name'],
        properties: {
          id: {
            type: 'integer',
            example: 10
          },
          name: {
            type: 'string',
            example: 'doggie'
          },
          status: {
            type: 'string',
            description: 'pet status in the store',
            enum: ['available']
          }
        },
        type: 'object'
      },
      maxItems: 2
    }
    pmOperation = testResponseJsonSchema(
      {} as ContractTestConfig,
      schema,
      pmOperation,
      oasOperation
    )
    const pmTest = pmOperation.getTests()
    expect(pmTest.script.exec).toMatchSnapshot()
  })

  it.skip('should remove maxItems on items levels, for types array/null, for valid json schema', async () => {
    const schema = {
      type: ['array', 'null'],
      items: {
        required: ['name'],
        properties: {
          id: {
            type: 'integer',
            example: 10
          },
          name: {
            type: 'string',
            example: 'doggie'
          },
          status: {
            type: 'string',
            description: 'pet status in the store',
            enum: ['available']
          }
        },
        type: 'object'
      },
      maxItems: 2
    }
    pmOperation = testResponseJsonSchema(
      {} as ContractTestConfig,
      schema,
      pmOperation,
      oasOperation
    )
    const pmTest = pmOperation.getTests()
    expect(pmTest.script.exec).toMatchSnapshot()
  })

  it.skip('should remove minItems on nested levels, for type array, for valid json schema', async () => {
    const schema = {
      type: 'object',
      properties: {
        value: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: {
                type: 'string',
                example: 'p1'
              },
              name: {
                type: 'string',
                example: 'G-1'
              },
              ips: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    portMapping: {
                      type: 'integer',
                      example: 255
                    },
                    pool: {
                      type: 'string',
                      example: 'G-1'
                    }
                  },
                  additionalProperties: false
                },
                minItems: 2
              }
            },
            additionalProperties: false,
            required: ['id', 'name']
          }
        }
      }
    }
    pmOperation = testResponseJsonSchema(
      {} as ContractTestConfig,
      schema,
      pmOperation,
      oasOperation
    )
    const pmTest = pmOperation.getTests()
    expect(pmTest.script.exec).toMatchSnapshot()
  })

  it.skip('should remove minItems on nested levels, for types array/null, for valid json schema', async () => {
    const schema = {
      type: 'object',
      properties: {
        value: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: {
                type: 'string',
                example: 'p1'
              },
              name: {
                type: 'string',
                example: 'G-1'
              },
              ips: {
                type: ['array', 'null'],
                items: {
                  type: 'object',
                  properties: {
                    portMapping: {
                      type: 'integer',
                      example: 255
                    },
                    pool: {
                      type: 'string',
                      example: 'G-1'
                    }
                  },
                  additionalProperties: false
                },
                minItems: 2
              }
            },
            additionalProperties: false,
            required: ['id', 'name']
          }
        }
      }
    }
    pmOperation = testResponseJsonSchema(
      {} as ContractTestConfig,
      schema,
      pmOperation,
      oasOperation
    )
    const pmTest = pmOperation.getTests()
    expect(pmTest.script.exec).toMatchSnapshot()
  })

  it.skip('should remove maxItems on nested levels, for type array, for valid json schema', async () => {
    const schema = {
      type: 'object',
      properties: {
        value: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: {
                type: 'string',
                example: 'p1'
              },
              name: {
                type: 'string',
                example: 'G-1'
              },
              ips: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    portMapping: {
                      type: 'integer',
                      example: 255
                    },
                    pool: {
                      type: 'string',
                      example: 'G-1'
                    }
                  },
                  additionalProperties: false
                },
                maxItems: 2
              }
            },
            additionalProperties: false,
            required: ['id', 'name']
          }
        }
      }
    }
    pmOperation = testResponseJsonSchema(
      {} as ContractTestConfig,
      schema,
      pmOperation,
      oasOperation
    )
    const pmTest = pmOperation.getTests()
    expect(pmTest.script.exec).toMatchSnapshot()
  })

  it.skip('should remove maxItems on nested levels, for types array/null, for valid json schema', async () => {
    const schema = {
      type: 'object',
      properties: {
        value: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: {
                type: 'string',
                example: 'p1'
              },
              name: {
                type: 'string',
                example: 'G-1'
              },
              ips: {
                type: ['array', 'null'],
                items: {
                  type: 'object',
                  properties: {
                    portMapping: {
                      type: 'integer',
                      example: 255
                    },
                    pool: {
                      type: 'string',
                      example: 'G-1'
                    }
                  },
                  additionalProperties: false
                },
                maxItems: 2
              }
            },
            additionalProperties: false,
            required: ['id', 'name']
          }
        }
      }
    }
    pmOperation = testResponseJsonSchema(
      {} as ContractTestConfig,
      schema,
      pmOperation,
      oasOperation
    )
    const pmTest = pmOperation.getTests()
    expect(pmTest.script.exec).toMatchSnapshot()
  })

  it('should toggle additional properties to false on nested levels for valid json schema', async () => {
    const schema = {
      type: 'object',
      properties: {
        value: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: {
                type: 'string',
                example: 'p1'
              },
              name: {
                type: 'string',
                example: 'G-1'
              },
              ips: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    portMapping: {
                      type: 'integer',
                      example: 255
                    },
                    pool: {
                      type: 'string',
                      example: 'G-1'
                    }
                  },
                  additionalProperties: true
                },
                maxItems: 2
              }
            },
            additionalProperties: true,
            required: ['id', 'name']
          }
        }
      }
    }
    pmOperation = testResponseJsonSchema(
      { additionalProperties: false } as unknown as ContractTestConfig,
      schema,
      pmOperation,
      oasOperation
    )
    const pmTest = pmOperation.getTests()
    expect(pmTest.script.exec).toMatchSnapshot()
  })

  it('should toggle additional properties to true on nested levels for valid json schema', async () => {
    const schema = {
      type: 'object',
      properties: {
        value: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: {
                type: 'string',
                example: 'p1'
              },
              name: {
                type: 'string',
                example: 'G-1'
              },
              ips: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    portMapping: {
                      type: 'integer',
                      example: 255
                    },
                    pool: {
                      type: 'string',
                      example: 'G-1'
                    }
                  },
                  additionalProperties: false
                },
                maxItems: 2
              }
            },
            additionalProperties: false,
            required: ['id', 'name']
          }
        }
      }
    }
    pmOperation = testResponseJsonSchema(
      { additionalProperties: true } as unknown as ContractTestConfig,
      schema,
      pmOperation,
      oasOperation
    )
    const pmTest = pmOperation.getTests()
    expect(pmTest.script.exec).toMatchSnapshot()
  })

  it('should convert OpenAPI schema to valid json schema', async () => {
    const schema = {
      type: 'array',
      maxItems: 100,
      minItems: 2,
      items: {
        types: ['object', 'null'],
        nullable: true,
        required: ['id', 'name'],
        properties: {
          id: {
            type: 'integer',
            format: 'int64',
            nullable: true
          },
          name: {
            type: 'string'
          },
          tag: {
            type: 'string',
            example: 'sample-tag'
          },
          description: {
            type: 'string',
            deprecated: true
          },
          metadata: {
            type: 'object',
            properties: {
              createdBy: {
                type: 'string'
              },
              createdAt: {
                type: 'string',
                format: 'date-time'
              }
            },
            discriminator: 'type'
          }
        },
        maxItems: 2,
        minItems: 1
      }
    }

    const result = convertUnsupportedJsonSchemaProperties(schema)
    expect(result).toEqual({
      type: 'array',
      maxItems: 100, // Root level maxItems should be kept
      minItems: 2,
      items: {
        type: ['object', 'null'], // 'types' converted to 'type' and 'nullable' handled correctly
        required: ['id', 'name'],
        properties: {
          id: {
            type: ['integer', 'null'], // Nullable 'id' should have 'null' added to type
            format: 'int64'
          },
          name: {
            type: 'string'
          },
          tag: {
            type: 'string'
            // 'example' should be removed as it's OpenAPI-specific
          },
          description: {
            type: 'string'
            // 'deprecated' should be removed as it's OpenAPI-specific
          },
          metadata: {
            type: 'object',
            properties: {
              createdBy: {
                type: 'string'
              },
              createdAt: {
                type: 'string',
                format: 'date-time'
              }
            }
            // 'discriminator' should be removed as it's OpenAPI-specific
          }
        },
        maxItems: 2,
        minItems: 1
      }
    })
  })
})
