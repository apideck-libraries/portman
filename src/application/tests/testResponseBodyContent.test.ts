import {
  getPostmanMappedListArrayOperation,
  getPostmanMappedOperation
} from '../../../__tests__/testUtils/getPostmanMappedOperation'
import { testResponseBodyContent } from '../../application'
import { PostmanMappedOperation } from '../../postman'

describe('testResponseBodyContent', () => {
  let pmOperation: PostmanMappedOperation
  let pmArrayOperation: PostmanMappedOperation

  beforeEach(async () => {
    pmOperation = await getPostmanMappedOperation()
    pmArrayOperation = await getPostmanMappedListArrayOperation()
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

  it('should add content test for root array & result has minimum length value', async () => {
    const contentTests = [
      {
        key: '.',
        minLength: 1
      }
    ]
    pmArrayOperation = testResponseBodyContent(contentTests, pmArrayOperation)
    const pmTest = pmArrayOperation.getTests()
    expect(pmTest.script.exec).toMatchSnapshot()
  })

  it('should add content test for  root array & result has maximum length value', async () => {
    const contentTests = [
      {
        key: '.',
        maxLength: 10
      }
    ]
    pmArrayOperation = testResponseBodyContent(contentTests, pmArrayOperation)
    const pmTest = pmArrayOperation.getTests()
    expect(pmTest.script.exec).toMatchSnapshot()
  })

  it('should add content test for string for root array property check & string value', async () => {
    const contentTests = [
      {
        key: '[0].company_name',
        value: 'Spacex'
      }
    ]
    pmArrayOperation = testResponseBodyContent(contentTests, pmOperation)
    const pmTest = pmArrayOperation.getTests()
    expect(pmTest.script.exec).toMatchSnapshot()
  })

  it('should add content test for string for root array property check & boolean value', async () => {
    const contentTests = [
      {
        key: '[0].data.company_name',
        value: true
      }
    ]
    pmArrayOperation = testResponseBodyContent(contentTests, pmOperation)
    const pmTest = pmArrayOperation.getTests()
    expect(pmTest.script.exec).toMatchSnapshot()
  })

  it('should add content test for root array property check & number value', async () => {
    const contentTests = [
      {
        key: '[0].data.monetary_amount',
        value: 75000
      }
    ]
    pmArrayOperation = testResponseBodyContent(contentTests, pmOperation)
    const pmTest = pmArrayOperation.getTests()
    expect(pmTest.script.exec).toMatchSnapshot()
  })

  it('should add content test for root array property check without value', async () => {
    const contentTests = [
      {
        key: '[0].data.monetary_amount'
      }
    ]
    pmArrayOperation = testResponseBodyContent(contentTests, pmOperation)
    const pmTest = pmArrayOperation.getTests()
    expect(pmTest.script.exec).toMatchSnapshot()
  })

  it('should add content test for root array property check & pm variable value', async () => {
    const contentTests = [
      {
        key: '[0].data.monetary_amount',
        value: '{{postman_env_variable}}'
      }
    ]
    pmArrayOperation = testResponseBodyContent(contentTests, pmOperation)
    const pmTest = pmArrayOperation.getTests()
    expect(pmTest.script.exec).toMatchSnapshot()
  })

  it('should add content test for root array property check & result contains value', async () => {
    const contentTests = [
      {
        key: '[0].data.name',
        contains: 'Musk'
      }
    ]
    pmArrayOperation = testResponseBodyContent(contentTests, pmOperation)
    const pmTest = pmArrayOperation.getTests()
    expect(pmTest.script.exec).toMatchSnapshot()
  })

  it('should add content test for root array property check & result contains pm variable value', async () => {
    const contentTests = [
      {
        key: '[0].data.monetary_amount',
        contains: '{{postman_env_variable}}'
      }
    ]
    pmArrayOperation = testResponseBodyContent(contentTests, pmOperation)
    const pmTest = pmArrayOperation.getTests()
    expect(pmTest.script.exec).toMatchSnapshot()
  })

  it('should add content test for root array property check & result has length value', async () => {
    const contentTests = [
      {
        key: '[0].data.description',
        length: 9
      }
    ]
    pmArrayOperation = testResponseBodyContent(contentTests, pmOperation)
    const pmTest = pmArrayOperation.getTests()
    expect(pmTest.script.exec).toMatchSnapshot()
  })

  it('should add content test for root array property check & result has minimum length value', async () => {
    const contentTests = [
      {
        key: '[0].data',
        minLength: 1
      }
    ]
    pmArrayOperation = testResponseBodyContent(contentTests, pmOperation)
    const pmTest = pmArrayOperation.getTests()
    expect(pmTest.script.exec).toMatchSnapshot()
  })

  it('should add content test forroot array property check & result has maximum length value', async () => {
    const contentTests = [
      {
        key: '[0].data',
        maxLength: 10
      }
    ]
    pmArrayOperation = testResponseBodyContent(contentTests, pmOperation)
    const pmTest = pmArrayOperation.getTests()
    expect(pmTest.script.exec).toMatchSnapshot()
  })
})
