/* eslint-disable @typescript-eslint/no-var-requires*/
// yarn ts-node ./src/index.ts -l ./src/specs/crm.yml
// yarn ts-node ./src/index.ts -u https://specs.apideck.com/crm.yml
import { camelCase } from 'camel-case'
import chalk from 'chalk'
import fs from 'fs-extra'
import emoji from 'node-emoji'
import path from 'path'
import { CollectionDefinition } from 'postman-collection'
import { PortmanOptions } from 'types/PortmanOptions'
import yargs from 'yargs'
import { DownloadService } from './application/DownloadService'
import { OpenApiToPostmanService } from './application/OpenApiToPostmanService'
import { PostmanService } from './application/PostmanService'
import {
  cleanupTestSchemaDefs,
  clearTmpDirectory,
  disableOptionalParams,
  getConfig,
  injectEnvVariables,
  injectPreRequest,
  orderCollectionRequests,
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
    .option('g', {
      alias: 'testSuiteConfigFile',
      describe: 'Path to postman-testsuite.json',
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
  const oaUrl = (options.url as string) || ('' as string)
  const oaLocal = (options.local as string) || ('' as string)
  const baseUrl = (options.baseUrl as string) || ('' as string)
  const includeTests = options.includeTests ?? true
  const runNewman = options.runNewman
  const newmanData = (options.newmanIterationData as string) || ('' as string)
  const syncToPostman = options.syncPostman || false
  const portmanConfigFile =
    (options.portmanConfigFile as string) || ('portman-config.json' as string)
  const postmanConfigFile =
    (options.postmanConfigFile as string) || ('postman-config.json' as string)
  const testSuiteConfigFile =
    (options.testSuiteConfigFile as string) || ('postman-testsuite.json' as string)

  const { variableOverwrites, preRequestScripts, globalReplacements, orderOfOperations } =
    await getConfig(portmanConfigFile)

  // --- Portman - Show processing output
  const consoleLine = '='.repeat(process.stdout.columns - 80)
  console.log(chalk.red(consoleLine))

  oaUrl && console.log(chalk`{cyan  Remote Url: } \t\t{green ${oaUrl}}`)
  oaLocal && console.log(chalk`{cyan  Local Path: } \t\t{green ${oaLocal}}`)

  options.cliOptionsFile &&
    console.log(chalk`{cyan  Portman CLI Config: } \t{green ${options.cliOptionsFile}}`)
  console.log(
    chalk`{cyan  Portman Config: } \t{green ${
      portmanConfigFile ? portmanConfigFile : 'unspecified'
    }}`
  )
  console.log(
    chalk`{cyan  Postman Config: } \t{green ${
      postmanConfigFile ? postmanConfigFile : 'unspecified'
    }}`
  )
  console.log(
    chalk`{cyan  Testsuite Config: } \t{green ${
      testSuiteConfigFile ? testSuiteConfigFile : 'unspecified'
    }}`
  )
  console.log(chalk`{cyan  Inject Tests: } \t{green ${includeTests}}`)
  console.log(chalk`{cyan  Run Newman: } \t\t{green ${!!runNewman}}`)
  console.log(chalk`{cyan  Newman Iteration Data: }{green ${newmanData ? newmanData : false}}`)
  console.log(chalk`{cyan  Upload to Postman: } \t{green ${syncToPostman}}  `)
  console.log(chalk.red(consoleLine))

  await fs.ensureDir('./tmp/working/')
  await fs.ensureDir('./tmp/converted/')
  await fs.ensureDir('./tmp/newman/')

  // --- OpenApi - Get OpenApi file locally or remote
  if (oaLocal) {
    try {
      const oaLocalPath = path.resolve(oaLocal)
      await fs.copyFile(oaLocalPath, './tmp/converted/spec.yml')
    } catch (err) {
      console.error('\x1b[31m', 'Local OAS error - no such file or directory "' + oaLocal + '"')
      process.exit(0)
    }
  }

  const openApiSpec = oaLocal ? './tmp/converted/spec.yml' : await new DownloadService().get(oaUrl)
  const specExists = await fs.pathExists(openApiSpec)
  if (!specExists) {
    throw new Error(`Download failed. ${openApiSpec} doesn't exist. `)
  }

  // --- openapi-to-postman - Transform OpenApi to Postman collection, with optional test suite generation
  const tmpCollectionFile = `${process.cwd()}/tmp/working/tmpCollection.json`

  const oaToPostman = new OpenApiToPostmanService()
  const oaToPostmanConfig = {
    inputFile: openApiSpec,
    outputFile: tmpCollectionFile,
    prettyPrintFlag: true,
    configFile: postmanConfigFile,
    testSuite: includeTests || false,
    testsuiteFile: testSuiteConfigFile,
    testFlag: tmpCollectionFile
  }
  const collectionGenerated = await oaToPostman
    .convert(openApiSpec, oaToPostmanConfig)
    .catch(function (err) {
      console.log('error: ', err)
      throw new Error(`Collection generation failed.`)
    })

  // --- Portman - load generated Postman collection
  let collectionJson = {}
  try {
    collectionJson = collectionGenerated as CollectionDefinition
  } catch (err) {
    console.error('\x1b[31m', 'Collection generation failed ')
    process.exit(0)
  }

  // --- Portman - Overwrite Postman variables & values
  let collection = replaceVariables(collectionJson, {
    ...variableOverwrites,
    limit: includeTests ? '3' : '20'
  })
  collection = replaceValues(['Bearer <token>', '<Bearer Token>'], '{{bearerToken}}', collection)
  collection = injectEnvVariables(collection, baseUrl)
  collection = overridePathParams(collection)
  collection = disableOptionalParams(collection)
  collection = orderCollectionRequests(collection, orderOfOperations)

  // --- Portman - Set Postman pre-requests
  if (includeTests) {
    collection = skip501s(collection)
    collection = injectPreRequest(collection, preRequestScripts)
  }

  // --- Portman - Replace & clean-up Postman
  const collectionString = cleanupTestSchemaDefs(
    JSON.stringify(collection, null, 2),
    globalReplacements
  )

  // --- Portman - Write Postman collection to file
  let postmanCollectionFile = `./tmp/converted/${camelCase(collection.info.name)}.json`
  if (options?.output) {
    postmanCollectionFile = options.output as string
    if (!postmanCollectionFile.includes('.json')) {
      console.error(
        '\x1b[31m',
        'Output file error - Only .json filenames are allowed for "' + postmanCollectionFile + '"'
      )
      process.exit(0)
    }
  }

  try {
    fs.writeFileSync(postmanCollectionFile, collectionString, 'utf8')
    // info('Output file: ' + options.output)
  } catch (err) {
    console.error(
      '\x1b[31m',
      'Output file error - no such file or directory "' + postmanCollectionFile + '"'
    )
    process.exit(0)
  }

  // --- Portman - Execute Newman tests
  if (runNewman) {
    const newmanEnvFile = `./tmp/newman/${camelCase(collection.info.name)}-env.json`
    writeNewmanEnv(collection, newmanEnvFile)

    try {
      console.log(chalk.green(consoleLine))
      console.log(chalk`{cyan  Run Newman against: } {green ${baseUrl}}`)
      console.log(chalk.green(consoleLine))

      await runNewmanWith(postmanCollectionFile, newmanEnvFile, newmanData)
    } catch (error) {
      console.log(chalk.red(consoleLine))
      console.log(chalk.red(`Newman failed to run`))
      console.log(`\n`)
      console.log(error?.message)
      console.log(`\n`)
      console.log(chalk.red(consoleLine))
      process.exit(0)
    }
  }

  // --- Portman - Upload Postman collection to Postman app
  if (syncToPostman) {
    const collectionIdentification = options?.postmanUid || collection.info.name
    const postman = new PostmanService()
    if (postman.isGuid(collectionIdentification)) {
      await postman.updateCollection(JSON.parse(collectionString), collectionIdentification)
    } else {
      const pmColl = (await postman.findCollectionByName(collectionIdentification)) as Record<
        string,
        unknown
      >
      if (pmColl?.uid) {
        await postman.updateCollection(JSON.parse(collectionString), pmColl.uid as string)
      } else {
        await postman.createCollection(JSON.parse(collectionString))
      }
    }
  }

  await clearTmpDirectory()

  console.log(chalk.green(consoleLine))

  console.log(
    emoji.get(':rocket:'),
    chalk`{cyan Collection written to:} {green ${postmanCollectionFile}}`,
    emoji.get(':rocket:')
  )

  console.log(chalk.green(consoleLine))
})()
