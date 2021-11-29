import { renderChainPath } from './renderChainPath'

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
})
