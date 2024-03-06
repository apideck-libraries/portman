import { getOasMappedOperation } from '../../../__tests__/testUtils/getOasMappedOperation'
import { getPostmanMappedOperation } from '../../../__tests__/testUtils/getPostmanMappedOperation'
import { testResponseHeader } from '../../application'
import { OasMappedOperation } from '../../oas'
import { PostmanMappedOperation } from '../../postman'
import { GlobalConfig } from '../../types'

describe('testResponseHeader', () => {
  let oasOperation: OasMappedOperation
  let pmOperation: PostmanMappedOperation

  beforeEach(async () => {
    oasOperation = await getOasMappedOperation()
    pmOperation = await getPostmanMappedOperation()
  })

  it('should add test for response header', async () => {
    pmOperation = testResponseHeader('x-apideck-app-id', pmOperation, oasOperation)
    pmOperation = testResponseHeader('x-unify-request-id', pmOperation, oasOperation)
    pmOperation = testResponseHeader('x-apideck-service-id', pmOperation, oasOperation)
    const pmTest = pmOperation.getTests()
    expect(pmTest.script.exec).toMatchSnapshot()
  })

  it('should add test for required response header', async () => {
    pmOperation = testResponseHeader('x-apideck-app-id', pmOperation, oasOperation)
    const pmTest = pmOperation.getTests()
    expect(pmTest.script.exec).toMatchSnapshot()
  })

  it('should skip test for non-required response header', async () => {
    pmOperation = testResponseHeader('x-apideck-service-id', pmOperation, oasOperation)
    const pmTest = pmOperation.getTests()
    expect(pmTest).toBeUndefined()
  })

  it('should add test with separator symbol for response header', async () => {
    const globalConfig = { separatorSymbol: '==' } as GlobalConfig
    pmOperation = testResponseHeader('x-apideck-app-id', pmOperation, oasOperation, globalConfig)
    const pmTest = pmOperation.getTests()
    expect(pmTest.script.exec).toMatchSnapshot()
  })
})
