import { getPostmanMappedOperation } from '../../../__tests__/testUtils/getPostmanMappedOperation'
import { testResponseHeaderContent } from '../../application'
import { PostmanMappedOperation } from '../../postman'

describe('testResponseHeaderContent', () => {
  let pmOperation: PostmanMappedOperation

  beforeEach(async () => {
    pmOperation = await getPostmanMappedOperation()
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should add content header test for string for property check & string value', async () => {
    const contentTests = [
      {
        key: 'Operation-Location',
        value: 'Spacex'
      }
    ]
    pmOperation = testResponseHeaderContent(contentTests, pmOperation)
    const pmTest = pmOperation.getTests()
    expect(pmTest.script.exec).toMatchSnapshot()
  })

  it('should add content header test for string for property check & boolean value', async () => {
    const contentTests = [
      {
        key: 'Operation-Location',
        value: true
      }
    ]
    pmOperation = testResponseHeaderContent(contentTests, pmOperation)
    const pmTest = pmOperation.getTests()
    expect(pmTest.script.exec).toMatchSnapshot()
  })

  it('should add content header test for property check & number value', async () => {
    const contentTests = [
      {
        key: 'Operation-Location',
        value: 75000
      }
    ]
    pmOperation = testResponseHeaderContent(contentTests, pmOperation)
    const pmTest = pmOperation.getTests()
    expect(pmTest.script.exec).toMatchSnapshot()
  })

  it('should add content header test for property check without value', async () => {
    const contentTests = [
      {
        key: 'Operation-Location'
      }
    ]
    pmOperation = testResponseHeaderContent(contentTests, pmOperation)
    const pmTest = pmOperation.getTests()
    expect(pmTest.script.exec).toMatchSnapshot()
  })

  it('should add content header test for property check & pm variable value', async () => {
    const contentTests = [
      {
        key: 'Operation-Location',
        value: '{{postman_env_variable}}'
      }
    ]
    pmOperation = testResponseHeaderContent(contentTests, pmOperation)
    const pmTest = pmOperation.getTests()
    expect(pmTest.script.exec).toMatchSnapshot()
  })

  it('should add content header test for property check & result contains value', async () => {
    const contentTests = [
      {
        key: 'Operation-Location',
        contains: 'Musk'
      }
    ]
    pmOperation = testResponseHeaderContent(contentTests, pmOperation)
    const pmTest = pmOperation.getTests()
    expect(pmTest.script.exec).toMatchSnapshot()
  })

  it('should add content header test for property check & result contains pm variable value', async () => {
    const contentTests = [
      {
        key: 'Operation-Location',
        contains: '{{postman_env_variable}}'
      }
    ]
    pmOperation = testResponseHeaderContent(contentTests, pmOperation)
    const pmTest = pmOperation.getTests()
    expect(pmTest.script.exec).toMatchSnapshot()
  })

  it('should add content header test for property check & result has length value', async () => {
    const contentTests = [
      {
        key: 'Operation-Location',
        length: 57
      }
    ]
    pmOperation = testResponseHeaderContent(contentTests, pmOperation)
    const pmTest = pmOperation.getTests()
    expect(pmTest.script.exec).toMatchSnapshot()
  })

  it('should add content header test for property check & result has minimum length value', async () => {
    const contentTests = [
      {
        key: 'Operation-Location',
        minLength: 57
      }
    ]
    pmOperation = testResponseHeaderContent(contentTests, pmOperation)
    const pmTest = pmOperation.getTests()
    expect(pmTest.script.exec).toMatchSnapshot()
  })

  it('should add content header test for property check & result has maximum length value', async () => {
    const contentTests = [
      {
        key: 'Operation-Location',
        maxLength: 57
      }
    ]
    pmOperation = testResponseHeaderContent(contentTests, pmOperation)
    const pmTest = pmOperation.getTests()
    expect(pmTest.script.exec).toMatchSnapshot()
  })
})
