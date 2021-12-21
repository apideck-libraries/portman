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

  it('should add content test for property check & result contains value', async () => {
    const contentTests = [
      {
        key: 'data[0].name',
        contains: 'Musk'
      }
    ]
    pmOperation = testResponseBodyContent(contentTests, pmOperation)
    const pmTest = pmOperation.getTests()
    expect(pmTest.script.exec).toMatchSnapshot()
  })

  it('should add content test for property check & result contains pm variable value', async () => {
    const contentTests = [
      {
        key: 'data[0].monetary_amount',
        contains: '{{postman_env_variable}}'
      }
    ]
    pmOperation = testResponseBodyContent(contentTests, pmOperation)
    const pmTest = pmOperation.getTests()
    expect(pmTest.script.exec).toMatchSnapshot()
  })

  it('should add content test for property check & result has length value', async () => {
    const contentTests = [
      {
        key: 'data[0].description',
        length: 9
      }
    ]
    pmOperation = testResponseBodyContent(contentTests, pmOperation)
    const pmTest = pmOperation.getTests()
    expect(pmTest.script.exec).toMatchSnapshot()
  })

  it('should add content test for property check & result has minimum length value', async () => {
    const contentTests = [
      {
        key: 'data',
        minLength: 1
      }
    ]
    pmOperation = testResponseBodyContent(contentTests, pmOperation)
    const pmTest = pmOperation.getTests()
    expect(pmTest.script.exec).toMatchSnapshot()
  })

  it('should add content test for property check & result has maximum length value', async () => {
    const contentTests = [
      {
        key: 'data',
        maxLength: 10
      }
    ]
    pmOperation = testResponseBodyContent(contentTests, pmOperation)
    const pmTest = pmOperation.getTests()
    expect(pmTest.script.exec).toMatchSnapshot()
  })
})
