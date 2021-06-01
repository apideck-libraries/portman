import { OpenApiParser, PostmanParser } from '../../application'
import { IPostmanMappedOperation } from './PostmanMappedOperation'

describe('PostmanMappedOperation', () => {
  let postmanParser: PostmanParser
  let oasParser: OpenApiParser
  let mappedOperation: IPostmanMappedOperation

  const postmanJson = '__tests__/fixtures/crm.postman.json'
  const oasYml = '__tests__/fixtures/crm.yml'

  beforeEach(async () => {
    oasParser = new OpenApiParser()
    await oasParser.convert({ inputFile: oasYml })
    postmanParser = new PostmanParser({ inputFile: postmanJson, oasParser: oasParser })
    mappedOperation = postmanParser.mappedOperations[2]
    expect(mappedOperation).toMatchSnapshot()
  })

  it('should use the operationIdMap to add id', () => {
    expect(mappedOperation.id).toStrictEqual('companiesOne')
  })

  it('should use the normalise the paths', () => {
    expect(mappedOperation.path).toStrictEqual('/crm/companies/:id')
    expect(mappedOperation.pathRef).toStrictEqual('GET::/crm/companies/{id}')
    expect(mappedOperation.pathRefVariable).toStrictEqual('GET::/crm/companies/{{companyId}}')
  })
})
