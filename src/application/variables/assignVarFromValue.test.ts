import { getOasMappedOperation } from '../../../__tests__/testUtils/getOasMappedOperation'
import { getPostmanMappedOperation } from '../../../__tests__/testUtils/getPostmanMappedOperation'
import { assignVarFromValue } from '../../application'
import { OasMappedOperation } from '../../oas'
import { PostmanMappedOperation } from '../../postman'
import { GlobalConfig } from '../../types'

describe('assignVarFromValue', () => {
  let oaOperation: OasMappedOperation
  let pmOperation: PostmanMappedOperation

  beforeEach(async () => {
    pmOperation = await getPostmanMappedOperation()
    oaOperation = await getOasMappedOperation()
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should add postman collection var without name for string value', async () => {
    const varSetting = {
      value: 'portman'
    }
    const dto = {
      varSetting,
      pmOperation,
      oaOperation
    }
    pmOperation = assignVarFromValue(dto, 1)
    const pmTest = pmOperation.getTests()
    expect(pmTest.script.exec).toMatchSnapshot()
  })

  it('should add postman collection var with name for string value', async () => {
    const varSetting = {
      value: 'portman',
      name: 'portman_string'
    }
    const dto = {
      varSetting,
      pmOperation,
      oaOperation
    }
    pmOperation = assignVarFromValue(dto, 1)
    const pmTest = pmOperation.getTests()
    expect(pmTest.script.exec).toMatchSnapshot()
  })

  it('should add postman collection var with name for boolean value', async () => {
    const varSetting = {
      value: true,
      name: 'portman_boolean'
    }
    const dto = {
      varSetting,
      pmOperation,
      oaOperation
    }
    pmOperation = assignVarFromValue(dto, 2)
    const pmTest = pmOperation.getTests()
    expect(pmTest.script.exec).toMatchSnapshot()
  })

  it('should add postman collection var with name for number value', async () => {
    const varSetting = {
      value: 12345,
      name: 'portman_number'
    }
    const dto = {
      varSetting,
      pmOperation,
      oaOperation
    }
    pmOperation = assignVarFromValue(dto, 3)
    const pmTest = pmOperation.getTests()
    expect(pmTest.script.exec).toMatchSnapshot()
  })

  it('should show the log output for add postman collection var without name for string value', async () => {
    const varSetting = {
      value: 'portman'
    }
    const dto = {
      varSetting,
      pmOperation,
      oaOperation,
      options: {
        logAssignVariables: true
      }
    }
    pmOperation = assignVarFromValue(dto, 1)
    const pmTest = pmOperation.getTests()
    expect(pmTest.script.exec).toMatchSnapshot()
  })

  it('should not show the log output for add postman collection var without name for string value', async () => {
    const varSetting = {
      value: 'portman'
    }
    const dto = {
      varSetting,
      pmOperation,
      oaOperation,
      options: {
        logAssignVariables: false
      }
    }
    pmOperation = assignVarFromValue(dto, 1)
    const pmTest = pmOperation.getTests()
    expect(pmTest.script.exec).toMatchSnapshot()
  })

  it('should generate a variable and convert the casing for the variable name', async () => {
    const varSetting = {
      value: 'portman'
    }
    const globals = { variableCasing: 'snakeCase' } as GlobalConfig
    const dto = {
      varSetting,
      pmOperation,
      oaOperation,
      globals
    }
    pmOperation = assignVarFromValue(dto, 1)
    const pmTest = pmOperation.getTests()
    expect(pmTest.script.exec).toMatchSnapshot()
  })

  it('should generate a variable and not convert the casing for the variable name', async () => {
    const varSetting = {
      value: 'portman'
    }
    const globals = {} as GlobalConfig
    const dto = {
      varSetting,
      pmOperation,
      oaOperation,
      globals
    }
    pmOperation = assignVarFromValue(dto, 1)
    const pmTest = pmOperation.getTests()
    expect(pmTest.script.exec).toMatchSnapshot()
  })
})
