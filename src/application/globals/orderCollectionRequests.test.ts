import { orderCollectionRequests } from '../../application'

describe('orderCollectionRequests()', () => {
  it('should order the postman request items in folder in the order like defined', () => {
    const order = [
      'POST::/crm/{id}',
      'POST::/crm/monkies/{id}',
      'GET::/crm/{crmId}/monkies/{id}',
      'GET::/crm/monkies/{id}'
    ]
    const obj = {
      item: [
        {
          name: 'Monkeys',
          item: [
            {
              request: {
                url: {
                  path: ['crm', 'monkies', ':id'],
                  variable: [
                    {
                      disabled: false,
                      type: 'any',
                      value: '<string>',
                      key: 'id',
                      description: '(Required) ID of the monkey you are acting upon.'
                    }
                  ]
                },
                method: 'GET'
              }
            },
            {
              request: {
                url: {
                  path: ['crm', ':crmId', 'monkies', ':id'],
                  variable: [
                    {
                      disabled: false,
                      type: 'any',
                      value: '<string>',
                      key: 'crmId',
                      description: '(Required) ID of the crm you are acting upon.'
                    },
                    {
                      disabled: false,
                      type: 'any',
                      value: '<string>',
                      key: 'id',
                      description: '(Required) ID of the monkey you are acting upon.'
                    }
                  ]
                },
                method: 'GET'
              }
            },
            {
              request: {
                url: {
                  path: ['crm', 'monkies', ':id'],
                  variable: [
                    {
                      disabled: false,
                      type: 'any',
                      value: '<string>',
                      key: 'id',
                      description: '(Required) ID of the monkey you are acting upon.'
                    }
                  ]
                },
                method: 'POST'
              }
            },
            {
              request: {
                url: {
                  path: ['crm', ':id'],
                  variable: [
                    {
                      disabled: false,
                      type: 'any',
                      value: '<string>',
                      key: 'id',
                      description: '(Required) ID of the monkey you are acting upon.'
                    }
                  ]
                },
                method: 'GET'
              }
            },
            {
              request: {
                url: {
                  path: ['crm', ':id'],
                  variable: [
                    {
                      disabled: false,
                      type: 'any',
                      value: '<string>',
                      key: 'id',
                      description: '(Required) ID of the monkey you are acting upon.'
                    }
                  ]
                },
                method: 'POST'
              }
            }
          ]
        }
      ]
    }

    const transform = orderCollectionRequests(obj, order)
    expect(transform).toMatchSnapshot()
  })
  it('should order the postman request items in root in the order like defined', () => {
    const order = [
      'POST::/crm/{id}',
      'POST::/crm/monkies/{id}',
      'GET::/crm/{crmId}/monkies/{id}',
      'POST::/crm/{id}/status',
      'GET::/crm/monkies/{id}'
    ]
    const obj = {
      item: [
        {
          request: {
            url: {
              path: ['crm', 'monkies', ':id'],
              variable: [
                {
                  disabled: false,
                  type: 'any',
                  value: '<string>',
                  key: 'id',
                  description: '(Required) ID of the monkey you are acting upon.'
                }
              ]
            },
            method: 'GET'
          }
        },
        {
          request: {
            url: {
              path: ['crm', ':id', 'status'],
              variable: [
                {
                  disabled: false,
                  type: 'any',
                  value: '<string>',
                  key: 'id',
                  description: '(Required) ID of the monkey you are acting upon.'
                }
              ]
            },
            method: 'POST'
          }
        },
        {
          request: {
            url: {
              path: ['crm', ':crmId', 'monkies', ':id'],
              variable: [
                {
                  disabled: false,
                  type: 'any',
                  value: '<string>',
                  key: 'crmId',
                  description: '(Required) ID of the crm you are acting upon.'
                },
                {
                  disabled: false,
                  type: 'any',
                  value: '<string>',
                  key: 'id',
                  description: '(Required) ID of the monkey you are acting upon.'
                }
              ]
            },
            method: 'GET'
          }
        },
        {
          request: {
            url: {
              path: ['crm', 'monkies', ':id'],
              variable: [
                {
                  disabled: false,
                  type: 'any',
                  value: '<string>',
                  key: 'id',
                  description: '(Required) ID of the monkey you are acting upon.'
                }
              ]
            },
            method: 'POST'
          }
        },
        {
          request: {
            url: {
              path: ['crm', ':id'],
              variable: [
                {
                  disabled: false,
                  type: 'any',
                  value: '<string>',
                  key: 'id',
                  description: '(Required) ID of the monkey you are acting upon.'
                }
              ]
            },
            method: 'GET'
          }
        },
        {
          request: {
            url: {
              path: ['crm', ':id'],
              variable: [
                {
                  disabled: false,
                  type: 'any',
                  value: '<string>',
                  key: 'id',
                  description: '(Required) ID of the monkey you are acting upon.'
                }
              ]
            },
            method: 'POST'
          }
        }
      ]
    }

    const transform = orderCollectionRequests(obj, order)
    expect(transform).toMatchSnapshot()
  })

  it('should not order the postman request items ', () => {
    const order = []
    const obj = {
      item: [
        {
          name: 'Monkeys',
          item: [
            {
              request: {
                url: {
                  path: ['crm', 'monkies', ':id'],
                  variable: [
                    {
                      disabled: false,
                      type: 'any',
                      value: '<string>',
                      key: 'id',
                      description: '(Required) ID of the monkey you are acting upon.'
                    }
                  ]
                },
                method: 'GET'
              }
            },
            {
              request: {
                url: {
                  path: ['crm', 'monkies', ':id'],
                  variable: [
                    {
                      disabled: false,
                      type: 'any',
                      value: '<string>',
                      key: 'id',
                      description: '(Required) ID of the monkey you are acting upon.'
                    }
                  ]
                },
                method: 'POST'
              }
            },
            {
              request: {
                url: {
                  path: ['crm', ':id'],
                  variable: [
                    {
                      disabled: false,
                      type: 'any',
                      value: '<string>',
                      key: 'id',
                      description: '(Required) ID of the monkey you are acting upon.'
                    }
                  ]
                },
                method: 'GET'
              }
            },
            {
              request: {
                url: {
                  path: ['crm', ':id'],
                  variable: [
                    {
                      disabled: false,
                      type: 'any',
                      value: '<string>',
                      key: 'id',
                      description: '(Required) ID of the monkey you are acting upon.'
                    }
                  ]
                },
                method: 'POST'
              }
            }
          ]
        }
      ]
    }

    const transform = orderCollectionRequests(obj, order)
    expect(transform).toMatchSnapshot()
  })
  it('should order the postman request items in the wildcard order', () => {
    const order = ['POST::/*', 'GET::/*', 'PUT::/*']
    const obj = {
      item: [
        {
          name: 'Monkeys',
          item: [
            {
              request: {
                url: {
                  path: ['crm', 'monkies', ':id'],
                  variable: [
                    {
                      disabled: false,
                      type: 'any',
                      value: '<string>',
                      key: 'id',
                      description: '(Required) ID of the monkey you are acting upon.'
                    }
                  ]
                },
                method: 'GET'
              }
            },
            {
              request: {
                url: {
                  path: ['crm', ':crmId', 'monkies', ':id'],
                  variable: [
                    {
                      disabled: false,
                      type: 'any',
                      value: '<string>',
                      key: 'crmId',
                      description: '(Required) ID of the crm you are acting upon.'
                    },
                    {
                      disabled: false,
                      type: 'any',
                      value: '<string>',
                      key: 'id',
                      description: '(Required) ID of the monkey you are acting upon.'
                    }
                  ]
                },
                method: 'GET'
              }
            },
            {
              request: {
                url: {
                  path: ['crm', 'monkies', ':id'],
                  variable: [
                    {
                      disabled: false,
                      type: 'any',
                      value: '<string>',
                      key: 'id',
                      description: '(Required) ID of the monkey you are acting upon.'
                    }
                  ]
                },
                method: 'POST'
              }
            },
            {
              request: {
                url: {
                  path: ['crm', ':id'],
                  variable: [
                    {
                      disabled: false,
                      type: 'any',
                      value: '<string>',
                      key: 'id',
                      description: '(Required) ID of the monkey you are acting upon.'
                    }
                  ]
                },
                method: 'GET'
              }
            },
            {
              request: {
                url: {
                  path: ['crm', ':id'],
                  variable: [
                    {
                      disabled: false,
                      type: 'any',
                      value: '<string>',
                      key: 'id',
                      description: '(Required) ID of the monkey you are acting upon.'
                    }
                  ]
                },
                method: 'POST'
              }
            },
            {
              request: {
                url: {
                  path: ['crm', ':id'],
                  variable: [
                    {
                      disabled: false,
                      type: 'any',
                      value: '<string>',
                      key: 'id',
                      description: '(Required) ID of the monkey you are acting upon.'
                    }
                  ]
                },
                method: 'PUT'
              }
            }
          ]
        }
      ]
    }

    const transform = orderCollectionRequests(obj, order)
    expect(transform).toMatchSnapshot()
  })
})
