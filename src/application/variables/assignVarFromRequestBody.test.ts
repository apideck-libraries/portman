import { getPostmanMappedCreateOperation } from '../../../__tests__/testUtils/getPostmanMappedOperation'
import { assignVarFromRequestBody } from '../../application'
import { PostmanMappedOperation } from '../../postman'

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
      requestBodyProp: 'name',
      name: 'leadsAdd.name'
    }

    pmOperation = assignVarFromRequestBody(varSetting, pmOperation)
    const pmTest = pmOperation.getTests()
    expect(pmTest.script.exec).toMatchSnapshot()
  })

  it('should add postman collection var without name and request body value', async () => {
    const varSetting = {
      requestBodyProp: 'name'
    }

    pmOperation = assignVarFromRequestBody(varSetting, pmOperation)
    const pmTest = pmOperation.getTests()
    expect(pmTest.script.exec).toMatchSnapshot()
  })

  it('should add postman collection var without name and request body array value', async () => {
    const varSetting = {
      requestBodyProp: 'websites[0].url'
    }

    pmOperation = assignVarFromRequestBody(varSetting, pmOperation)
    const pmTest = pmOperation.getTests()
    expect(pmTest.script.exec).toMatchSnapshot()
  })

  it('should not fail when on unexisting request body value', async () => {
    const varSetting = {
      requestBodyProp: 'foo'
    }

    pmOperation = assignVarFromRequestBody(varSetting, pmOperation)
    const pmTest = pmOperation.getTests()
    expect(pmTest.script.exec).toMatchSnapshot()
  })
})
