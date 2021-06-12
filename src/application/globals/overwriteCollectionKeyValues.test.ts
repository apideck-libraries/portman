import { CollectionDefinition } from 'postman-collection'
import { getPostmanCollection } from '../../../__tests__/testUtils/getPostmanCollection'
import { overwriteCollectionKeyValues } from '../../application'

const dictionary = {
  'x-apideck-consumer-id': '{{consumerId}}',
  foo: '{{foo}}'
} as Record<string, unknown>

describe('overwriteCollectionKeyValues()', () => {
  it('should replace value when key is top level', () => {
    const collection = getPostmanCollection()
    const postmanJson = collection.toJSON()

    const result = overwriteCollectionKeyValues(postmanJson, dictionary)
    expect(result).toMatchSnapshot()
  })

  it('should replace value when key is found in array', () => {
    const obj = { nested: [{ key: 'foo', value: 'biz' }] } as CollectionDefinition

    expect(overwriteCollectionKeyValues(obj, dictionary)).toStrictEqual({
      nested: [{ key: 'foo', value: '{{foo}}' }]
    })
  })

  it('should replace value when key is found deep in array', () => {
    const obj = {
      nested: [{ deep: [{ down: { key: 'foo', value: 'biz' } }] }]
    } as CollectionDefinition

    expect(overwriteCollectionKeyValues(obj, dictionary)).toStrictEqual({
      nested: [{ deep: [{ down: { key: 'foo', value: '{{foo}}' } }] }]
    })
  })
})
