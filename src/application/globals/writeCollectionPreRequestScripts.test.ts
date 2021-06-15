import { getPostmanCollection } from '../../../__tests__/testUtils/getPostmanCollection'
import { writeCollectionPreRequestScripts } from '../../application'

describe('writeCollectionPreRequestScripts', () => {
  it('should inject the configured PreRequestScripts on collection', () => {
    const collection = getPostmanCollection().toJSON()

    const collectionPrequestScripts = [
      'pm.request.headers.add({key: "header_name", value: "header_value" });\n',
      'pm.collectionVariables.set("applicationId", pm.iterationData.get("applicationId") || "1111");\n'
    ]
    const result = writeCollectionPreRequestScripts(collection, collectionPrequestScripts)
    expect(result?.event && result.event.map(({ script }) => script['exec'])).toMatchSnapshot()
  })
})
