import { getOasMappedOperation } from '../../../__tests__/testUtils/getOasMappedOperation'
import { getPostmanMappedOperation } from '../../../__tests__/testUtils/getPostmanMappedOperation'
import { assignVarFromResponseBody } from '../../application'
import { OasMappedOperation } from '../../oas'
import { PostmanMappedOperation } from '../../postman'
import { GlobalConfig } from '../../types'

describe('assignVarFromResponseBody', () => {
  let oaOperation: OasMappedOperation
  let pmOperation: PostmanMappedOperation

  beforeEach(async () => {
    pmOperation = await getPostmanMappedOperation()
    oaOperation = await getOasMappedOperation()
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should add postman collection var with name and response body value', async () => {
    const varSetting = {
      responseBodyProp: 'data.id',
      name: 'leadsAdd.id'
    }
    const dto = {
      varSetting,
      pmOperation,
      oaOperation
    }
    pmOperation = assignVarFromResponseBody(dto)
    const pmTest = pmOperation.getTests()
    expect(pmTest.script.exec).toMatchSnapshot()
  })

  it('should add postman collection var with name and response body value for array', async () => {
    const varSetting = {
      responseBodyProp: '[0].id',
      name: 'leadsAdd.id'
    }
    const dto = {
      varSetting,
      pmOperation,
      oaOperation
    }
    pmOperation = assignVarFromResponseBody(dto)
    const pmTest = pmOperation.getTests()
    expect(pmTest.script.exec).toMatchSnapshot()
  })

  it('should show the log output for a postman collection var with name and response body value', async () => {
    const varSetting = {
      responseBodyProp: 'data.id',
      name: 'leadsAdd.id'
    }
    const dto = {
      varSetting,
      pmOperation,
      oaOperation,
      options: {
        logAssignVariables: true
      }
    }
    pmOperation = assignVarFromResponseBody(dto)
    const pmTest = pmOperation.getTests()
    expect(pmTest.script.exec).toMatchSnapshot()
  })

  it('should not show the log output for a postman collection var with name and response body value', async () => {
    const varSetting = {
      responseBodyProp: 'data.id',
      name: 'leadsAdd.id'
    }
    const dto = {
      varSetting,
      pmOperation,
      oaOperation,
      options: {
        logAssignVariables: false
      }
    }
    pmOperation = assignVarFromResponseBody(dto)
    const pmTest = pmOperation.getTests()
    expect(pmTest.script.exec).toMatchSnapshot()
  })

  it('should add postman collection var with name and root response body value', async () => {
    const varSetting = {
      responseBodyProp: '.',
      name: 'leadsAdd.id'
    }
    const dto = {
      varSetting,
      pmOperation,
      oaOperation
    }
    pmOperation = assignVarFromResponseBody(dto)
    const pmTest = pmOperation.getTests()
    expect(pmTest.script.exec).toMatchSnapshot()
  })

  it('should add postman collection var with name and response body value for root array', async () => {
    const varSetting = {
      responseBodyProp: '[0]',
      name: 'leadsAdd.id'
    }
    const dto = {
      varSetting,
      pmOperation,
      oaOperation
    }
    pmOperation = assignVarFromResponseBody(dto)
    const pmTest = pmOperation.getTests()
    expect(pmTest.script.exec).toMatchSnapshot()
  })

  it('should generate a variable for the response body and convert the casing for the variable name', async () => {
    const varSetting = {
      responseBodyProp: 'data.id'
    }
    const globals = { variableCasing: 'snakeCase' } as GlobalConfig
    const dto = {
      varSetting,
      pmOperation,
      oaOperation,
      globals
    }
    pmOperation = assignVarFromResponseBody(dto)
    const pmTest = pmOperation.getTests()
    expect(pmTest.script.exec).toMatchSnapshot()
  })

  it('should generate a variable for the response body and not convert the casing for the variable name', async () => {
    const varSetting = {
      responseBodyProp: 'data.id'
    }
    const globals = {} as GlobalConfig
    const dto = {
      varSetting,
      pmOperation,
      oaOperation,
      globals
    }
    pmOperation = assignVarFromResponseBody(dto)
    const pmTest = pmOperation.getTests()
    expect(pmTest.script.exec).toMatchSnapshot()
  })

  it('should generate a variable for the response body and convert the casing for the templated name', async () => {
    const varSetting = {
      responseBodyProp: 'data.id',
      name: '<tag>Id'
    }
    const globals = {} as GlobalConfig
    const dto = {
      varSetting,
      pmOperation,
      oaOperation,
      globals
    }
    pmOperation = assignVarFromResponseBody(dto)
    const pmTest = pmOperation.getTests()
    expect(pmTest.script.exec).toMatchSnapshot()
  })

  it('should generate a variable for the response body property with the templated expression', async () => {
    const varSetting = {
      responseBodyProp: '<tag>[0].id',
      name: '<tag>Id'
    }
    const globals = {} as GlobalConfig
    const dto = {
      varSetting,
      pmOperation,
      oaOperation,
      globals
    }
    pmOperation = assignVarFromResponseBody(dto)
    const pmTest = pmOperation.getTests()
    expect(pmTest.script.exec).toMatchSnapshot()
  })

  it('should generate a variable for the response body property with the cased templated expression', async () => {
    const varSetting = {
      responseBodyProp: '<tag>[0].id',
      name: '<tag>Id'
    }
    const globals = { variableCasing: 'snakeCase' } as GlobalConfig
    const dto = {
      varSetting,
      pmOperation,
      oaOperation,
      globals
    }
    pmOperation = assignVarFromResponseBody(dto)
    const pmTest = pmOperation.getTests()
    expect(pmTest.script.exec).toMatchSnapshot()
  })
})
