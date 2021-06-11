import { overwriteCollectionValues } from 'application'
import { CollectionDefinition } from 'postman-collection'
import { getPostmanCollection } from 'testUtils/getPostmanCollection'

const dictionary = {
  bar: 'buzz',
  bizz: 'buzz',
  'Bearer <token>': '{{bearerToken}}'
} as Record<string, unknown>

describe('overwriteCollectionValues()', () => {
  it('should return unaltered when not found', () => {
    const collection = {
      foo: 1234
    } as CollectionDefinition

    const replaced = overwriteCollectionValues(collection, dictionary)
    expect(replaced).toStrictEqual({
      foo: 1234
    })
  })

  it('should replace value when key is top level', () => {
    const collection = getPostmanCollection().toJSON()
    const result = overwriteCollectionValues(collection, dictionary)
    expect(result).toMatchSnapshot()
  })

  it(`replaces value when nested`, () => {
    const collection = {
      foo: { bar: 'bizz' }
    } as CollectionDefinition

    const replaced = overwriteCollectionValues(collection, dictionary)
    expect(replaced).toStrictEqual({
      foo: { bar: 'buzz' }
    })
  })

  it(`replaces value when deeply nested`, () => {
    const collection = {
      foo: { deep: [{ bar: 'bizz' }] }
    } as CollectionDefinition

    const replaced = overwriteCollectionValues(collection, dictionary)
    expect(replaced).toStrictEqual({
      foo: { deep: [{ bar: 'buzz' }] }
    })
  })

  it(`replaces value when found in array`, () => {
    const collection = {
      foo: [{ id: 'bar' }]
    } as CollectionDefinition

    const replaced = overwriteCollectionValues(collection, dictionary)
    expect(replaced).toStrictEqual({
      foo: [{ id: 'buzz' }]
    })
  })
})
