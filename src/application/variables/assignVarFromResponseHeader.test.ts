import { assignVarFromResponseHeader } from 'application'
import { PostmanMappedOperation } from 'postman'
import { getPostmanMappedOperation } from 'testUtils/getPostmanMappedOperation'

describe('assignVarFromResponseHeader', () => {
  let pmOperation: PostmanMappedOperation

  beforeEach(async () => {
    pmOperation = await getPostmanMappedOperation()
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should add postman collection var with name and response header value', async () => {
    const varSetting = {
      responseHeaderProp: 'operation-location',
      name: 'leadsAdd.header'
    }

    pmOperation = assignVarFromResponseHeader(varSetting, pmOperation)
    const pmTest = pmOperation.getTests()
    expect(pmTest.script.exec).toMatchSnapshot()
  })
})
