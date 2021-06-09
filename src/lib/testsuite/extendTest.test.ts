import { OasMappedOperation, PostmanMappedOperation } from '..'
import { getPostmanMappedCreateOperation } from '../../../__tests__/getPostmanMappedOperation'
import { getOasMappedOperation } from '../../../__tests__/getOasMappedOperation'
import { extendTest } from './extendTest'
import { checkForResponseStatusSuccess } from './checkForResponseStatusSuccess'

describe('extendTest', () => {
  let oasOperation: OasMappedOperation
  let pmOperation: PostmanMappedOperation

  beforeEach(async () => {
    oasOperation = await getOasMappedOperation()
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
    pmOperation = checkForResponseStatusSuccess(pmOperation, oasOperation)
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
    pmOperation = checkForResponseStatusSuccess(pmOperation, oasOperation)
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
    pmOperation = checkForResponseStatusSuccess(pmOperation, oasOperation)
    pmOperation = extendTest(extTestSetting, pmOperation)
    const pmTest = pmOperation.getTests()
    expect(pmTest.script.exec).toMatchSnapshot()
  })
})
