import chalk from 'chalk'
import fs from 'fs-extra'
import path from 'path'
import { PortmanConfig } from 'src/types'

const defaultConfig: PortmanConfig = {
  preRequestScripts: [],
  variableOverwrites: {},
  globalReplacements: [],
  orderOfOperations: []
}

export const getConfig = async (configPath: string | undefined): Promise<PortmanConfig> => {
  let config = defaultConfig

  if (configPath && (await fs.pathExists(path.resolve(configPath)))) {
    config = await import(path.resolve(configPath))
  } else {
    console.log(chalk.red(`Portman config file not provided. Using empty default.`))
  }

  return config
}
