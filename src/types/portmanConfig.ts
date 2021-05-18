export type GlobalReplacement = {
  searchFor: string
  replaceWith: string
}

export type PortmanConfig = {
  preRequestScripts: string[]
  variableOverwrites: Record<string, string>
  globalReplacements: GlobalReplacement[]
  orderOfOperations: string[]
}
