/* eslint-disable @typescript-eslint/no-var-requires*/
// yarn ts-node ./src/index.ts -l ./src/specs/crm.yml
// yarn ts-node ./src/index.ts -u https://specs.apideck.com/crm.yml
import fs from 'fs-extra'
import path from 'path'
import { PortmanOptions } from 'types'
import yargs from 'yargs'
import { Portman } from './Portman'

require('dotenv').config()
;(async () => {
  let options = yargs
    .usage('Usage: -u <url> -l <local> -b <baseUrl> -t <includeTests>')
    .option('u', {
      alias: 'url',
      describe: 'URL of OAS to port to postman collection',
      type: 'string'
    })
    .option('l', {
      alias: 'local',
      describe: 'Use local OAS to port to postman collection',
      type: 'string'
    })
    .option('b', {
      alias: 'baseUrl',
      describe: 'Override spec baseUrl to use in test suite',
      type: 'string'
    })
    .option('o', {
      alias: 'output',
      describe: 'Write the Postman collection to an output file',
      type: 'string'
    })
    .option('n', {
      alias: 'runNewman',
      describe: 'Run newman on newly created collection',
      type: 'boolean'
    })
    .option('d', {
      alias: 'newmanIterationData',
      describe: 'Iteration data to run newman with newly created collection',
      type: 'string'
    })
    .option('p', {
      alias: 'postmanUid',
      describe: 'Collection ID to upload generated collection to postman',
      type: 'string'
    })
    .option('syncPostman', {
      alias: 'syncPostman',
      describe: 'Upload generated collection to postman',
      type: 'boolean'
    })
    .option('t', {
      alias: 'includeTests',
      describe: 'Inject test suite (default: true)',
      type: 'boolean'
    })
    .option('c', {
      alias: 'portmanConfigFile',
      describe: 'Path to portman-config.json',
      type: 'string'
    })
    .option('s', {
      alias: 'postmanConfigFile',
      describe: 'Path to postman-config.json',
      type: 'string'
    })
    .option('filterFile', {
      describe: 'Path to openapi-format-filter.json',
      type: 'string'
    })
    .option('envFile', {
      describe: 'Path to .env file to use for variable injection',
      type: 'string'
    })
    .option('cliOptionsFile', {
      // alias: 'cliOptionsFile',
      describe: 'Path to the file with the Portman CLI options',
      type: 'string'
    }).argv as PortmanOptions

  let cliOptions = {}
  if (options.cliOptionsFile) {
    try {
      const cliOptionsFilePath = path.resolve(options.cliOptionsFile)
      cliOptions = JSON.parse(await fs.readFile(cliOptionsFilePath, 'utf8'))
    } catch (err) {
      console.error(
        '\x1b[31m',
        'Portman CLI Config error - no such file or directory "' + options.cliOptionsFile + '"'
      )
      process.exit(0)
    }
  }

  // Merge CLI configuration file with CLI parameters
  options = { ...cliOptions, ...options }

  // Load all Portman CLI options & configuration files
  const oaUrl = options?.url || ''
  const oaLocal = options?.local || ''
  const baseUrl = options?.baseUrl || ''
  const includeTests = options?.includeTests ?? true
  const runNewman = options?.runNewman
  const newmanData = options?.newmanIterationData || ''
  const syncToPostman = options?.syncPostman || false
  const portmanConfigFile = options?.portmanConfigFile
  const portmanConfigPath =
    options?.portmanConfigFile || __dirname + '/../portman-config.default.json'
  const postmanConfigFile = options?.postmanConfigFile
  const postmanConfigPath =
    options?.postmanConfigFile || __dirname + '/../postman-config.default.json'
  const envFile = options?.envFile || '.env'
  const filterFile = options.filterFile

  const portman = new Portman({
    ...options,
    oaUrl,
    oaLocal,
    baseUrl,
    includeTests,
    runNewman,
    newmanIterationData: newmanData,
    syncPostman: syncToPostman,
    portmanConfigFile,
    portmanConfigPath,
    postmanConfigFile,
    postmanConfigPath,
    envFile,
    filterFile
  })

  portman.run()
})()
