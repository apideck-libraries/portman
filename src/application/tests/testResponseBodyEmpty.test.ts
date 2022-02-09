import { getOasMappedOperation } from '../../../__tests__/testUtils/getOasMappedOperation'
import { getPostmanMappedOperation } from '../../../__tests__/testUtils/getPostmanMappedOperation'
import { OasMappedOperation } from '../../oas'
import { PostmanMappedOperation } from '../../postman'
import { testResponseBodyEmpty } from './testResponseBodyEmpty'

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
})
