import { overrideRequestBodies } from './overrideRequestBodies'

describe('overrideRequestBodies()', () => {
  const createBody = { foo: 'bar', baz: '{{buzz}}' }
  const updateBody = { foo: 'bar', baz: 'buzz' }

  it('should replace UPDATE requestBody with one from CREATE', () => {
    const obj = {
      item: [
        {
          name: 'RequestFolder',
          item: [
            {
              request: {
                method: 'POST',
                body: createBody
              }
            },
            {
              request: {
                method: 'PATCH',
                body: updateBody
              }
            }
          ]
        }
      ]
    }

    const transform = overrideRequestBodies(obj)
    expect(transform).toMatchSnapshot()
  })

  it('should return unaltered if there is no update method', () => {
    const obj = {
      item: [
        {
          name: 'RequestFolder',
          item: [
            {
              request: {
                method: 'POST',
                body: createBody
              }
            }
          ]
        }
      ]
    }

    const transform = overrideRequestBodies(obj)
    expect(transform).toMatchSnapshot()
  })
})
