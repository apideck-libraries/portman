/* eslint-disable @typescript-eslint/no-var-requires*/
// yarn ts-node ./src/index.ts -l ./src/specs/crm.yml
// yarn ts-node ./src/index.ts -u https://specs.apideck.com/crm.yml
import fs from 'fs-extra'
import { NewmanRunOptions } from 'newman'
import path from 'path'
import { PortmanOptions } from 'types'
import yaml from 'yaml'
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
    .option('newmanRunOptions', {
      describe: 'JSON stringified object to pass options for configuring Newman',
      type: 'string'
    })
    .option('newmanOptionsFile', {
      describe: 'Path to Newman options file to pass options for configuring Newman',
      type: 'string'
    })
    .option('d', {
      alias: 'newmanIterationData',
      describe: 'Iteration data to run Newman with newly created collection',
      type: 'string'
    })
    .option('localPostman', {
      describe: 'Use local Postman collection, skips OpenAPI conversion',
      type: 'string'
    })
    .option('syncPostman', {
      alias: 'syncPostman',
      describe: 'Upload generated collection to Postman, after conversion',
      type: 'boolean'
    })
    .option('postmanFastSync', {
      describe: 'Postman sync creates new collection (new UID), instead of update',
      type: 'boolean'
    })
    .option('postmanRefreshCache', {
      describe: 'Postman sync will refresh all local cached Postman API data',
      type: 'boolean'
    })
    .option('p', {
      alias: 'postmanUid',
      describe: 'Postman collection UID to upload with the generated Postman collection',
      type: 'string'
    })
    .option('postmanWorkspaceName', {
      describe: 'Postman Workspace name to target the upload of the generated Postman collection',
      type: 'string'
    })
    .option('uploadOnly', {
      alias: 'uploadOnly',
      describe: 'Upload generated collection to Postman',
      type: 'boolean'
    })
    .option('ignoreCircularRefs', {
      alias: 'ignoreCircularRefs',
      describe: 'Ignore circular references in OpenAPI spec (default: false)',
      type: 'boolean'
    })
    .option('t', {
      alias: 'includeTests',
      describe: 'Inject Portman test suite (default: true)',
      type: 'boolean'
    })
    .option('bundleContractTests', {
      describe: 'Bundle Portman contract tests in a separate folder in Postman (default: false)',
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
    .option('oaOutput', {
      describe: 'Write the (filtered) OpenAPI file to an output file',
      type: 'string'
    })
    .option('collectionName', {
      describe: 'Overwrite OpenAPI title to set the Postman collection name',
      type: 'string'
    })
    .option('envFile', {
      describe: 'Path to the .env file to inject environment variables',
      type: 'string'
    })
    .option('cliOptionsFile', {
      describe: 'Path to Portman CLI options file',
      type: 'string'
    })
    .option('logAssignVariables', {
      describe: 'Toggle logging of assigned variables',
      type: 'boolean'
    })
    .option('init', {
      describe: 'Initialize Portman and generate a Portman CLI configuration file',
      type: 'boolean'
    })
    .option('extraUnknownFormats', {
      describe: 'Add extra unknown formats to json schema tests',
      type: 'array'
    }).argv as PortmanOptions

  let cliOptions: Partial<PortmanOptions> = {}

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
      // Check if cliOptionsFile is YAML file
      if (cliOptionsFilePath.includes('.yaml') || cliOptionsFilePath.includes('.yml')) {
        cliOptions = yaml.parse(fs.readFileSync(cliOptionsFilePath, 'utf8'))
      } else {
        cliOptions = JSON.parse(await fs.readFile(cliOptionsFilePath, 'utf8'))
      }
    } catch (err) {
      console.error(
        '\x1b[31m',
        'Portman CLI Config error - no such file or directory "' + options.cliOptionsFile + '"'
      )
      process.exit(1)
    }
  }

  cliOptions.newmanOptionsFile = options?.newmanOptionsFile
    ? options.newmanOptionsFile
    : cliOptions.newmanOptionsFile
  if (cliOptions.newmanOptionsFile) {
    try {
      const newmanOptionsFilePath = path.resolve(cliOptions.newmanOptionsFile)
      cliOptions.newmanRunOptions = JSON.parse(await fs.readFile(newmanOptionsFilePath, 'utf8'))
    } catch (err) {
      console.error(
        '\x1b[31m',
        'Newman Options error - no such file or directory "' + options.newmanOptionsFile + '"'
      )
      process.exit(1)
    }
  }

  if (options.newmanRunOptions) {
    try {
      const newmanRunOptionsArg = JSON.parse(options.newmanRunOptions as string)
      options.newmanRunOptions = cliOptions?.newmanRunOptions
        ? { ...(cliOptions.newmanRunOptions as NewmanRunOptions), ...newmanRunOptionsArg }
        : newmanRunOptionsArg
    } catch (error) {
      console.error('\x1b[31m', 'Portman CLI Config error - newmanRunOptions: ' + error + '"')
      process.exit(1)
    }
  }

  // Merge CLI configuration file with CLI parameters
  options = { ...cliOptions, ...options }

  // Load all Portman CLI options & configuration files
  const oaUrl = options?.url || ''
  const oaLocal = options?.local || ''
  const baseUrl = options?.baseUrl || ''
  const includeTests = options?.includeTests ?? true
  const bundleContractTests = options?.bundleContractTests ?? false
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
  const oaOutput = options.oaOutput || ''
  const collectionName = options.collectionName || ''
  const logAssignVariables = options?.logAssignVariables
  const extraUnknownFormats = options?.extraUnknownFormats || [];

  const portman = new Portman({
    ...options,
    oaUrl,
    oaLocal,
    baseUrl,
    includeTests,
    bundleContractTests,
    runNewman,
    newmanIterationData: newmanData,
    syncPostman: syncToPostman,
    portmanConfigFile,
    portmanConfigPath,
    postmanConfigFile,
    postmanConfigPath,
    envFile,
    filterFile,
    oaOutput,
    collectionName,
    logAssignVariables,
    extraUnknownFormats
  })

  if (options.uploadOnly) {
    // Upload only, skip all the rest
    await portman.uploadOnly()
  } else {
    // Run full portman conversion
    await portman.run()
  }
})()
