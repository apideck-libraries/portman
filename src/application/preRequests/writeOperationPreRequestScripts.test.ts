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
})
