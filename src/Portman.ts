import { camelCase } from 'camel-case'
import chalk from 'chalk'
import fs from 'fs-extra'
import emoji from 'node-emoji'
import path from 'path'
import { Collection, CollectionDefinition } from 'postman-collection'
import { PortmanOptions } from 'types/PortmanOptions'
import {
  DownloadService,
  IOpenApiToPostmanConfig,
  OpenApiParser,
  OpenApiToPostmanService,
  PostmanParser,
  PostmanService,
  TestSuiteService
} from './application'
import {
  cleanupTestSchemaDefs,
  clearTmpDirectory,
  execShellCommand,
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

export class Portman {
  options: PortmanOptions
  oasParser: OpenApiParser
  postmanParser: PostmanParser
  postmanCollection: Collection
  portmanCollection: CollectionDefinition
  consoleLine: string

  public collectionFile: string

  constructor(options: PortmanOptions) {
    this.options = options
    this.consoleLine = '='.repeat(process.stdout.columns - 80)
  }

  async run(): Promise<void> {
    await this.before()

    await this.parseOpenApiSpec()
    await this.convertToPostmanCollection()
    await this.injectTestSuite()
    await this.runPortmanOverrides()
    await this.writePortmanCollectionToFile()
    await this.runNewmanSuite()
    await this.syncCollectionToPostman()

    await this.after()
  }

  async before(): Promise<void> {
    const {
      consoleLine,
      options: {
        oaUrl,
        oaLocal,
        cliOptionsFile,
        portmanConfigFile,
        postmanConfigFile,
        testSuiteConfigFile,
        envFile,
        includeTests,
        runNewman,
        newmanIterationData,
        syncPostman
      }
    } = this
    // --- Portman - Show processing output
    console.log(chalk.red(consoleLine))

    oaUrl && console.log(chalk`{cyan  Remote Url: } \t\t{green ${oaUrl}}`)
    oaLocal && console.log(chalk`{cyan  Local Path: } \t\t{green ${oaLocal}}`)

    cliOptionsFile && console.log(chalk`{cyan  Portman CLI Config: } \t{green ${cliOptionsFile}}`)
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

    console.log(chalk`{cyan  Environment: } \t\t{green ${envFile}}`)
    console.log(chalk`{cyan  Inject Tests: } \t{green ${includeTests}}`)
    console.log(chalk`{cyan  Run Newman: } \t\t{green ${!!runNewman}}`)
    console.log(
      chalk`{cyan  Newman Iteration Data: }{green ${
        newmanIterationData ? newmanIterationData : false
      }}`
    )
    console.log(chalk`{cyan  Upload to Postman: } \t{green ${syncPostman}}  `)
    console.log(chalk.red(consoleLine))

    await fs.ensureDir('./tmp/working/')
    await fs.ensureDir('./tmp/converted/')
    await fs.ensureDir('./tmp/newman/')
  }

  async after(): Promise<void> {
    const { consoleLine, collectionFile } = this
    await clearTmpDirectory()
    console.log(chalk.green(consoleLine))

    console.log(
      emoji.get(':rocket:'),
      chalk`{cyan Collection written to:} {green ${collectionFile}}`,
      emoji.get(':rocket:')
    )

    console.log(chalk.green(consoleLine))
  }

  async parseOpenApiSpec(): Promise<void> {
    // --- OpenApi - Get OpenApi file locally or remote
    const { oaLocal, oaUrl, filterFile } = this.options

    let openApiSpec = oaUrl && (await new DownloadService().get(oaUrl))

    if (oaLocal) {
      try {
        const oaLocalPath = path.resolve(oaLocal)
        await fs.copyFile(oaLocalPath, './tmp/converted/spec.yml')
        openApiSpec = './tmp/converted/spec.yml'
      } catch (err) {
        console.error('\x1b[31m', 'Local OAS error - no such file or directory "' + oaLocal + '"')
        process.exit(0)
      }
    }

    if (!openApiSpec) {
      throw new Error(`Error initializing OpenApi Spec.`)
    }

    const specExists = await fs.pathExists(openApiSpec)

    if (!specExists) {
      throw new Error(`${openApiSpec} doesn't exist. `)
    }

    if (filterFile && (await fs.pathExists(filterFile))) {
      const openApiSpecPath = './tmp/converted/filtered.yml'

      await execShellCommand(
        `npx openapi-format ${openApiSpec} -o ${openApiSpecPath} --yaml --filterFile ${filterFile}`
      )
      openApiSpec = openApiSpecPath
    }

    const oasParser = new OpenApiParser()
    await oasParser
      .convert({
        inputFile: openApiSpec
      })
      .catch(err => {
        console.log('error: ', err)
        throw new Error(`Parsing ${openApiSpec} failed.`)
      })

    this.oasParser = oasParser
  }

  async convertToPostmanCollection(): Promise<void> {
    // --- openapi-to-postman - Transform OpenApi to Postman collection
    const { postmanConfigFile } = this.options

    const oaToPostman = new OpenApiToPostmanService()
    const oaToPostmanConfig: IOpenApiToPostmanConfig = {
      openApiObj: this.oasParser.oas,
      outputFile: `${process.cwd()}/tmp/working/tmpCollection.json`,
      configFile: postmanConfigFile as string
    }

    this.postmanCollection = await oaToPostman.convert(oaToPostmanConfig).catch(err => {
      console.log('error: ', err)
      throw new Error(`Postman Collection generation failed.`)
    })

    this.postmanParser = new PostmanParser({
      postmanObj: this.postmanCollection,
      oasParser: this.oasParser
    })
    this.portmanCollection = this.postmanParser.collection.toJSON()
  }

  async injectTestSuite(): Promise<void> {
    const {
      options: { includeTests, testSuiteConfigFile },
      oasParser,
      postmanParser
    } = this

    if (includeTests && testSuiteConfigFile) {
      const testSuite = new TestSuiteService({ oasParser, postmanParser, testSuiteConfigFile })
      // Inject automated tests
      testSuite.generateAutomatedTests()

      // Inject content tests
      testSuite.injectContentTests()

      // Inject overwrites
      testSuite.injectOverwriteRequest()

      this.portmanCollection = testSuite.collection.toJSON()
    }
  }

  async runPortmanOverrides(): Promise<void> {
    // --- Portman - Overwrite Postman variables & values
    const { portmanConfigFile, includeTests, envFile, baseUrl } = this.options

    const { variableOverwrites, preRequestScripts, globalReplacements, orderOfOperations } =
      await getConfig(portmanConfigFile)

    let collection = replaceVariables(this.portmanCollection, {
      ...variableOverwrites,
      limit: includeTests ? '3' : '20'
    })
    collection = replaceValues(['Bearer <token>', '<Bearer Token>'], '{{bearerToken}}', collection)
    collection = injectEnvVariables(collection, envFile, baseUrl)
    collection = overridePathParams(collection)
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

    this.portmanCollection = JSON.parse(collectionString)
  }

  async writePortmanCollectionToFile(): Promise<void> {
    // --- Portman - Write Postman collection to file
    const { output } = this.options
    const fileName = this?.portmanCollection?.info?.name || 'portman-collection'

    let postmanCollectionFile = `./tmp/converted/${camelCase(fileName)}.json`

    if (output) {
      postmanCollectionFile = output as string
      if (!postmanCollectionFile.includes('.json')) {
        console.error(
          '\x1b[31m',
          'Output file error - Only .json filenames are allowed for "' + postmanCollectionFile + '"'
        )
        process.exit(0)
      }
    }

    try {
      const collectionString = JSON.stringify(this.portmanCollection, null, 2)
      fs.writeFileSync(postmanCollectionFile, collectionString, 'utf8')
      this.collectionFile = postmanCollectionFile
    } catch (err) {
      console.error(
        '\x1b[31m',
        'Output file error - no such file or directory "' + postmanCollectionFile + '"'
      )
      process.exit(0)
    }
  }

  async runNewmanSuite(): Promise<void> {
    // --- Portman - Execute Newman tests
    const {
      consoleLine,
      options: { runNewman, baseUrl, newmanIterationData }
    } = this

    if (runNewman) {
      const fileName = this?.portmanCollection?.info?.name || 'portman-collection'
      const newmanEnvFile = `./tmp/newman/${fileName}-env.json`
      writeNewmanEnv(this.portmanCollection, newmanEnvFile)

      try {
        console.log(chalk.green(consoleLine))
        console.log(chalk`{cyan  Run Newman against: } {green ${baseUrl}}`)
        console.log(chalk.green(consoleLine))

        await runNewmanWith(this.collectionFile, newmanEnvFile, newmanIterationData)
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
  }

  async syncCollectionToPostman(): Promise<void> {
    // --- Portman - Upload Postman collection to Postman app
    const {
      portmanCollection,
      options: { syncPostman, postmanUid }
    } = this

    if (syncPostman) {
      const collectionIdentification = postmanUid || (portmanCollection?.info?.name as string)
      const postman = new PostmanService()
      if (postman.isGuid(collectionIdentification)) {
        await postman.updateCollection(portmanCollection, collectionIdentification)
      } else {
        const remoteCollection = (await postman.findCollectionByName(
          collectionIdentification
        )) as Record<string, unknown>

        if (remoteCollection?.uid) {
          await postman.updateCollection(portmanCollection, remoteCollection.uid as string)
        } else {
          await postman.createCollection(portmanCollection)
        }
      }
    }
  }
}
