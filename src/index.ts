/* eslint-disable @typescript-eslint/no-var-requires*/
// yarn ts-node ./src/index.ts -l ./src/specs/crm.yml
// yarn ts-node ./src/index.ts -u https://specs.apideck.com/crm.yml
import fs from 'fs-extra'
import path from 'path'
import { PortmanOptions } from 'types'
import yargs from 'yargs'
import { Portman } from './Portman'
import { promptInit } from './utils/promptInit'

require('dotenv').config()
;(async () => {
  let options = yargs
    .usage('Usage: -u <url> -l <local> -b <baseUrl> -t <includeTests>')
    .option('u', {
      alias: 'url',
      describe: 'URL of OAS to port to Postman collection',
      type: 'string'
    })
    .option('l', {
      alias: 'local',
      describe: 'Use local OAS to port to Postman collection',
      type: 'string'
    })
    .option('b', {
      alias: 'baseUrl',
      describe: 'Override spec baseUrl to use in Postman',
      type: 'string'
    })
    .option('o', {
      alias: 'output',
      describe: 'Write the Postman collection to an output file',
      type: 'string'
    })
    .option('n', {
      alias: 'runNewman',
      describe: 'Run Newman on newly created collection',
      type: 'boolean'
    })
    .option('d', {
      alias: 'newmanIterationData',
      describe: 'Iteration data to run Newman with newly created collection',
      type: 'string'
    })
    .option('p', {
      alias: 'postmanUid',
      describe: 'Collection UID to upload with generated Postman collection',
      type: 'string'
    })
    .option('syncPostman', {
      alias: 'syncPostman',
      describe: 'Upload generated collection to Postman',
      type: 'boolean'
    })
    .option('t', {
      alias: 'includeTests',
      describe: 'Inject Portman test suite (default: true)',
      type: 'boolean'
    })
    .option('c', {
      alias: 'portmanConfigFile',
      describe: 'Path to Portman settings config file (portman-config.json)n',
      type: 'string'
    })
    .option('s', {
      alias: 'postmanConfigFile',
      describe: 'Path to openapi-to-postman config file (postman-config.json)',
      type: 'string'
    })
    .option('filterFile', {
      describe: 'Path to openapi-format config file (oas-format-filter.json)',
      type: 'string'
    })
    .option('envFile', {
      describe: 'Path to the .env file to inject environment variables',
      type: 'string'
    })
    .option('cliOptionsFile', {
      // alias: 'cliOptionsFile',
      describe: 'Path to Portman CLI options file',
      type: 'string'
    })
    .option('init', {
      // alias: 'cliOptionsFile',
      describe: 'Initialize Portman and generate a Portman CLI configuration file',
      type: 'boolean'
    }).argv as PortmanOptions

  let cliOptions = {}

  if (options.init) {
    console.log(
      '\x1b[32m',
      `
    ██████╗  ██████╗ ██████╗ ████████╗███╗   ███╗ █████╗ ███╗   ██╗
    ██╔══██╗██╔═══██╗██╔══██╗╚══██╔══╝████╗ ████║██╔══██╗████╗  ██║
    ██████╔╝██║   ██║██████╔╝   ██║   ██╔████╔██║███████║██╔██╗ ██║
    ██╔═══╝ ██║   ██║██╔══██╗   ██║   ██║╚██╔╝██║██╔══██║██║╚██╗██║
    ██║     ╚██████╔╝██║  ██║   ██║   ██║ ╚═╝ ██║██║  ██║██║ ╚████║
    ╚═╝      ╚═════╝ ╚═╝  ╚═╝   ╚═╝   ╚═╝     ╚═╝╚═╝  ╚═╝╚═╝  ╚═══╝

    `
    )
    await promptInit()
    process.exit()
  }

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
