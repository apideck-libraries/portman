import {
  getPostmanMappedCreateOperation,
  getPostmanMappedOperation
} from '../../../__tests__/testUtils/getPostmanMappedOperation'
import { overwriteRequestPathIdVariables } from './overwriteRequestPathIdVariables'

describe('overwriteRequestPathIdVariables', () => {
  it('should overwrite the request path id variable with resource name', async () => {
    const overwriteValues = [
      {
        enabled: true
      }
    ]
    const pmOperation = await getPostmanMappedOperation()
    const result = overwriteRequestPathIdVariables(overwriteValues, pmOperation)
    expect(result.item.request.url.variables).toMatchSnapshot()
  })

  it('should return unaltered if id not found', async () => {
    const overwriteValues = [
      {
        enabled: true
      }
    ]

    const pmOperation = await getPostmanMappedCreateOperation()
    const result = overwriteRequestPathIdVariables(overwriteValues, pmOperation)

    expect(result.item.request.url.variables).toEqual(pmOperation.item.request.url.variables)
  })
})
