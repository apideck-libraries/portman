import { PortmanTestType } from './PortmanConstants'

export type PortmanReqTestType = {
  postmanItemId?: string
  postmanName?: string
  reqTestType?: PortmanTestType
}

export interface PortmanTestSuite {
  pmReqTestType?: PortmanReqTestType
}
