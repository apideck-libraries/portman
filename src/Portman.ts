import { camelCase } from 'camel-case'
import chalk from 'chalk'
import fs from 'fs-extra'
import emoji from 'node-emoji'
import path from 'path'
import { Collection, CollectionDefinition } from 'postman-collection'
import { CollectionWriter, runNewmanWith, TestSuite, writeNewmanEnv } from './application'
import { clearTmpDirectory, execShellCommand, getConfig } from './lib'
import { OpenApiParser } from './oas'
import { PostmanParser } from './postman'
import {
  DownloadService,
  IOpenApiToPostmanConfig,
  OpenApiToPostmanService,
  PostmanService
} from './services'
import { PortmanConfig } from './types'
import { PortmanOptions } from './types/PortmanOptions'

export class Portman {
  config: PortmanConfig
  options: PortmanOptions
  oasParser: OpenApiParser
  postmanParser: PostmanParser
  postmanCollection: Collection
  portmanCollection: CollectionDefinition
  testSuite: TestSuite
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
    await this.injectVariationTests()
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
        portmanConfigPath,
        postmanConfigFile,
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
        portmanConfigFile ? portmanConfigFile : 'portman-config.default.json'
      }}`
    )
    console.log(
      chalk`{cyan  Postman Config: } \t{green ${
        postmanConfigFile ? postmanConfigFile : 'postman-config.default.json'
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

    this.config = await getConfig(portmanConfigPath)
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
    const { postmanConfigPath, localPostman } = this.options

    const oaToPostman = new OpenApiToPostmanService()
    // TODO investigate better way to keep oasParser untouched
    // Clone oasParser to prevent altering with added minItems maxItems
    const { oas } = this.oasParser
    const oaToPostmanConfig: IOpenApiToPostmanConfig = {
      openApiObj: { ...oas },
      outputFile: `${process.cwd()}/tmp/working/tmpCollection.json`,
      configFile: postmanConfigPath as string
    }

    if (localPostman) {
      try {
        const postmanJson = path.resolve(localPostman)
        this.postmanCollection = new Collection(
          JSON.parse(fs.readFileSync(postmanJson, 'utf8').toString())
        )
      } catch (err) {
        throw new Error(`Loading ${localPostman} failed.`)
      }
    } else {
      this.postmanCollection = await oaToPostman.convert(oaToPostmanConfig).catch(err => {
        console.log('error: ', err)
        throw new Error(`Postman Collection generation failed.`)
      })
    }

    this.postmanParser = new PostmanParser({
      postmanObj: this.postmanCollection,
      oasParser: this.oasParser
    })
    this.portmanCollection = this.postmanParser.collection.toJSON()
  }

  async injectTestSuite(): Promise<void> {
    const {
      config,
      options: { includeTests },
      oasParser,
      postmanParser
    } = this

    if (includeTests) {
      const testSuite = new TestSuite({ oasParser, postmanParser, config })
      // Inject automated tests
      testSuite.generateContractTests()

      // Inject content tests
      testSuite.injectContentTests()

      // Inject variable assignment
      testSuite.injectAssignVariables()

      // Inject postman extended tests
      testSuite.injectExtendedTests()

      // Inject overwrites
      testSuite.injectOverwrites()

      this.testSuite = testSuite
      this.portmanCollection = testSuite.collection.toJSON()
    }
  }

  async injectVariationTests(): Promise<void> {
    const {
      options: { includeTests },
      testSuite
    } = this

    if (includeTests && testSuite) {
      // Inject variations
      testSuite.generateVariationTests()

      this.portmanCollection = testSuite.collection.toJSON()
    }
  }

  async runPortmanOverrides(): Promise<void> {
    // --- Portman - Overwrite Postman variables & values
    const { config, options, portmanCollection } = this
    const collectionWriter = new CollectionWriter(config, options, portmanCollection)
    collectionWriter.execute()

    this.portmanCollection = collectionWriter.collection
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
