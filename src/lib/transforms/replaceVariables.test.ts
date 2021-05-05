import { CollectionDefinition } from 'postman-collection'
import { replaceVariables } from './replaceVariables'

const dictionary = {
  foo: '{{foo}}'
} as Record<string, unknown>

describe('replaceVariables()', () => {
  it('should return unaltered when object does not have key', () => {
    const obj = { bar: 'baz' } as CollectionDefinition

    expect(replaceVariables(obj, dictionary)).toStrictEqual(obj)
  })

  it('should return unaltered when dictionary is invalid', () => {
    const obj = { bar: 'baz' } as CollectionDefinition

    expect(replaceVariables(obj, {})).toStrictEqual(obj)
  })

  it('should replace value when key is top level', () => {
    const obj = { key: 'foo', value: 'biz' } as CollectionDefinition

    expect(replaceVariables(obj, dictionary)).toStrictEqual({ key: 'foo', value: '{{foo}}' })
  })

  it('should replace value when key is found in array', () => {
    const obj = { nested: [{ key: 'foo', value: 'biz' }] } as CollectionDefinition

    expect(replaceVariables(obj, dictionary)).toStrictEqual({
      nested: [{ key: 'foo', value: '{{foo}}' }]
    })
  })

  it('should replace value when key is found deep in array', () => {
    const obj = {
      nested: [{ deep: [{ down: { key: 'foo', value: 'biz' } }] }]
    } as CollectionDefinition

    expect(replaceVariables(obj, dictionary)).toStrictEqual({
      nested: [{ deep: [{ down: { key: 'foo', value: '{{foo}}' } }] }]
    })
  })
})
