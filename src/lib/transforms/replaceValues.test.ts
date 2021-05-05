import { CollectionDefinition } from 'postman-collection'
import { replaceValues } from './replaceValues'

describe('replaceValues()', () => {
  const targets = ['bar', 'bizz']
  const value = 'buzz'

  it('should return unaltered when not found', () => {
    const obj = {
      foo: 1234
    } as CollectionDefinition

    const replaced = replaceValues(targets, value, obj)
    expect(replaced).toStrictEqual({
      foo: 1234
    })
  })

  it(`replaces value when found top level`, () => {
    const obj = {
      foo: 'bar'
    } as CollectionDefinition

    const replaced = replaceValues(targets, value, obj)
    expect(replaced).toStrictEqual({
      foo: 'buzz'
    })
  })

  it(`replaces value when nested`, () => {
    const obj = {
      foo: { bar: 'bizz' }
    } as CollectionDefinition

    const replaced = replaceValues(targets, value, obj)
    expect(replaced).toStrictEqual({
      foo: { bar: 'buzz' }
    })
  })

  it(`replaces value when deeply nested`, () => {
    const obj = {
      foo: { deep: [{ bar: 'bizz' }] }
    } as CollectionDefinition

    const replaced = replaceValues(targets, value, obj)
    expect(replaced).toStrictEqual({
      foo: { deep: [{ bar: 'buzz' }] }
    })
  })

  it(`replaces value when found in array`, () => {
    const obj = {
      foo: [{ id: 'bar' }]
    } as CollectionDefinition

    const replaced = replaceValues(targets, value, obj)
    expect(replaced).toStrictEqual({
      foo: [{ id: 'buzz' }]
    })
  })
})
