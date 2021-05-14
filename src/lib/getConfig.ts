import chalk from 'chalk'
import fs from 'fs-extra'
import { PortmanConfig } from 'src/types'

const defaultConfig: PortmanConfig = {
  preRequestScripts: [],
  variableOverwrites: {},
  globalReplacements: [],
  orderOfOperations: []
}

export const getConfig = async (configPath: string | undefined): Promise<PortmanConfig> => {
  let config = defaultConfig

  if (configPath && (await fs.pathExists(configPath))) {
    config = await import(`${__dirname}/../../${configPath}`)
  } else {
    console.log(chalk.red(`Config file not provided. Using empty default.`))
  }

  return config
}
