import chalk from 'chalk'
import fs from 'fs-extra'
import path from 'path'
import yaml from 'yaml'
import { PortmanConfig } from '../types'

export const getConfig = async (configPath: string | undefined): Promise<PortmanConfig> => {
  let config = {}

  if (configPath && (await fs.pathExists(path.resolve(configPath)))) {
    // Check if config is YAML file
    if (configPath.includes('.yaml') || configPath.includes('.yml')) {
      yaml.parse(fs.readFileSync(configPath, 'utf8'))
    } else {
      config = await import(path.resolve(configPath)).then(module => module.default)
    }
  }

  if (Object.entries(config).length === 0) {
    console.log(chalk.red(`Portman config file not provided.`))
  }

  return config
}
