import { OpenAPIV3 } from 'openapi-types'
import { getOasMappedOperation } from '../../../__tests__/testUtils/getOasMappedOperation'
import { getPostmanMappedOperation } from '../../../__tests__/testUtils/getPostmanMappedOperation'
import { testResponseJsonSchema } from '../../application'
import { OasMappedOperation } from '../../oas'
import { PostmanMappedOperation } from '../../postman'
import { ContractTestConfig } from '../../types'

describe('testResponseJsonSchema', () => {
  let oasOperation: OasMappedOperation
  let pmOperation: PostmanMappedOperation

  beforeEach(async () => {
    oasOperation = await getOasMappedOperation()
    pmOperation = await getPostmanMappedOperation()
  })

  it('should add test for valid json schema', async () => {
    const schema = (oasOperation.schema?.responses?.['200'] as OpenAPIV3.ResponseObject)?.content
    pmOperation = testResponseJsonSchema(
      { enabled: true } as ContractTestConfig,
      schema,
      pmOperation,
      oasOperation
    )
    const pmTest = pmOperation.getTests()
    expect(pmTest.script.exec).toMatchSnapshot()
  })

  it('should skip test for invalid json schema', async () => {
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
  it('should remove minItems on items levels, for valid json schema', async () => {
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

  it('should remove minItems on items levels, for types array/null, for valid json schema', async () => {
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

  it('should remove maxItems on items levels, for valid json schema', async () => {
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

  it('should remove maxItems on items levels, for types array/null, for valid json schema', async () => {
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

  it('should remove minItems on nested levels, for type array, for valid json schema', async () => {
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

  it('should remove minItems on nested levels, for types array/null, for valid json schema', async () => {
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

  it('should remove maxItems on nested levels, for type array, for valid json schema', async () => {
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

  it('should remove maxItems on nested levels, for types array/null, for valid json schema', async () => {
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
      { additionalProperties: false } as ContractTestConfig,
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
      { additionalProperties: true } as ContractTestConfig,
      schema,
      pmOperation,
      oasOperation
    )
    const pmTest = pmOperation.getTests()
    expect(pmTest.script.exec).toMatchSnapshot()
  })
})
