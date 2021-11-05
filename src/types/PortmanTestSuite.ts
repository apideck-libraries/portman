import { PortmanRequestType } from './PortmanConstants'

export type pmRequestType = {
  postmanItemId?: string
  postmanName?: string
  requestType?: PortmanRequestType
}

export interface PortmanTestSuite {
  pmRequestType?: pmRequestType
}
