import { getPostmanMappedOperation } from '../../../../__tests__/getPostmanMappedOperation'
import { PostmanMappedOperation } from '../../postman/PostmanMappedOperation'
import { assignVarFromResponseBody } from './assignVarFromResponseBody'

describe('assignVarFromResponseBody', () => {
  let pmOperation: PostmanMappedOperation

  beforeEach(async () => {
    pmOperation = await getPostmanMappedOperation()
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should add postman collection var with name and response body value', async () => {
    const varSetting = {
      responseBodyProp: 'data.id',
      name: 'leadsAdd.id'
    }

    pmOperation = assignVarFromResponseBody(varSetting, pmOperation)
    const pmTest = pmOperation.getTests()
    expect(pmTest.script.exec).toMatchSnapshot()
  })
})
