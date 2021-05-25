export interface PortmanOptions {
  url?: string
  local?: string
  baseUrl?: string
  output?: string
  runNewman?: boolean
  newmanIterationData?: string
  postmanUid?: string
  syncPostman?: boolean
  includeTests?: boolean
  portmanConfigFile?: string
  postmanConfigFile?: string
  testSuiteConfigFile?: string
  cliOptionsFile?: string
}
