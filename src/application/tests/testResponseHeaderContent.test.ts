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

  it('should add content header test for property check that does not exist', async () => {
    const contentTests = [
      {
        key: 'Operation-Location',
        notExist: true
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
        minLength: 10
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
        maxLength: 60
      }
    ]
    pmOperation = testResponseHeaderContent(contentTests, pmOperation)
    const pmTest = pmOperation.getTests()
    expect(pmTest.script.exec).toMatchSnapshot()
  })

  it('should add content header test for property check & result has zero length value', async () => {
    const contentTests = [
      {
        key: 'Operation-Location',
        length: 0
      }
    ]
    pmOperation = testResponseHeaderContent(contentTests, pmOperation)
    const pmTest = pmOperation.getTests()
    expect(pmTest.script.exec).toMatchSnapshot()
  })

  it('should add content header test for property check & result has minimum zero length value', async () => {
    const contentTests = [
      {
        key: 'Operation-Location',
        minLength: 0
      }
    ]
    pmOperation = testResponseHeaderContent(contentTests, pmOperation)
    const pmTest = pmOperation.getTests()
    expect(pmTest.script.exec).toMatchSnapshot()
  })

  it('should add content header test for property check & result has maximum zero length value', async () => {
    const contentTests = [
      {
        key: 'Operation-Location',
        maxLength: 0
      }
    ]
    pmOperation = testResponseHeaderContent(contentTests, pmOperation)
    const pmTest = pmOperation.getTests()
    expect(pmTest.script.exec).toMatchSnapshot()
  })

  it('should add content header test for property check empty value', async () => {
    const contentTests = [
      {
        key: 'Operation-Location',
        value: ''
      }
    ]
    pmOperation = testResponseHeaderContent(contentTests, pmOperation)
    const pmTest = pmOperation.getTests()
    expect(pmTest.script.exec).toMatchSnapshot()
  })

  it('should add content header test for property check & result matches oneOf values', async () => {
    const contentTests = [
      {
        key: 'Operation-Location',
        oneOf: ['Space-X', 'Tesla']
      }
    ]
    pmOperation = testResponseHeaderContent(contentTests, pmOperation)
    const pmTest = pmOperation.getTests()
    expect(pmTest.script.exec).toMatchSnapshot()
  })

  it('should not add content header test for a property & custom assert', async () => {
    const contentTests = [
      {
        key: 'Operation-Location',
        assert: 'should.be.not.null'
      }
    ]
    pmOperation = testResponseHeaderContent(contentTests, pmOperation)
    const pmTest = pmOperation.getTests()
    expect(pmTest.script.exec).toMatchSnapshot()
  })

  it('should not add content header test for a property & unclean custom assert', async () => {
    const contentTests = [
      {
        key: 'Operation-Location',
        assert: '..should.be.not.null.'
      }
    ]
    pmOperation = testResponseHeaderContent(contentTests, pmOperation)
    const pmTest = pmOperation.getTests()
    expect(pmTest.script.exec).toMatchSnapshot()
  })

  it('should not add content header test for a property & single quotes custom assert', async () => {
    const contentTests = [
      {
        key: 'Operation-Location',
        assert: '..to.be.an("array")'
      }
    ]
    pmOperation = testResponseHeaderContent(contentTests, pmOperation)
    const pmTest = pmOperation.getTests()
    expect(pmTest.script.exec).toMatchSnapshot()
  })

  it('should not add content header test for a property & unclean single quotes custom assert', async () => {
    const contentTests = [
      {
        key: 'Operation-Location',
        assert: `..to.be.an('array')`
      }
    ]
    pmOperation = testResponseHeaderContent(contentTests, pmOperation)
    const pmTest = pmOperation.getTests()
    expect(pmTest.script.exec).toMatchSnapshot()
  })

  it('should not add content header test for a property when assert is empty', async () => {
    const contentTests = [
      {
        key: 'Operation-Location',
        assert: ''
      }
    ]
    pmOperation = testResponseHeaderContent(contentTests, pmOperation)
    const pmTest = pmOperation.getTests()
    expect(pmTest.script.exec).toMatchSnapshot()
  })
})
