import { OpenApiParser } from '../../application/OpenApiParser'
import { MappedOperation } from './MappedOperation'

describe('MappedOperation', () => {
  const oasYml = '__tests__/fixtures/crm.yml'
  const parser = new OpenApiParser()

  const path = '/crm/companies'
  const method = 'post'

  beforeEach(async () => {
    await parser.convert({ inputFile: oasYml })
  })

  it(`should set itself up using operation and params`, async () => {
    const operation = Object.values(parser.oas.paths)[0]['post']
    const mappedOperation = new MappedOperation(path, method, operation)
    expect(mappedOperation).toMatchSnapshot()
  })
})
