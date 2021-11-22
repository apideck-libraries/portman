import { oasRename } from '../../application'
import { OpenApiParser } from '../../oas'
import { PortmanOptions } from '../../types'

let oasParser: OpenApiParser

const oasYml = '__tests__/fixtures/crm.yml'

beforeEach(async () => {
  oasParser = new OpenApiParser()
  await oasParser.convert({ inputFile: oasYml })
})

describe('oasRename', () => {
  it('should return changed OpenAPI document title', () => {
    const oas = oasParser.oas
    const options = { oaRename: 'Foo bar' } as PortmanOptions
    const result = oasRename(oas, options)
    expect(result.info.title).toStrictEqual('Foo bar')
  })

  it('should return unchanged OpenAPI document title when oaRename is not set', () => {
    const oas = oasParser.oas
    const options = {} as PortmanOptions
    const result = oasRename(oas, options)
    expect(result.info.title).toStrictEqual('CRM API')
  })

  it('should return unchanged OpenAPI document title when oaRename is blank', () => {
    const oas = oasParser.oas
    const options = { oaRename: '' } as PortmanOptions
    const result = oasRename(oas, options)
    expect(result.info.title).toStrictEqual('CRM API')
  })

  it('should return error when OpenAPI document title is not set', () => {
    const oas = oasParser.oas
    oas.info.title = ''
    const options = { oaRename: 'Foo Bar' } as PortmanOptions

    expect(() => {
      oasRename(oas, options)
    }).toThrowError('required')
  })
})
