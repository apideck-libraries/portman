import { getPostmanMappedOperation } from '../../../__tests__/testUtils/getPostmanMappedOperation'
import { writeOperationPreRequestScripts } from './writeOperationPreRequestScripts'

describe('writeOperationPreRequestScripts', () => {
  it('should inject the configured PreRequestScripts on collection', async () => {
    const pmOperation = await getPostmanMappedOperation()

    const operationPreRequestScripts = [
      'pm.request.headers.add({key: "header_name", value: "header_value" });\n',
      'pm.collectionVariables.set("applicationId", pm.iterationData.get("applicationId") || "1111");\n'
    ]
    writeOperationPreRequestScripts([pmOperation], operationPreRequestScripts)
    expect(pmOperation.item.events.map(({ script }) => script['exec'])).toMatchSnapshot()
  })

  it('should inject the configured PreRequestScripts from file on collection', async () => {
    const pmOperation = await getPostmanMappedOperation()

    const operationPreRequestScripts = [
      'file:src/application/preRequests/__fixtures__/samplePreRequest1.js',
      'file:src/application/preRequests/__fixtures__/samplePreRequest2.js'
    ]
    writeOperationPreRequestScripts([pmOperation], operationPreRequestScripts)
    expect(pmOperation.item.events.map(({ script }) => script['exec'])).toMatchSnapshot()
  })
})
