import { getOasMappedCreateOperation } from '../../../__tests__/testUtils/getOasMappedOperation'
import {
  getPostmanMappedCreateArrayOperation,
  getPostmanMappedCreateOperation
} from '../../../__tests__/testUtils/getPostmanMappedOperation'
import { assignVarFromRequestBody } from '../../application'
import { OasMappedOperation } from '../../oas'
import { PostmanMappedOperation } from '../../postman'
import { GlobalConfig } from '../../types'

describe('assignVarFromRequestBody', () => {
  let oaOperation: OasMappedOperation
  let pmOperation: PostmanMappedOperation
  let pmArrayOperation: PostmanMappedOperation

  beforeEach(async () => {
    oaOperation = await getOasMappedCreateOperation()
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
    const dto = {
      varSetting,
      pmOperation,
      oaOperation
    }
    pmOperation = assignVarFromRequestBody(dto)
    const pmTest = pmOperation.getTests()
    expect(pmTest.script.exec).toMatchSnapshot()
  })

  it('should add postman collection var without name and request body value', async () => {
    const varSetting = {
      requestBodyProp: 'name'
    }
    const dto = {
      varSetting,
      pmOperation,
      oaOperation
    }
    pmOperation = assignVarFromRequestBody(dto)
    const pmTest = pmOperation.getTests()
    expect(pmTest.script.exec).toMatchSnapshot()
  })

  it('should add postman collection var without name and request body array value', async () => {
    const varSetting = {
      requestBodyProp: 'websites[0].url'
    }
    const dto = {
      varSetting,
      pmOperation,
      oaOperation
    }
    pmOperation = assignVarFromRequestBody(dto)
    const pmTest = pmOperation.getTests()
    expect(pmTest.script.exec).toMatchSnapshot()
  })

  it('should not fail when on unexisting request body value', async () => {
    const varSetting = {
      requestBodyProp: 'foo'
    }
    const dto = {
      varSetting,
      pmOperation,
      oaOperation
    }
    pmOperation = assignVarFromRequestBody(dto)
    const pmTest = pmOperation.getTests()
    expect(pmTest.script.exec).toMatchSnapshot()
  })

  it('should show the log output for request body assign variable', async () => {
    const varSetting = {
      requestBodyProp: 'name',
      name: 'leadsAdd.name'
    }
    const dto = {
      varSetting,
      pmOperation,
      oaOperation,
      options: {
        logAssignVariables: true
      }
    }
    pmOperation = assignVarFromRequestBody(dto)
    const pmTest = pmOperation.getTests()
    expect(pmTest.script.exec).toMatchSnapshot()
  })

  it('should not show the log output for request body assign variable', async () => {
    const varSetting = {
      requestBodyProp: 'name',
      name: 'leadsAdd.name'
    }
    const dto = {
      varSetting,
      pmOperation,
      oaOperation,
      options: {
        logAssignVariables: false
      }
    }
    pmOperation = assignVarFromRequestBody(dto)
    const pmTest = pmOperation.getTests()
    expect(pmTest.script.exec).toMatchSnapshot()
  })

  it.skip('should add postman collection var with name and full request body value from a root element', async () => {
    const varSetting = {
      requestBodyProp: '.',
      name: 'leadsAdd.name'
    }
    const dto = {
      varSetting,
      pmOperation,
      oaOperation
    }
    pmArrayOperation = assignVarFromRequestBody(dto)
    const pmTest = pmArrayOperation.getTests()
    expect(pmTest.script.exec).toMatchSnapshot()
  })

  it('should add postman collection var with name and request body value from a root element', async () => {
    const varSetting = {
      requestBodyProp: '[0].name',
      name: 'leadsAdd.name'
    }
    const dto = {
      varSetting,
      pmOperation: pmArrayOperation,
      oaOperation
    }
    pmArrayOperation = assignVarFromRequestBody(dto)
    const pmTest = pmArrayOperation.getTests()
    expect(pmTest.script.exec).toMatchSnapshot()
  })

  it('should add postman collection var without name and request body value from a root element', async () => {
    const varSetting = {
      requestBodyProp: '[0].name'
    }
    const dto = {
      varSetting,
      pmOperation: pmArrayOperation,
      oaOperation
    }
    pmArrayOperation = assignVarFromRequestBody(dto)
    const pmTest = pmArrayOperation.getTests()
    expect(pmTest.script.exec).toMatchSnapshot()
  })

  it('should add postman collection var without name and request body array value from a root element', async () => {
    const varSetting = {
      requestBodyProp: '[0].websites[0].url'
    }
    const dto = {
      varSetting,
      pmOperation: pmArrayOperation,
      oaOperation
    }
    pmArrayOperation = assignVarFromRequestBody(dto)
    const pmTest = pmArrayOperation.getTests()
    expect(pmTest.script.exec).toMatchSnapshot()
  })

  it('should not fail when on unexisting request body value from a root element', async () => {
    const varSetting = {
      requestBodyProp: '[0].foo'
    }
    const dto = {
      varSetting,
      pmOperation: pmArrayOperation,
      oaOperation
    }
    pmArrayOperation = assignVarFromRequestBody(dto)
    const pmTest = pmArrayOperation.getTests()
    expect(pmTest.script.exec).toMatchSnapshot()
  })

  it('should show the log output for request body assign variable from a root element', async () => {
    const varSetting = {
      requestBodyProp: '[0].name',
      name: 'leadsAdd.name'
    }
    const dto = {
      varSetting,
      pmOperation: pmArrayOperation,
      oaOperation,
      options: {
        logAssignVariables: true
      }
    }
    pmArrayOperation = assignVarFromRequestBody(dto)
    const pmTest = pmArrayOperation.getTests()
    expect(pmTest.script.exec).toMatchSnapshot()
  })

  it('should not show the log output for request body assign variable from a root element', async () => {
    const varSetting = {
      requestBodyProp: '[0].name',
      name: 'leadsAdd.name'
    }
    const dto = {
      varSetting,
      pmOperation: pmArrayOperation,
      oaOperation,
      options: {
        logAssignVariables: false
      }
    }
    pmArrayOperation = assignVarFromRequestBody(dto)
    const pmTest = pmArrayOperation.getTests()
    expect(pmTest.script.exec).toMatchSnapshot()
  })

  it('should generate a variable for the request body and convert the casing for the variable name', async () => {
    const varSetting = {
      requestBodyProp: 'name'
    }
    const globals = { variableCasing: 'snakeCase' } as GlobalConfig
    const dto = {
      varSetting,
      pmOperation,
      oaOperation,
      globals
    }
    pmOperation = assignVarFromRequestBody(dto)
    const pmTest = pmOperation.getTests()
    expect(pmTest.script.exec).toMatchSnapshot()
  })

  it('should generate a variable for the request body and not convert the casing for the variable name', async () => {
    const varSetting = {
      requestBodyProp: 'name'
    }
    const globals = {} as GlobalConfig
    const dto = {
      varSetting,
      pmOperation,
      oaOperation,
      globals
    }
    pmOperation = assignVarFromRequestBody(dto)
    const pmTest = pmOperation.getTests()
    expect(pmTest.script.exec).toMatchSnapshot()
  })

  it('should generate a variable for the request body and convert the casing for the templated name', async () => {
    const varSetting = {
      requestBodyProp: 'name',
      name: '<tag>Id'
    }
    const globals = {} as GlobalConfig
    const dto = {
      varSetting,
      pmOperation,
      oaOperation,
      globals
    }
    pmOperation = assignVarFromRequestBody(dto)
    const pmTest = pmOperation.getTests()
    expect(pmTest.script.exec).toMatchSnapshot()
  })

  it('should generate a variable for the request body property with the templated expression', async () => {
    const varSetting = {
      requestBodyProp: '<pathPart2>.id'
    }
    const globals = {} as GlobalConfig
    const dto = {
      varSetting,
      pmOperation,
      oaOperation,
      globals
    }
    pmOperation = assignVarFromRequestBody(dto)
    const pmTest = pmOperation.getTests()
    expect(pmTest.script.exec).toMatchSnapshot()
  })

  it('should generate a variable for the request body property with the cased templated expression', async () => {
    const varSetting = {
      requestBodyProp: '<tag>.id',
      name: '<tag>Id'
    }
    const globals = {} as GlobalConfig
    const dto = {
      varSetting,
      pmOperation,
      oaOperation,
      globals
    }
    pmOperation = assignVarFromRequestBody(dto)
    const pmTest = pmOperation.getTests()
    expect(pmTest.script.exec).toMatchSnapshot()
  })
})
