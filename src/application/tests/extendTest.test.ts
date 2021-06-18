import { getPostmanMappedCreateOperation } from '../../../__tests__/testUtils/getPostmanMappedOperation'
import { extendTest, testResponseStatusSuccess } from '../../application'
import { PostmanMappedOperation } from '../../postman'

describe('extendTest', () => {
  let pmOperation: PostmanMappedOperation

  beforeEach(async () => {
    pmOperation = await getPostmanMappedCreateOperation()
  })

  it('should add append test by prepended, overwrite', async () => {
    const extTestSetting = {
      openApiOperationId: 'leadsAdd',
      overwrite: true,
      append: false,
      tests: [
        "pm.test('200 ok', function(){pm.response.to.have.status(200);});",
        "pm.test('check userId after create', function(){Number.isInteger(responseBody);}); "
      ]
    }
    pmOperation = testResponseStatusSuccess(pmOperation)
    pmOperation = extendTest(extTestSetting, pmOperation)
    const pmTest = pmOperation.getTests()
    expect(pmTest.script.exec).toMatchSnapshot()
  })

  it('should add append test by prepended, no overwrite', async () => {
    const extTestSetting = {
      openApiOperationId: 'leadsAdd',
      append: false,
      tests: [
        "pm.test('200 ok', function(){pm.response.to.have.status(200);});",
        "pm.test('check userId after create', function(){Number.isInteger(responseBody);}); "
      ]
    }
    pmOperation = testResponseStatusSuccess(pmOperation)
    pmOperation = extendTest(extTestSetting, pmOperation)
    const pmTest = pmOperation.getTests()
    expect(pmTest.script.exec).toMatchSnapshot()
  })

  it('should add append test by appended, no overwrite', async () => {
    const extTestSetting = {
      openApiOperationId: 'leadsAdd',
      tests: [
        "pm.test('200 ok', function(){pm.response.to.have.status(200);});",
        "pm.test('check userId after create', function(){Number.isInteger(responseBody);}); "
      ]
    }
    pmOperation = testResponseStatusSuccess(pmOperation)
    pmOperation = extendTest(extTestSetting, pmOperation)
    const pmTest = pmOperation.getTests()
    expect(pmTest.script.exec).toMatchSnapshot()
  })
})
