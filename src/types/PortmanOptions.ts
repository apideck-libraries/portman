export interface PortmanOptions {
  url?: string
  local?: string
  baseUrl?: string
  output?: string
  runNewman?: boolean
  newmanIterationData?: string
  postmanUid?: string
  localPostman?: string
  syncPostman?: boolean
  includeTests?: boolean
  portmanConfigFile?: string
  portmanConfigPath?: string
  postmanConfigFile?: string
  postmanConfigPath?: string
  filterFile?: string
  envFile?: string
  cliOptionsFile?: string
  oaLocal?: string
  oaUrl?: string
  init?: boolean
}
