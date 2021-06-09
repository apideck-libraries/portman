import { getPostmanMappedCreateOperation } from '../../../__tests__/getPostmanMappedOperation'
import { PostmanMappedOperation } from '../postman/PostmanMappedOperation'
import { assignVarFromRequestBody } from './assignVarFromRequestBody'

describe('assignVarFromRequestBody', () => {
  let pmOperation: PostmanMappedOperation

  beforeEach(async () => {
    pmOperation = await getPostmanMappedCreateOperation()
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should add postman collection var with name and request body value', async () => {
    const varSetting = {
      requestBodyProp: 'company_name',
      name: 'leadsAdd.company_name'
    }

    // TODO
    pmOperation = assignVarFromRequestBody(varSetting, pmOperation)
    const pmTest = pmOperation.getTests()
    expect(pmTest.script.exec).toMatchSnapshot()
  })
})
