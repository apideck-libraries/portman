import chalk from 'chalk'
import fs from 'fs-extra'
import path from 'path'
import { PortmanConfig } from '../types'

export const getConfig = async (configPath: string | undefined): Promise<PortmanConfig> => {
  let config = {}

  if (configPath && (await fs.pathExists(path.resolve(configPath)))) {
    config = await import(path.resolve(configPath))
  } else {
    console.log(chalk.red(`Portman config file not provided.`))
  }

  return config
}
