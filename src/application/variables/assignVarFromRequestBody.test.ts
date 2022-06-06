import {
  getPostmanMappedCreateArrayOperation,
  getPostmanMappedCreateOperation
} from '../../../__tests__/testUtils/getPostmanMappedOperation'
import { assignVarFromRequestBody } from '../../application'
import { PostmanMappedOperation } from '../../postman'

describe('assignVarFromRequestBody', () => {
  let pmOperation: PostmanMappedOperation
  let pmArrayOperation: PostmanMappedOperation

  beforeEach(async () => {
    pmOperation = await getPostmanMappedCreateOperation()
    pmArrayOperation = await getPostmanMappedCreateArrayOperation()
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

  it('should show the log output for request body assign variable', async () => {
    const varSetting = {
      requestBodyProp: 'name',
      name: 'leadsAdd.name'
    }

    pmOperation = assignVarFromRequestBody(varSetting, pmOperation, { logAssignVariables: true })
    const pmTest = pmOperation.getTests()
    expect(pmTest.script.exec).toMatchSnapshot()
  })

  it('should not show the log output for request body assign variable', async () => {
    const varSetting = {
      requestBodyProp: 'name',
      name: 'leadsAdd.name'
    }

    pmOperation = assignVarFromRequestBody(varSetting, pmOperation, { logAssignVariables: false })
    const pmTest = pmOperation.getTests()
    expect(pmTest.script.exec).toMatchSnapshot()
  })

  it.skip('should add postman collection var with name and full request body value from a root element', async () => {
    const varSetting = {
      requestBodyProp: '.',
      name: 'leadsAdd.name'
    }

    pmArrayOperation = assignVarFromRequestBody(varSetting, pmArrayOperation)
    const pmTest = pmArrayOperation.getTests()
    expect(pmTest.script.exec).toMatchSnapshot()
  })

  it('should add postman collection var with name and request body value from a root element', async () => {
    const varSetting = {
      requestBodyProp: '[0].name',
      name: 'leadsAdd.name'
    }

    pmArrayOperation = assignVarFromRequestBody(varSetting, pmArrayOperation)
    const pmTest = pmArrayOperation.getTests()
    expect(pmTest.script.exec).toMatchSnapshot()
  })

  it('should add postman collection var without name and request body value from a root element', async () => {
    const varSetting = {
      requestBodyProp: '[0].name'
    }

    pmArrayOperation = assignVarFromRequestBody(varSetting, pmArrayOperation)
    const pmTest = pmArrayOperation.getTests()
    expect(pmTest.script.exec).toMatchSnapshot()
  })

  it('should add postman collection var without name and request body array value from a root element', async () => {
    const varSetting = {
      requestBodyProp: '[0].websites[0].url'
    }

    pmArrayOperation = assignVarFromRequestBody(varSetting, pmArrayOperation)
    const pmTest = pmArrayOperation.getTests()
    expect(pmTest.script.exec).toMatchSnapshot()
  })

  it('should not fail when on unexisting request body value from a root element', async () => {
    const varSetting = {
      requestBodyProp: '[0].foo'
    }

    pmArrayOperation = assignVarFromRequestBody(varSetting, pmArrayOperation)
    const pmTest = pmArrayOperation.getTests()
    expect(pmTest.script.exec).toMatchSnapshot()
  })

  it('should show the log output for request body assign variable from a root element', async () => {
    const varSetting = {
      requestBodyProp: '[0].name',
      name: 'leadsAdd.name'
    }

    pmArrayOperation = assignVarFromRequestBody(varSetting, pmArrayOperation, {
      logAssignVariables: true
    })
    const pmTest = pmArrayOperation.getTests()
    expect(pmTest.script.exec).toMatchSnapshot()
  })

  it('should not show the log output for request body assign variable from a root element', async () => {
    const varSetting = {
      requestBodyProp: '[0].name',
      name: 'leadsAdd.name'
    }

    pmArrayOperation = assignVarFromRequestBody(varSetting, pmArrayOperation, {
      logAssignVariables: false
    })
    const pmTest = pmArrayOperation.getTests()
    expect(pmTest.script.exec).toMatchSnapshot()
  })
})
