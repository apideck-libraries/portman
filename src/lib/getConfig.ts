import chalk from 'chalk'
import fs from 'fs-extra'
import path from 'path'
import yaml from 'yaml'
import { PortmanConfig } from '../types'
import { parsePortmanConfig } from '../utils/PortmanConfig.parse'

export const getConfig = async (configPath: string | undefined): Promise<PortmanConfig> => {
  let config = {} as PortmanConfig

  if (configPath && (await fs.pathExists(path.resolve(configPath)))) {
    // Check if config is YAML file
    if (configPath.includes('.yaml') || configPath.includes('.yml')) {
      const configFile = fs.readFileSync(configPath, 'utf8')
      config = await yaml.parse(configFile)
    } else {
      config = await import(path.resolve(configPath)).then(module => module.default)
    }
  }

  if (Object.entries(config).length === 0) {
    console.log(chalk.red(`Portman config file not provided.`))
  }

  // Dereference config
  config = await parsePortmanConfig(config)

  return config
}
