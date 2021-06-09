import { getPostmanCollection } from '../../../__tests__/getPostmanCollection'
import { writeCollectionPreRequestScripts } from './writeCollectionPreRequestScripts'

describe('writeCollectionPreRequestScripts', () => {
  it('should inject the configured PreRequestScripts on collection', () => {
    const collection = getPostmanCollection()

    const collectionPrequestScripts = [
      'pm.request.headers.add({key: "header_name", value: "header_value" });\n',
      'pm.collectionVariables.set("applicationId", pm.iterationData.get("applicationId") || "1111");\n'
    ]
    const result = writeCollectionPreRequestScripts(collection, collectionPrequestScripts)
    expect(result.events.map(({ script }) => script?.exec)).toMatchSnapshot()
  })
})
