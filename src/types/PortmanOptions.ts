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
  postmanRefreshCache?: boolean
  postmanFastSync?: boolean
  localPostman?: string
  uploadOnly?: boolean
  syncPostman?: boolean
  ignoreCircularRefs?: boolean
  includeTests?: boolean
  bundleContractTests?: boolean
  portmanConfigFile?: string
  portmanConfigPath?: string
  postmanConfigFile?: string
  postmanConfigPath?: string
  filterFile?: string
  oaOutput?: string
  envFile?: string
  collectionName?: string
  cliOptionsFile?: string
  oaLocal?: string
  oaUrl?: string
  init?: boolean
  logAssignVariables?: boolean
}
