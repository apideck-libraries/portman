import { getOasMappedOperation } from '../../../__tests__/testUtils/getOasMappedOperation'
import { getPostmanMappedOperation } from '../../../__tests__/testUtils/getPostmanMappedOperation'
import { OasMappedOperation } from '../../oas'
import { PostmanMappedOperation } from '../../postman'
import { testResponseBodyEmpty } from './testResponseBodyEmpty'
import { GlobalConfig } from '../../types'

describe('testResponseBodyEmpty', () => {
  let oasOperation: OasMappedOperation
  let pmOperation: PostmanMappedOperation

  beforeEach(async () => {
    oasOperation = await getOasMappedOperation()
    pmOperation = await getPostmanMappedOperation()
  })

  it('should add test for empty body', async () => {
    pmOperation = testResponseBodyEmpty(pmOperation, oasOperation)
    const pmTest = pmOperation.getTests()
    expect(pmTest.script.exec).toMatchSnapshot()
  })

  it('should add test with separator symbol for empty body', async () => {
    const globalConfig = { separatorSymbol: '==' } as GlobalConfig
    pmOperation = testResponseBodyEmpty(pmOperation, oasOperation, globalConfig)
    const pmTest = pmOperation.getTests()
    expect(pmTest.script.exec).toMatchSnapshot()
  })
})
