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

  it('should add content test for property check & empty value', async () => {
    const contentTests = [
      {
        key: 'data[0].monetary_amount',
        value: ''
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

  it('should add content test for property check that does not exist', async () => {
    const contentTests = [
      {
        key: 'data[0].monetary_amount',
        notExist: true
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

  it('should add content test for property check & result has zero length value', async () => {
    const contentTests = [
      {
        key: 'data[0].description',
        length: 0
      }
    ]
    pmOperation = testResponseBodyContent(contentTests, pmOperation)
    const pmTest = pmOperation.getTests()
    expect(pmTest.script.exec).toMatchSnapshot()
  })

  it('should add content test for property check & result has zero minimum length value', async () => {
    const contentTests = [
      {
        key: 'data[0].description',
        minLength: 0
      }
    ]
    pmOperation = testResponseBodyContent(contentTests, pmOperation)
    const pmTest = pmOperation.getTests()
    expect(pmTest.script.exec).toMatchSnapshot()
  })

  it('should add content test for property check & result has zero maximum length value', async () => {
    const contentTests = [
      {
        key: 'data[0].description',
        maxLength: 0
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

  it('should add content test for root array property check & result has maximum length value', async () => {
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

  it('should add content test for bracket property check & result has minimum length value', async () => {
    const contentTests = [
      {
        key: "data['hydra:member']",
        minLength: 1
      }
    ]

    pmOperation = testResponseBodyContent(contentTests, pmOperation)
    const pmTest = pmOperation.getTests()
    expect(pmTest.script.exec).toMatchSnapshot()
  })

  it('should add content test for bracket array property check & result has minimum length value', async () => {
    const contentTests = [
      {
        key: "[0].['hydra:member']",
        minLength: 1
      }
    ]

    pmOperation = testResponseBodyContent(contentTests, pmOperation)
    const pmTest = pmOperation.getTests()
    expect(pmTest.script.exec).toMatchSnapshot()
  })

  it('should add content test for array bracket check & result has minimum length value', async () => {
    const contentTests = [
      {
        key: "[0]['hydra:member']",
        minLength: 1
      }
    ]

    pmOperation = testResponseBodyContent(contentTests, pmOperation)
    const pmTest = pmOperation.getTests()
    expect(pmTest.script.exec).toMatchSnapshot()
  })

  it('should add content test for array bracket check & result for a value that does not exist', async () => {
    const contentTests = [
      {
        key: "[0]['hydra:member']",
        notExist: true
      }
    ]

    pmOperation = testResponseBodyContent(contentTests, pmOperation)
    const pmTest = pmOperation.getTests()
    expect(pmTest.script.exec).toMatchSnapshot()
  })

  it('should add content test for root array property check & result oneOf value', async () => {
    const contentTests = [
      {
        key: '[0].data.name',
        oneOf: ['Spacex', 'Tesla']
      }
    ]
    pmArrayOperation = testResponseBodyContent(contentTests, pmOperation)
    const pmTest = pmArrayOperation.getTests()
    expect(pmTest.script.exec).toMatchSnapshot()
  })

  it('should add content test for string for property check & oneOf string values', async () => {
    const contentTests = [
      {
        key: 'data[0].company_name',
        oneOf: ['Spacex', 'Tesla']
      }
    ]
    pmOperation = testResponseBodyContent(contentTests, pmOperation)
    const pmTest = pmOperation.getTests()
    expect(pmTest.script.exec).toMatchSnapshot()
  })

  it('should add content test for string for property check & oneOf boolean values', async () => {
    const contentTests = [
      {
        key: 'data[0].company_name',
        oneOf: [true, false]
      }
    ]
    pmOperation = testResponseBodyContent(contentTests, pmOperation)
    const pmTest = pmOperation.getTests()
    expect(pmTest.script.exec).toMatchSnapshot()
  })

  it('should add content test for property check & oneOf number values', async () => {
    const contentTests = [
      {
        key: 'status_code',
        oneOf: [200, 201]
      }
    ]
    pmOperation = testResponseBodyContent(contentTests, pmOperation)
    const pmTest = pmOperation.getTests()
    expect(pmTest.script.exec).toMatchSnapshot()
  })

  it('should add content test for a property & custom assert', async () => {
    const contentTests = [
      {
        key: '[0].data',
        assert: 'should.be.not.null'
      }
    ]
    pmArrayOperation = testResponseBodyContent(contentTests, pmOperation)
    const pmTest = pmArrayOperation.getTests()
    expect(pmTest.script.exec).toMatchSnapshot()
  })

  it('should add content test for a property & unclean custom assert', async () => {
    const contentTests = [
      {
        key: '[0].data',
        assert: '..should.be.not.null.'
      }
    ]
    pmArrayOperation = testResponseBodyContent(contentTests, pmOperation)
    const pmTest = pmArrayOperation.getTests()
    expect(pmTest.script.exec).toMatchSnapshot()
  })

  it('should add content test for a property & single quotes custom assert', async () => {
    const contentTests = [
      {
        key: '[0].data',
        assert: '..to.be.an("array")'
      }
    ]
    pmArrayOperation = testResponseBodyContent(contentTests, pmOperation)
    const pmTest = pmArrayOperation.getTests()
    expect(pmTest.script.exec).toMatchSnapshot()
  })

  it('should add content test for a property & unclean single quotes custom assert', async () => {
    const contentTests = [
      {
        key: '[0].data',
        assert: `..to.be.an('array')`
      }
    ]
    pmArrayOperation = testResponseBodyContent(contentTests, pmOperation)
    const pmTest = pmArrayOperation.getTests()
    expect(pmTest.script.exec).toMatchSnapshot()
  })

  it('should not add content test for a property when assert is empty', async () => {
    const contentTests = [
      {
        key: '[0].data',
        assert: ''
      }
    ]
    pmArrayOperation = testResponseBodyContent(contentTests, pmOperation)
    const pmTest = pmArrayOperation.getTests()
    expect(pmTest.script.exec).toMatchSnapshot()
  })
})
