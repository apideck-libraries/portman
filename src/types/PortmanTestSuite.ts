import { PortmanTestType } from './PortmanTestTypes'

export type PortmanReqTestType = {
  postmanItemId?: string
  postmanName?: string
  reqTestType?: PortmanTestType
}

export interface PortmanTestSuite {
  pmReqTestType?: PortmanReqTestType
}
export interface Track {
  openApiOperationIds: string[]
  openApiOperations: string[]
}
