import { getOasMappedOperation } from '../../../__tests__/testUtils/getOasMappedOperation'
import {
  getPostmanMappedCreateArrayOperation,
  getPostmanMappedCreateOperation
} from '../../../__tests__/testUtils/getPostmanMappedOperation'
import { assignVarFromRequestBody } from '../../application'
import { OasMappedOperation } from '../../oas'
import { PostmanMappedOperation } from '../../postman'
import { GlobalConfig } from '../../types'

describe('assignVarFromRequestBody', () => {
  let oasOperation: OasMappedOperation
  let pmOperation: PostmanMappedOperation
  let pmArrayOperation: PostmanMappedOperation

  beforeEach(async () => {
    oasOperation = await getOasMappedOperation()
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

    pmOperation = assignVarFromRequestBody(varSetting, pmOperation, oasOperation)
    const pmTest = pmOperation.getTests()
    expect(pmTest.script.exec).toMatchSnapshot()
  })

  it('should add postman collection var without name and request body value', async () => {
    const varSetting = {
      requestBodyProp: 'name'
    }

    pmOperation = assignVarFromRequestBody(varSetting, pmOperation, oasOperation)
    const pmTest = pmOperation.getTests()
    expect(pmTest.script.exec).toMatchSnapshot()
  })

  it('should add postman collection var without name and request body array value', async () => {
    const varSetting = {
      requestBodyProp: 'websites[0].url'
    }

    pmOperation = assignVarFromRequestBody(varSetting, pmOperation, oasOperation)
    const pmTest = pmOperation.getTests()
    expect(pmTest.script.exec).toMatchSnapshot()
  })

  it('should not fail when on unexisting request body value', async () => {
    const varSetting = {
      requestBodyProp: 'foo'
    }

    pmOperation = assignVarFromRequestBody(varSetting, pmOperation, oasOperation)
    const pmTest = pmOperation.getTests()
    expect(pmTest.script.exec).toMatchSnapshot()
  })

  it('should show the log output for request body assign variable', async () => {
    const varSetting = {
      requestBodyProp: 'name',
      name: 'leadsAdd.name'
    }

    pmOperation = assignVarFromRequestBody(varSetting, pmOperation, oasOperation, {
      logAssignVariables: true
    })
    const pmTest = pmOperation.getTests()
    expect(pmTest.script.exec).toMatchSnapshot()
  })

  it('should not show the log output for request body assign variable', async () => {
    const varSetting = {
      requestBodyProp: 'name',
      name: 'leadsAdd.name'
    }

    pmOperation = assignVarFromRequestBody(varSetting, pmOperation, oasOperation, {
      logAssignVariables: false
    })
    const pmTest = pmOperation.getTests()
    expect(pmTest.script.exec).toMatchSnapshot()
  })

  it.skip('should add postman collection var with name and full request body value from a root element', async () => {
    const varSetting = {
      requestBodyProp: '.',
      name: 'leadsAdd.name'
    }

    pmArrayOperation = assignVarFromRequestBody(varSetting, pmArrayOperation, oasOperation)
    const pmTest = pmArrayOperation.getTests()
    expect(pmTest.script.exec).toMatchSnapshot()
  })

  it('should add postman collection var with name and request body value from a root element', async () => {
    const varSetting = {
      requestBodyProp: '[0].name',
      name: 'leadsAdd.name'
    }

    pmArrayOperation = assignVarFromRequestBody(varSetting, pmArrayOperation, oasOperation)
    const pmTest = pmArrayOperation.getTests()
    expect(pmTest.script.exec).toMatchSnapshot()
  })

  it('should add postman collection var without name and request body value from a root element', async () => {
    const varSetting = {
      requestBodyProp: '[0].name'
    }

    pmArrayOperation = assignVarFromRequestBody(varSetting, pmArrayOperation, oasOperation)
    const pmTest = pmArrayOperation.getTests()
    expect(pmTest.script.exec).toMatchSnapshot()
  })

  it('should add postman collection var without name and request body array value from a root element', async () => {
    const varSetting = {
      requestBodyProp: '[0].websites[0].url'
    }

    pmArrayOperation = assignVarFromRequestBody(varSetting, pmArrayOperation, oasOperation)
    const pmTest = pmArrayOperation.getTests()
    expect(pmTest.script.exec).toMatchSnapshot()
  })

  it('should not fail when on unexisting request body value from a root element', async () => {
    const varSetting = {
      requestBodyProp: '[0].foo'
    }

    pmArrayOperation = assignVarFromRequestBody(varSetting, pmArrayOperation, oasOperation)
    const pmTest = pmArrayOperation.getTests()
    expect(pmTest.script.exec).toMatchSnapshot()
  })

  it('should show the log output for request body assign variable from a root element', async () => {
    const varSetting = {
      requestBodyProp: '[0].name',
      name: 'leadsAdd.name'
    }

    pmArrayOperation = assignVarFromRequestBody(varSetting, pmArrayOperation, oasOperation, {
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

    pmArrayOperation = assignVarFromRequestBody(varSetting, pmArrayOperation, oasOperation, {
      logAssignVariables: false
    })
    const pmTest = pmArrayOperation.getTests()
    expect(pmTest.script.exec).toMatchSnapshot()
  })

  it('should generate a variable for the request body and convert the casing for the variable name', async () => {
    const varSetting = {
      requestBodyProp: 'name'
    }
    const global = { variableCasing: 'snakeCase' } as GlobalConfig
    pmOperation = assignVarFromRequestBody(varSetting, pmOperation, oasOperation, {}, global)
    const pmTest = pmOperation.getTests()
    expect(pmTest.script.exec).toMatchSnapshot()
  })

  it('should generate a variable for the request body and not convert the casing for the variable name', async () => {
    const varSetting = {
      requestBodyProp: 'name'
    }
    const global = {} as GlobalConfig
    pmOperation = assignVarFromRequestBody(varSetting, pmOperation, oasOperation, {}, global)
    const pmTest = pmOperation.getTests()
    expect(pmTest.script.exec).toMatchSnapshot()
  })
})
