import { getOasMappedOperation } from '../../../__tests__/testUtils/getOasMappedOperation'
import { getPostmanMappedOperation } from '../../../__tests__/testUtils/getPostmanMappedOperation'
import { assignCollectionVariables } from '../../application'
import { OasMappedOperation } from '../../oas'
import { PostmanMappedOperation } from '../../postman'
import { AssignVariablesConfig, GlobalConfig, PortmanOptions } from '../../types'

describe('assignCollectionVariables', () => {
  let oaOperation: OasMappedOperation
  let pmOperation: PostmanMappedOperation
  let assignVariableConfig: AssignVariablesConfig
  let fixedValueCounter: string | number
  let options: PortmanOptions
  let globals: GlobalConfig

  beforeEach(async () => {
    pmOperation = await getPostmanMappedOperation()
    oaOperation = await getOasMappedOperation()

    assignVariableConfig = {
      collectionVariables: [
        {
          value: 'someValue'
        }
      ]
    } as AssignVariablesConfig
    fixedValueCounter = 0
    options = {} as PortmanOptions
    globals = {} as GlobalConfig
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should increment counter and call assignVarFromValue when varSetting.value is defined', () => {
    const result = assignCollectionVariables(
      pmOperation,
      oaOperation,
      assignVariableConfig,
      fixedValueCounter,
      options,
      globals
    )

    expect(result).toBe(1) // counter should be incremented
  })

  it('should not increment counter if it is not a number', () => {
    fixedValueCounter = 'not a number'

    const result = assignCollectionVariables(
      pmOperation,
      oaOperation,
      assignVariableConfig,
      fixedValueCounter,
      options,
      globals
    )

    expect(result).toBe(fixedValueCounter) // counter should not be incremented
  })

  it('should return fixedValueCounter if assignVariableConfig.collectionVariables is undefined', () => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    assignVariableConfig.collectionVariables = undefined

    const result = assignCollectionVariables(
      pmOperation,
      oaOperation,
      assignVariableConfig,
      fixedValueCounter,
      options,
      globals
    )

    expect(result).toBe(fixedValueCounter)
  })
})
