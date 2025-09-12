import { getPostmanCollection } from '../../../__tests__/testUtils/getPostmanCollection'
import { writeCollectionVariables } from '../../application'

describe('writeCollectionVariables', () => {
  it('should inject the configured variables on collection', () => {
    const collection = getPostmanCollection().toJSON()
    const dictionary = {
      bar: 'buzz',
      bizz: 'foo',
      'Bearer <token>': '{{bearerToken}}'
    } as Record<string, unknown>

    const result = writeCollectionVariables(collection, dictionary)
    expect(result?.variable).toMatchSnapshot()
  })

  it('should inject the configured variables on collection, and overwrite existing', () => {
    const collection = getPostmanCollection().toJSON()

    const dictionary = {
      bar: 'buzz',
      bizz: 'foo',
      baseUrl: 'https://api.com'
    } as Record<string, unknown>

    const result = writeCollectionVariables(collection, dictionary)
    expect(result?.variable).toMatchSnapshot()
  })

  it('should handle empty dictionary', () => {
    const collection = getPostmanCollection().toJSON()
    const dictionary = {} as Record<string, unknown>

    const result = writeCollectionVariables(collection, dictionary)
    expect(result?.variable).toEqual(collection.variable)
  })

  it('should handle empty variables in the collection', () => {
    const collection = getPostmanCollection().toJSON()
    collection.variable = undefined

    const dictionary = {
      bar: 'buzz',
      bizz: 'foo'
    } as Record<string, unknown>

    const result = writeCollectionVariables(collection, dictionary)
    expect(result?.variable).toMatchSnapshot()
  })

  it('should handle unique variables in the collection', () => {
    const collection = getPostmanCollection().toJSON()
    const dictionary = {
      bar: 'buzz',
      bizz: 'foo'
    } as Record<string, unknown>

    // Adding duplicate variables to the collection
    collection.variable = [
      { key: 'bar', value: 'duplicateValue', type: 'string' },
      { key: 'bizz', value: 'duplicateValue', type: 'string' }
    ]

    const result = writeCollectionVariables(collection, dictionary)
    // Expecting that duplicates are removed
    expect(result?.variable).toHaveLength(2)
  })
})
