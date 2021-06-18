import { getPostmanMappedOperation } from '../../../__tests__/testUtils/getPostmanMappedOperation'
import { testResponseStatusSuccess } from '../../application'
import { PostmanMappedOperation } from '../../postman'

describe('testResponseStatusSuccess', () => {
  let pmOperation: PostmanMappedOperation

  beforeEach(async () => {
    pmOperation = await getPostmanMappedOperation()
  })

  it('should add test for status success', async () => {
    pmOperation = testResponseStatusSuccess(pmOperation)
    const pmTest = pmOperation.getTests()
    expect(pmTest.script.exec).toMatchSnapshot()
  })
})
