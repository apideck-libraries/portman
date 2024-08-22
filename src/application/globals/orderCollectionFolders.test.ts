import { orderCollectionFolders } from '../../application'

describe('orderCollectionFolders()', () => {
  it('should order the postman request items in folder in the order like defined', () => {
    const order = ['Folder D', 'Folder B']
    const obj = {
      info: {
        name: 'Test Collection',
        schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json'
      },
      item: [
        {
          name: 'Folder A',
          item: [
            {
              name: 'Request A1',
              request: {
                url: 'https://example.com',
                method: 'GET'
              }
            }
          ]
        },
        {
          name: 'Folder B',
          item: [
            {
              name: 'Request B1',
              request: {
                url: 'https://example.com',
                method: 'POST'
              }
            }
          ]
        },
        {
          name: 'Folder C',
          item: [
            {
              name: 'Request C1',
              request: {
                url: 'https://example.com',
                method: 'PUT'
              }
            }
          ]
        },
        {
          name: 'Folder D',
          item: [
            {
              name: 'Request D1',
              request: {
                url: 'https://example.com',
                method: 'DELETE'
              }
            }
          ]
        },
        {
          name: 'Root Request',
          request: {
            url: 'https://example.com/root',
            method: 'HEAD'
          }
        }
      ]
    }

    const transform = orderCollectionFolders(obj, order)
    expect(transform.item[0].name).toBe('Folder D') // First in the desired order
    expect(transform.item[1].name).toBe('Folder B') // Second in the desired order
    expect(transform.item[2].name).toBe('Folder A') // Original position, not reordered
    expect(transform.item[3].name).toBe('Folder C') // Original position, not reordered
    expect(transform.item[4].name).toBe('Root Request')
  })
})
