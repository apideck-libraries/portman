import { NewmanRunOptions } from 'newman'

export interface PortmanOptions {
  url?: string
  local?: string
  baseUrl?: string
  output?: string
  runNewman?: boolean
  newmanIterationData?: string
  newmanRunOptions?: string | Partial<NewmanRunOptions>
  newmanOptionsFile?: string
  postmanUid?: string
  postmanWorkspaceName?: string
  localPostman?: string
  uploadOnly?: boolean
  syncPostman?: boolean
  includeTests?: boolean
  bundleContractTests?: boolean
  portmanConfigFile?: string
  portmanConfigPath?: string
  postmanConfigFile?: string
  postmanConfigPath?: string
  filterFile?: string
  oaOutput?: string
  envFile?: string
  cliOptionsFile?: string
  oaLocal?: string
  oaUrl?: string
  init?: boolean
}
