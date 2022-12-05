import { getPostmanMappedOperation } from '../../../__tests__/testUtils/getPostmanMappedOperation'
import { assignVarFromResponseBody } from '../../application'
import { PostmanMappedOperation } from '../../postman'

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

  it('should add postman collection var with name and response body value for array', async () => {
    const varSetting = {
      responseBodyProp: '[0].id',
      name: 'leadsAdd.id'
    }

    pmOperation = assignVarFromResponseBody(varSetting, pmOperation)
    const pmTest = pmOperation.getTests()
    expect(pmTest.script.exec).toMatchSnapshot()
  })

  it('should show the log output for a postman collection var with name and response body value', async () => {
    const varSetting = {
      responseBodyProp: 'data.id',
      name: 'leadsAdd.id'
    }

    pmOperation = assignVarFromResponseBody(varSetting, pmOperation, { logAssignVariables: true })
    const pmTest = pmOperation.getTests()
    expect(pmTest.script.exec).toMatchSnapshot()
  })

  it('should not show the log output for a postman collection var with name and response body value', async () => {
    const varSetting = {
      responseBodyProp: 'data.id',
      name: 'leadsAdd.id'
    }

    pmOperation = assignVarFromResponseBody(varSetting, pmOperation, { logAssignVariables: false })
    const pmTest = pmOperation.getTests()
    expect(pmTest.script.exec).toMatchSnapshot()
  })

  it('should add postman collection var with name and root response body value', async () => {
    const varSetting = {
      responseBodyProp: '.',
      name: 'leadsAdd.id'
    }

    pmOperation = assignVarFromResponseBody(varSetting, pmOperation)
    const pmTest = pmOperation.getTests()
    expect(pmTest.script.exec).toMatchSnapshot()
  })

  it('should add postman collection var with name and response body value for root array', async () => {
    const varSetting = {
      responseBodyProp: '[0]',
      name: 'leadsAdd.id'
    }

    pmOperation = assignVarFromResponseBody(varSetting, pmOperation)
    const pmTest = pmOperation.getTests()
    expect(pmTest.script.exec).toMatchSnapshot()
  })
})
