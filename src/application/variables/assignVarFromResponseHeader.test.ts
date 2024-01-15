import { getOasMappedOperation } from '../../../__tests__/testUtils/getOasMappedOperation'
import { getPostmanMappedOperation } from '../../../__tests__/testUtils/getPostmanMappedOperation'
import { assignVarFromResponseHeader } from '../../application'
import { OasMappedOperation } from '../../oas'
import { PostmanMappedOperation } from '../../postman'
import { GlobalConfig } from '../../types'

describe('assignVarFromResponseHeader', () => {
  let oaOperation: OasMappedOperation
  let pmOperation: PostmanMappedOperation

  beforeEach(async () => {
    pmOperation = await getPostmanMappedOperation()
    oaOperation = await getOasMappedOperation()
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should add postman collection var with name and response header value', async () => {
    const varSetting = {
      responseHeaderProp: 'operation-location',
      name: 'leadsAdd.header'
    }
    const dto = {
      varSetting,
      pmOperation,
      oaOperation
    }
    pmOperation = assignVarFromResponseHeader(dto)
    const pmTest = pmOperation.getTests()
    expect(pmTest.script.exec).toMatchSnapshot()
  })

  it('should show the log output for add postman collection var with name and response header value', async () => {
    const varSetting = {
      responseHeaderProp: 'operation-location',
      name: 'leadsAdd.header'
    }
    const dto = {
      varSetting,
      pmOperation,
      oaOperation,
      options: {
        logAssignVariables: true
      }
    }
    pmOperation = assignVarFromResponseHeader(dto)
    const pmTest = pmOperation.getTests()
    expect(pmTest.script.exec).toMatchSnapshot()
  })

  it('should not show the log output for add postman collection var with name and response header value', async () => {
    const varSetting = {
      responseHeaderProp: 'operation-location',
      name: 'leadsAdd.header'
    }
    const dto = {
      varSetting,
      pmOperation,
      oaOperation,
      options: {
        logAssignVariables: false
      }
    }
    pmOperation = assignVarFromResponseHeader(dto)
    const pmTest = pmOperation.getTests()
    expect(pmTest.script.exec).toMatchSnapshot()
  })

  it('should generate a variable for the response header and convert the casing for the variable name', async () => {
    const varSetting = {
      responseHeaderProp: 'portman'
    }
    const globals = { variableCasing: 'snakeCase' } as GlobalConfig
    const dto = {
      varSetting,
      pmOperation,
      oaOperation,
      globals
    }
    pmOperation = assignVarFromResponseHeader(dto)
    const pmTest = pmOperation.getTests()
    expect(pmTest.script.exec).toMatchSnapshot()
  })

  it('should generate a variable for the response header and not convert the casing for the variable name', async () => {
    const varSetting = {
      responseHeaderProp: 'portman'
    }
    const globals = {} as GlobalConfig
    const dto = {
      varSetting,
      pmOperation,
      oaOperation,
      globals
    }
    pmOperation = assignVarFromResponseHeader(dto)
    const pmTest = pmOperation.getTests()
    expect(pmTest.script.exec).toMatchSnapshot()
  })

  it('should generate a variable for the response header and convert the casing for the templated name', async () => {
    const varSetting = {
      responseHeaderProp: 'portman',
      name: '<tag>Id'
    }
    const globals = {} as GlobalConfig
    const dto = {
      varSetting,
      pmOperation,
      oaOperation,
      globals
    }
    pmOperation = assignVarFromResponseHeader(dto)
    const pmTest = pmOperation.getTests()
    expect(pmTest.script.exec).toMatchSnapshot()
  })

  it('should generate a variable for the response header property with the templated expression', async () => {
    const varSetting = {
      responseHeaderProp: '<tag>-id'
    }
    const globals = {} as GlobalConfig
    const dto = {
      varSetting,
      pmOperation,
      oaOperation,
      globals
    }
    pmOperation = assignVarFromResponseHeader(dto)
    const pmTest = pmOperation.getTests()
    expect(pmTest.script.exec).toMatchSnapshot()
  })

  it('should generate a variable for the response header property with the cased templated expression', async () => {
    const varSetting = {
      responseHeaderProp: '<tag>-id',
      name: '<tag>Id'
    }
    const globals = { variableCasing: 'snakeCase' } as GlobalConfig
    const dto = {
      varSetting,
      pmOperation,
      oaOperation,
      globals
    }
    pmOperation = assignVarFromResponseHeader(dto)
    const pmTest = pmOperation.getTests()
    expect(pmTest.script.exec).toMatchSnapshot()
  })
})
