import chalk from 'chalk'
import * as Either from 'fp-ts/lib/Either'
import fs from 'fs-extra'
import path from 'path'
import { PortmanConfig } from '../types'
import { parsePortmanConfig } from '../utils/PortmanConfig.parse'
import { OpenApiFormatter } from 'oas'

export const getConfig = async (
  configPath: string | undefined
): Promise<Either.Either<Record<string, unknown>, PortmanConfig>> => {
  let config = {} as PortmanConfig
  const oaf = new OpenApiFormatter()

  if (configPath && (await fs.pathExists(path.resolve(configPath)))) {
    config = (await oaf.parseFile(configPath)) as PortmanConfig
  }

  if (Object.entries(config).length === 0) {
    console.log(chalk.red(`Portman config file not provided.`))
  }

  // Dereference config
  return parsePortmanConfig(config)
}
