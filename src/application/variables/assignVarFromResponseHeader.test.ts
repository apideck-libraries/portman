import { getOasMappedOperation } from '../../../__tests__/testUtils/getOasMappedOperation'
import { getPostmanMappedOperation } from '../../../__tests__/testUtils/getPostmanMappedOperation'
import { assignVarFromResponseHeader } from '../../application'
import { OasMappedOperation } from '../../oas'
import { PostmanMappedOperation } from '../../postman'
import { GlobalConfig } from '../../types'

describe('assignVarFromResponseHeader', () => {
  let oasOperation: OasMappedOperation
  let pmOperation: PostmanMappedOperation

  beforeEach(async () => {
    pmOperation = await getPostmanMappedOperation()
    oasOperation = await getOasMappedOperation()
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should add postman collection var with name and response header value', async () => {
    const varSetting = {
      responseHeaderProp: 'operation-location',
      name: 'leadsAdd.header'
    }

    pmOperation = assignVarFromResponseHeader(varSetting, pmOperation, oasOperation)
    const pmTest = pmOperation.getTests()
    expect(pmTest.script.exec).toMatchSnapshot()
  })

  it('should show the log output for add postman collection var with name and response header value', async () => {
    const varSetting = {
      responseHeaderProp: 'operation-location',
      name: 'leadsAdd.header'
    }

    pmOperation = assignVarFromResponseHeader(varSetting, pmOperation, oasOperation, {
      logAssignVariables: true
    })
    const pmTest = pmOperation.getTests()
    expect(pmTest.script.exec).toMatchSnapshot()
  })

  it('should not show the log output for add postman collection var with name and response header value', async () => {
    const varSetting = {
      responseHeaderProp: 'operation-location',
      name: 'leadsAdd.header'
    }

    pmOperation = assignVarFromResponseHeader(varSetting, pmOperation, oasOperation, {
      logAssignVariables: false
    })
    const pmTest = pmOperation.getTests()
    expect(pmTest.script.exec).toMatchSnapshot()
  })

  it('should generate a variable for the response header and convert the casing for the variable name', async () => {
    const varSetting = {
      responseHeaderProp: 'portman'
    }
    const global = { variableCasing: 'snakeCase' } as GlobalConfig
    pmOperation = assignVarFromResponseHeader(varSetting, pmOperation, oasOperation, {}, global)
    const pmTest = pmOperation.getTests()
    expect(pmTest.script.exec).toMatchSnapshot()
  })

  it('should generate a variable for the response header and not convert the casing for the variable name', async () => {
    const varSetting = {
      responseHeaderProp: 'portman'
    }
    const global = {} as GlobalConfig
    pmOperation = assignVarFromResponseHeader(varSetting, pmOperation, oasOperation, {}, global)
    const pmTest = pmOperation.getTests()
    expect(pmTest.script.exec).toMatchSnapshot()
  })
})
