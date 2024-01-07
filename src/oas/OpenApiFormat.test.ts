import { OpenAPI } from 'openapi-types'
import { OpenApiFormatter } from './OpenApiFormat'

describe('OpenApiFormat', () => {
  let oas: OpenAPI.Document
  const oasFormatter = new OpenApiFormatter()

  describe('filter', () => {
    beforeEach(async () => {
      const oasYml = '__tests__/fixtures/crm.yml'
      const filterJson = '__tests__/fixtures/oas-format-filter.json'
      oas = await oasFormatter.filter({ inputFile: oasYml, filterFile: filterJson })
    })

    it('should filter an openapispec.yml and return an OpenAPI.Document', () => {
      expect(oas.info.title).toStrictEqual('CRM API')
      expect(oas).toMatchSnapshot()
    })
  })

  describe('changeCase', () => {
    it('should change the case for a string', () => {
      const valueAsString = 'marcoPolo'
      const caseType = 'snakeCase'
      const result = oasFormatter.changeCase(valueAsString, caseType)
      expect(result).toEqual('marco_polo')
    })
    it('should change the case for a string with a dot', () => {
      const valueAsString = 'marco.polo'
      const caseType = 'snakeCase'
      const result = oasFormatter.changeCase(valueAsString, caseType)
      expect(result).toEqual('marco_polo')
    })
  })
})
