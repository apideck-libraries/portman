import { detectUnsafeCharacters, renderBracketPath, renderChainPath } from './renderChainPath'

describe('renderChainPath', () => {
  it('should return untouched property', () => {
    const path = 'foo'

    const result = renderChainPath(path)
    expect(result).toEqual('foo')
  })

  it('should return untouched property, legacy mode', () => {
    const path = 'foo'

    const result = renderChainPath(path, true)
    expect(result).toEqual('foo')
  })

  it('should render chained dot notation', () => {
    const path = 'foo.bar'

    const result = renderChainPath(path)
    expect(result).toEqual('foo?.bar')
  })

  it('should render chained dot notation, legacy mode', () => {
    const path = 'foo.bar'

    const result = renderChainPath(path, true)
    expect(result).toEqual('foo && foo.bar')
  })

  it('should render multiple chained dot notation', () => {
    const path = 'foo.bar.marco.polo'

    const result = renderChainPath(path)
    expect(result).toEqual('foo?.bar?.marco?.polo')
  })

  it('should render multiple chained dot notation, legacy mode', () => {
    const path = 'foo.bar.marco.polo'

    const result = renderChainPath(path, true)
    expect(result).toEqual('foo && foo.bar && foo.bar.marco && foo.bar.marco.polo')
  })

  it('should render chained array notation', () => {
    const path = 'foo[0]'

    const result = renderChainPath(path)
    expect(result).toEqual('foo?.[0]')
  })

  it('should render chained array notation, legacy mode', () => {
    const path = 'foo[0]'

    const result = renderChainPath(path, true)
    expect(result).toEqual('foo[0]')
  })

  it('should render multiple chained array notation', () => {
    const path = 'foo[0].bar[1].marco[2].polo[3]'

    const result = renderChainPath(path)
    expect(result).toEqual('foo?.[0]?.bar?.[1]?.marco?.[2]?.polo?.[3]')
  })

  it('should render multiple chained array notation, legacy mode', () => {
    const path = 'foo[0].bar[1].marco[2].polo[3]'

    const result = renderChainPath(path, true)
    expect(result).toEqual(
      'foo[0] && foo[0].bar[1] && foo[0].bar[1].marco[2] && foo[0].bar[1].marco[2].polo[3]'
    )
  })

  it('should render chained array & dot notation', () => {
    const path = 'foo[0].bar'

    const result = renderChainPath(path)
    expect(result).toEqual('foo?.[0]?.bar')
  })

  it('should render chained array & dot notation, legacy mode', () => {
    const path = 'foo[0].bar'

    const result = renderChainPath(path, true)
    expect(result).toEqual('foo[0] && foo[0].bar')
  })

  it('should render root array & dot notation', () => {
    const path = '[0].bar'

    const result = renderChainPath(path)
    expect(result).toEqual('?.[0]?.bar')
  })

  it('should render root array & dot notation, legacy mode', () => {
    const path = '[0].bar'

    const result = renderChainPath(path, true)
    expect(result).toEqual('[0] && [0].bar')
  })

  it('should render dot notation with single quote, supporting bracket', () => {
    const path = "foo['hydra:bar']"

    const result = renderChainPath(path)
    expect(result).toEqual("foo?.['hydra:bar']")
  })

  it('should render dot notation with double quote, supporting bracket', () => {
    const path = 'foo["hydra:bar"]'

    const result = renderChainPath(path)
    expect(result).toEqual('foo?.["hydra:bar"]')
  })

  it('should render dot notation with single quote, supporting bracket, legacy mode', () => {
    const path = "foo['hydra:bar']"

    const result = renderChainPath(path, true)
    expect(result).toEqual("foo['hydra:bar']")
  })

  it('should render dot notation with double quote, supporting bracket, legacy mode', () => {
    const path = 'foo["hydra:bar"]'

    const result = renderChainPath(path, true)
    expect(result).toEqual('foo["hydra:bar"]')
  })

  it('should render safe object path with special character', () => {
    const path = '@context'

    const result = renderBracketPath(path)
    expect(result).toEqual('["@context"]')
  })

  it('should render safe object path with nested special character', () => {
    const path = 'value["@context"]'

    const result = renderBracketPath(path)
    expect(result).toEqual('value["@context"]')
  })

  it('should render safe object path with deeply nested special character', () => {
    const path = 'foo[0].bar[1].marco[2].polo[3]["@context"]'

    const result = renderBracketPath(path)
    expect(result).toEqual('foo[0].bar[1].marco[2].polo[3]["@context"]')
  })

  it('should render safe object path with an unsafe character as root', () => {
    const path = '@count.bar[1].marco[2].polo[3]["@context"]'

    const result = renderBracketPath(path)
    expect(result).toEqual('["@count"].bar[1].marco[2].polo[3]["@context"]')
  })

  it('should render safe object path with an unsafe character as root array', () => {
    const path = '@count[Ø][1].bar[1].marco[2].polo[3]["@context"]'

    const result = renderBracketPath(path)
    expect(result).toEqual('["@count"][Ø][1].bar[1].marco[2].polo[3]["@context"]')
  })

  it('should render safe object path without . at end', () => {
    const path = 'jsonData.'

    const result = renderBracketPath(path)
    expect(result).toEqual('jsonData')
  })

  it('should detect unsafe special character within brackets', () => {
    const path = '[@context]'

    const result = detectUnsafeCharacters(path)
    expect(result).toEqual(true)
  })

  it('should not detect special character within brackets', () => {
    const path = '["context"]'

    const result = detectUnsafeCharacters(path)
    expect(result).toEqual(false)
  })

  it('should not detect safe special character within brackets', () => {
    const path = '["@context"]'

    const result = detectUnsafeCharacters(path)
    expect(result).toEqual(false)
  })

  it('should detect unsafe special character without brackets', () => {
    const path = '@context'

    const result = detectUnsafeCharacters(path)
    expect(result).toEqual(true)
  })

  it('should not detect special character without brackets', () => {
    const path = 'context'

    const result = detectUnsafeCharacters(path)
    expect(result).toEqual(false)
  })

  it('should detect unsafe special character without brackets', () => {
    const path = '"@context"'

    const result = detectUnsafeCharacters(path)
    expect(result).toEqual(false)
  })

  it('should not detect special character without brackets', () => {
    const path = '"context"'

    const result = detectUnsafeCharacters(path)
    expect(result).toEqual(false)
  })
})
