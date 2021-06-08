import { getPostmanMappedOperation } from '../../../__tests__/getPostmanMappedOperation'
import { checkForContentInResponseBody } from './checkForContentInResponseBody'
import { OpenApiParser, PostmanParser, TestSuiteService } from '../../application'
import fs from 'fs-extra'
import { PostmanMappedOperation } from '../postman/PostmanMappedOperation'

describe('checkForContentInResponseBody', () => {
  let postmanParser: PostmanParser
  let oasParser: OpenApiParser
  let testSuiteService: TestSuiteService
  let pmOperation: PostmanMappedOperation

  const postmanJson = '__tests__/fixtures/crm.postman.json'
  const oasYml = '__tests__/fixtures/crm.yml'
  const testSuiteConfigFile = '__tests__/fixtures/postman-testsuite.crm.json'

  beforeEach(async () => {
    oasParser = new OpenApiParser()
    await oasParser.convert({ inputFile: oasYml })
    const postmanObj = JSON.parse(fs.readFileSync(postmanJson).toString())
    postmanParser = new PostmanParser({ postmanObj: postmanObj, oasParser: oasParser })

    testSuiteService = new TestSuiteService({ oasParser, postmanParser, testSuiteConfigFile })
    pmOperation = await getPostmanMappedOperation()
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should add content test for string for property check & string value', async () => {
    const context: TestSuiteService = testSuiteService
    const contentTests = [
      {
        key: 'data[0].company_name',
        value: 'Spacex'
      }
    ]
    pmOperation = checkForContentInResponseBody(contentTests, pmOperation, context)
    const pmTest = pmOperation.getTests()
    expect(pmTest.script.exec).toMatchSnapshot()
  })

  it('should add content test for string for property check & boolean value', async () => {
    const context: TestSuiteService = testSuiteService
    const contentTests = [
      {
        key: 'data[0].company_name',
        value: true
      }
    ]
    pmOperation = checkForContentInResponseBody(contentTests, pmOperation, context)
    const pmTest = pmOperation.getTests()
    expect(pmTest.script.exec).toMatchSnapshot()
  })

  it('should add content test for property check & number value', async () => {
    const context: TestSuiteService = testSuiteService
    const contentTests = [
      {
        key: 'data[0].monetary_amount',
        value: 75000
      }
    ]
    pmOperation = checkForContentInResponseBody(contentTests, pmOperation, context)
    const pmTest = pmOperation.getTests()
    expect(pmTest.script.exec).toMatchSnapshot()
  })

  it('should add content test for property check without value', async () => {
    const context: TestSuiteService = testSuiteService
    const contentTests = [
      {
        key: 'data[0].monetary_amount'
      }
    ]
    pmOperation = checkForContentInResponseBody(contentTests, pmOperation, context)
    const pmTest = pmOperation.getTests()
    expect(pmTest.script.exec).toMatchSnapshot()
  })

  it('should add content test for property check & pm variable value', async () => {
    const context: TestSuiteService = testSuiteService
    const contentTests = [
      {
        key: 'data[0].monetary_amount',
        value: '{{postman_env_variable}}'
      }
    ]
    pmOperation = checkForContentInResponseBody(contentTests, pmOperation, context)
    const pmTest = pmOperation.getTests()
    expect(pmTest.script.exec).toMatchSnapshot()
  })
})
