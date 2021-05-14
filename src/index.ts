/* eslint-disable @typescript-eslint/no-var-requires*/
// yarn ts-node ./src/index.ts -l ./src/specs/crm.yml
// yarn ts-node ./src/index.ts -u https://specs.apideck.com/crm.yml
import { camelCase } from 'camel-case'
import chalk from 'chalk'
import fs from 'fs-extra'
import path from 'path'
import emoji from 'node-emoji'
import { CollectionDefinition } from 'postman-collection'
import yargs from 'yargs'
import { DownloadService } from './application/DownloadService'
import { PostmanService } from './application/PostmanService'
import {
  cleanupTestSchemaDefs,
  clearTmpDirectory,
  disableOptionalParams,
  execShellCommand,
  getConfig,
  injectEnvVariables,
  injectPreRequest,
  overridePathParams,
  replaceValues,
  replaceVariables,
  runNewmanWith,
  skip501s,
  writeNewmanEnv
} from './lib'

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
    .option('g', {
      alias: 'testSuiteConfigFile',
      describe: 'Path to postman-testsuite.json',
      type: 'string'
    })
    .option('cliOptionsFile', {
      // alias: 'cliOptionsFile',
      describe: 'Path to the file with the Portman CLI options',
      type: 'string'
    })
    .argv

  let cliOptions = {}
  if (options.cliOptionsFile) {
    try {
      const cliOptionsFilePath = path.resolve(options.cliOptionsFile)
      cliOptions = JSON.parse(await fs.readFile(cliOptionsFilePath, 'utf8'))

      console.log(chalk.green(`=================================================================`))
      chalk`{cyan  Portman CLI Config: } {green ${options.cliOptionsFile}}`
      console.log(chalk.green(`=================================================================`))
    } catch (err) {
      console.error('\x1b[31m', 'Portman CLI Config error - no such file or directory "' + options.cliOptionsFile + '"')
      process.exit(0)
    }
  }

  // Merge CLI configuration file with CLI parameters
  options = { ...cliOptions, ...options }

  const oaUrl = options.url as string || '' as string
  const oaLocal = options.local as string || '' as string
  const baseUrl = options.baseUrl as string || '' as string
  const includeTests = options.includeTests ?? true
  const runNewman = options.runNewman
  const newmanData = options.newmanIterationData as string || '' as string
  const syncToPostman = !!options.postmanUid
  const collectionId = options.postmanUid as string
  const portmanConfigFile = options.portmanConfigFile as string || 'portman-config.json' as string
  const postmanConfigFile = options.postmanConfigFile as string || 'postman-config.json' as string
  const testSuiteConfigFile = options.testSuiteConfigFile as string || 'postman-testsuite.json' as string

  console.log('cliOptions', cliOptions)
  console.log('options', options)

  const { variableOverwrites, preRequestScripts, globalReplacements } = await getConfig(
    portmanConfigFile
  )

  console.log(
    chalk.red(`=================================================================
  `)
  )

  oaUrl && console.log(chalk`{cyan  Remote Url: } {green ${oaUrl}}`)
  oaLocal && console.log(chalk`{cyan  Local Path: } {green ${oaLocal}}`)

  console.log(
    chalk`{cyan  Portman Config: } {green ${portmanConfigFile ? portmanConfigFile : 'unspecified'}}`
  )
  console.log(
    chalk`{cyan  Postman Config: } {green ${postmanConfigFile ? postmanConfigFile : 'unspecified'}}`
  )
  console.log(
    chalk`{cyan  Testsuite Config: } {green ${
      testSuiteConfigFile ? testSuiteConfigFile : 'unspecified'
    }}`
  )
  console.log(chalk`{cyan  Inject Tests: } {green ${includeTests}}`)
  console.log(chalk`{cyan  Run Newman: } {green ${!!runNewman}}`)
  console.log(chalk`{cyan  Newman Iteration Data: } {green ${newmanData ? newmanData : false}}`)
  console.log(chalk`{cyan  Upload to Postman: } {green ${syncToPostman}}
  `)
  console.log(
    chalk.red(`=================================================================
  `)
  )

  await fs.ensureDir('./tmp/working/')
  await fs.ensureDir('./tmp/converted/')
  await fs.ensureDir('./tmp/newman/')

  if (oaLocal) {
    try {
      const oaLocalPath = path.resolve(oaLocal)
      await fs.copyFile(oaLocalPath, './tmp/converted/spec.yml')
    } catch (err) {
      console.error('\x1b[31m', 'Local OAS error - no such file or directory "' + oaLocal + '"')
      process.exit(0)
    }
  }

  const openApiSpec = (oaLocal) ? './tmp/converted/spec.yml' : await new DownloadService().get(oaUrl)

  const specExists = await fs.pathExists(openApiSpec)

  if (!specExists) {
    throw new Error(`Download failed. ${openApiSpec} doesn't exist. `)
  }

  const tmpCollectionFile = `${process.cwd()}/tmp/working/tmpCollection.json`

  const collectionGenerated = await execShellCommand(
    `openapi2postmanv2 -s ${openApiSpec} -o ${tmpCollectionFile} -p ${
      includeTests && `-g ${testSuiteConfigFile}`
    } -c ${postmanConfigFile}`
  )

  if (!collectionGenerated) {
    throw new Error(`Collection generation failed.`)
  }

  let collectionJson = {}
  try {
    collectionJson = require(`${tmpCollectionFile}`) as CollectionDefinition
  } catch (err) {
    console.error('\x1b[31m', 'Collection generation failed ')
    process.exit(0)
  }

  let collection = replaceVariables(collectionJson, {
    ...variableOverwrites,
    limit: includeTests ? '3' : '20'
  })
  collection = replaceValues(['Bearer <token>', '<Bearer Token>'], '{{bearerToken}}', collection)
  collection = injectEnvVariables(collection, baseUrl)
  collection = overridePathParams(collection)
  collection = disableOptionalParams(collection)

  if (includeTests) {
    collection = skip501s(collection)
    collection = injectPreRequest(collection, preRequestScripts)
  }

  const collectionString = cleanupTestSchemaDefs(
    JSON.stringify(collection, null, 2),
    globalReplacements
  )
  const postmanCollectionFile = `./tmp/converted/${camelCase(collection.info.name)}.json`

  fs.writeFileSync(postmanCollectionFile, collectionString)

  if (runNewman) {
    const newmanEnvFile = `./tmp/newman/${camelCase(collection.info.name)}-env.json`
    writeNewmanEnv(collection, newmanEnvFile)

    try {
      console.log(chalk.green(`=================================================================`))
      console.log(chalk`{cyan  Run Newman against: } {green ${baseUrl}}`)
      console.log(chalk.green(`=================================================================`))

      await runNewmanWith(postmanCollectionFile, newmanEnvFile, newmanData)
    } catch (error) {
      console.log(
        chalk.red(`=================================================================
      `)
      )
      console.log(chalk.red(`Newman failed to run`))
      console.log(`\n`)
      console.log(error?.message)
      console.log(`\n`)
      console.log(
        chalk.red(`=================================================================
      `)
      )
      process.exit(0)
    }
  }

  if (collectionId) {
    console.log('Uploading to Postman...')
    const postman = new PostmanService()
    await postman.updateCollection(JSON.parse(collectionString), collectionId)
  }

  await clearTmpDirectory()

  console.log(chalk.green(`=================================================================`))

  console.log(
    emoji.get(':rocket:'),
    chalk`{cyan Collection written to:} {green ${postmanCollectionFile}}`,
    emoji.get(':rocket:')
  )

  console.log(
    chalk.green(`=================================================================
  `)
  )
})()
