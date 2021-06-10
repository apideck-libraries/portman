import { orderCollectionRequests } from './orderCollectionRequests'

describe('orderCollectionRequests()', () => {
  it('should order the postman request items in the order like defined', () => {
    const order = ['POST::/crm/{id}', 'POST::/crm/monkies/{id}', 'GET::/crm/monkies/{id}']
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
})
