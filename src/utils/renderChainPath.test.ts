import { renderChainPath } from './renderChainPath'

describe('renderChainPath', () => {
  it('should render chained dot notation', () => {
    const path = 'foo.bar'

    const result = renderChainPath(path)
    expect(result).toEqual('foo?.bar')
  })

  it('should render multiple chained dot notation', () => {
    const path = 'foo.bar.marco.polo'

    const result = renderChainPath(path)
    expect(result).toEqual('foo?.bar?.marco?.polo')
  })

  it('should render chained array notation', () => {
    const path = 'foo[0]'

    const result = renderChainPath(path)
    expect(result).toEqual('foo?.[0]')
  })

  it('should render multiple chained array notation', () => {
    const path = 'foo[0].bar[1].marco[2].polo[3]'

    const result = renderChainPath(path)
    expect(result).toEqual('foo?.[0]?.bar?.[1]?.marco?.[2]?.polo?.[3]')
  })

  it('should render chained array & dot notation', () => {
    const path = 'foo[0].bar'

    const result = renderChainPath(path)
    expect(result).toEqual('foo?.[0]?.bar')
  })
})
