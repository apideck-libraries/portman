import { getPostmanMappedOperation } from '../../../__tests__/testUtils/getPostmanMappedOperation'
import { testResponseBodyContent } from '../../application'
import { PostmanMappedOperation } from '../../postman'

describe('testResponseBodyContent', () => {
  let pmOperation: PostmanMappedOperation

  beforeEach(async () => {
    pmOperation = await getPostmanMappedOperation()
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should add content test for string for property check & string value', async () => {
    const contentTests = [
      {
        key: 'data[0].company_name',
        value: 'Spacex'
      }
    ]
    pmOperation = testResponseBodyContent(contentTests, pmOperation)
    const pmTest = pmOperation.getTests()
    expect(pmTest.script.exec).toMatchSnapshot()
  })

  it('should add content test for string for property check & boolean value', async () => {
    const contentTests = [
      {
        key: 'data[0].company_name',
        value: true
      }
    ]
    pmOperation = testResponseBodyContent(contentTests, pmOperation)
    const pmTest = pmOperation.getTests()
    expect(pmTest.script.exec).toMatchSnapshot()
  })

  it('should add content test for property check & number value', async () => {
    const contentTests = [
      {
        key: 'data[0].monetary_amount',
        value: 75000
      }
    ]
    pmOperation = testResponseBodyContent(contentTests, pmOperation)
    const pmTest = pmOperation.getTests()
    expect(pmTest.script.exec).toMatchSnapshot()
  })

  it('should add content test for property check without value', async () => {
    const contentTests = [
      {
        key: 'data[0].monetary_amount'
      }
    ]
    pmOperation = testResponseBodyContent(contentTests, pmOperation)
    const pmTest = pmOperation.getTests()
    expect(pmTest.script.exec).toMatchSnapshot()
  })

  it('should add content test for property check & pm variable value', async () => {
    const contentTests = [
      {
        key: 'data[0].monetary_amount',
        value: '{{postman_env_variable}}'
      }
    ]
    pmOperation = testResponseBodyContent(contentTests, pmOperation)
    const pmTest = pmOperation.getTests()
    expect(pmTest.script.exec).toMatchSnapshot()
  })
})
