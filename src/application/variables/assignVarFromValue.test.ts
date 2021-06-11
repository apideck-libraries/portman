import { assignVarFromValue } from 'application'
import { PostmanMappedOperation } from 'postman'
import { getPostmanMappedOperation } from 'testUtils/getPostmanMappedOperation'

describe('assignVarFromValue', () => {
  let pmOperation: PostmanMappedOperation

  beforeEach(async () => {
    pmOperation = await getPostmanMappedOperation()
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should add postman collection var without name for string value', async () => {
    const varSetting = {
      value: 'portman'
    }
    pmOperation = assignVarFromValue(varSetting, pmOperation, 1)
    const pmTest = pmOperation.getTests()
    expect(pmTest.script.exec).toMatchSnapshot()
  })

  it('should add postman collection var with name for string value', async () => {
    const varSetting = {
      value: 'portman',
      name: 'portman_string'
    }
    pmOperation = assignVarFromValue(varSetting, pmOperation, 1)
    const pmTest = pmOperation.getTests()
    expect(pmTest.script.exec).toMatchSnapshot()
  })

  it('should add postman collection var with name for boolean value', async () => {
    const varSetting = {
      value: true,
      name: 'portman_boolean'
    }
    pmOperation = assignVarFromValue(varSetting, pmOperation, 2)
    const pmTest = pmOperation.getTests()
    expect(pmTest.script.exec).toMatchSnapshot()
  })

  it('should add postman collection var with name for number value', async () => {
    const varSetting = {
      value: 12345,
      name: 'portman_number'
    }
    pmOperation = assignVarFromValue(varSetting, pmOperation, 3)
    const pmTest = pmOperation.getTests()
    expect(pmTest.script.exec).toMatchSnapshot()
  })
})
