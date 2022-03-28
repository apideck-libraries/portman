import { camelCase } from 'camel-case'
import chalk from 'chalk'
import * as Either from 'fp-ts/lib/Either'
import fs from 'fs-extra'
import { NewmanRunOptions } from 'newman'
import emoji from 'node-emoji'
import path from 'path'
import { Collection, CollectionDefinition, Item, ItemGroup } from 'postman-collection'
import {
  CollectionWriter,
  IntegrationTestWriter,
  renamePostmanCollection,
  runNewmanWith,
  stripResponseExamples,
  TestSuite,
  VariationWriter,
  writeNewmanEnv,
  writeRawReplacements
} from './application'
import { clearTmpDirectory, execShellCommand, getConfig } from './lib'
import { OpenApiParser } from './oas'
import { PostmanParser } from './postman'
import {
  DownloadService,
  IOpenApiToPostmanConfig,
  OpenApiToPostmanService,
  PostmanSyncService
} from './services'
import { PortmanConfig, PortmanTestTypes } from './types'
import { PortmanOptions } from './types/PortmanOptions'
import { validate } from './utils/PortmanConfig.validator'
import { PortmanError } from './utils/PortmanError'

export class Portman {
  config: PortmanConfig
  options: PortmanOptions
  oasParser: OpenApiParser
  postmanParser: PostmanParser
  postmanCollection: Collection
  portmanCollection: CollectionDefinition
  testSuite: TestSuite
  variationWriter: VariationWriter
  integrationTestWriter: IntegrationTestWriter
  postmanSyncService: PostmanSyncService
  consoleLine: string

  public collectionFile: string

  constructor(options: PortmanOptions) {
    this.options = options
    this.consoleLine = process.stdout.columns ? '='.repeat(process.stdout.columns) : '='.repeat(80)
  }

  async run(): Promise<void> {
    await this.before()
    if (!this.config) return

    try {
      await this.parseOpenApiSpec()
    } catch (err) {
      const message = err.toString()
      const circularRef = message.includes('Circular $ref')
      console.log(chalk.red(message))
      if (circularRef) {
        const docLink = 'https://github.com/apideck-libraries/portman/tree/main/docs/ERRORS.md'
        console.log(chalk.red(`\nPlease see ${docLink} for more information about this error.`))
      }
      console.log(chalk.red(this.consoleLine))
      process.exit(1)
    }

    await this.convertToPostmanCollection()
    this.injectTestSuite()
    this.injectVariationTests()
    this.injectVariationOverwrites()
    this.injectIntegrationTests()
    this.moveContractTestsToFolder()
    this.writePortmanCollectionToFile()
    await this.runNewmanSuite()
    await this.syncCollectionToPostman()

    return await this.after()
  }

  async uploadOnly(): Promise<void> {
    const localPostman = this.options.output || ''
    if (localPostman === '') {
      throw new Error(`Loading ${localPostman} failed.`)
    }
    this.options.syncPostman = true

    await this.before()

    try {
      const postmanJson = path.resolve(localPostman)
      this.portmanCollection = new Collection(
        JSON.parse(fs.readFileSync(postmanJson, 'utf8').toString())
      )
      await this.syncCollectionToPostman()
    } catch (err) {
      throw new Error(`Loading ${localPostman} failed.`)
    }
  }

  async before(): Promise<void> {
    const {
      consoleLine,
      options: {
        oaUrl,
        oaLocal,
        output,
        cliOptionsFile,
        collectionName,
        portmanConfigFile,
        portmanConfigPath,
        postmanConfigFile,
        filterFile,
        oaOutput,
        envFile,
        ignoreCircularRefs,
        includeTests,
        bundleContractTests,
        runNewman,
        newmanIterationData,
        syncPostman
      }
    } = this

    // --- Portman - Show processing output
    console.log(chalk.red(consoleLine))

    oaUrl && console.log(chalk`{cyan  Remote Url: } \t\t{green ${oaUrl}}`)
    oaLocal && console.log(chalk`{cyan  Local Path: } \t\t{green ${oaLocal}}`)
    output && console.log(chalk`{cyan  Output Path: } \t\t{green ${output}}`)
    oaOutput && console.log(chalk`{cyan  OpenAPI Output Path: } \t{green ${oaOutput}}`)

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

    filterFile && console.log(chalk`{cyan  Filter Config: } \t{green ${filterFile}}`)

    console.log(chalk`{cyan  Environment: } \t\t{green ${envFile}}`)
    console.log(chalk`{cyan  Inject Tests: } \t{green ${includeTests}}`)
    bundleContractTests &&
      console.log(chalk`{cyan  Bundle Tests: } \t{green ${bundleContractTests}}`)
    console.log(chalk`{cyan  Run Newman: } \t\t{green ${!!runNewman}}`)
    console.log(
      chalk`{cyan  Newman Iteration Data: }{green ${
        newmanIterationData ? newmanIterationData : false
      }}`
    )
    console.log(chalk`{cyan  Upload to Postman: } \t{green ${syncPostman}}  `)

    collectionName && console.log(chalk`{cyan  OpenAPI title: } \t{green ${collectionName}}`)

    console.log(chalk.red(consoleLine))

    if (ignoreCircularRefs) {
      console.log(
        emoji.get(':see_no_evil:'),
        chalk.red(
          `Ignoring circular references in OpenAPI Spec. Response validation is disabled for invalid schemas!`
        ),
        emoji.get(':see_no_evil:')
      )
      console.log(chalk.red(consoleLine))
    }
    await fs.ensureDir('./tmp/working/')
    await fs.ensureDir('./tmp/converted/')
    await fs.ensureDir('./tmp/newman/')

    const configData = await getConfig(portmanConfigPath)

    if (Either.isLeft(configData)) {
      return PortmanError.render(configData.left)
    }

    const config = validate(configData.right as PortmanConfig)

    if (Either.isLeft(config)) {
      console.log(chalk`{red  Invalid Portman Config: } \t\t{green ${portmanConfigPath}}`)
      console.log(config.left)
      console.log(chalk.red(consoleLine))
    } else {
      this.config = config.right
    }
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
    const { oaLocal, oaUrl, filterFile, oaOutput, ignoreCircularRefs, collectionName } =
      this.options

    let openApiSpec = oaUrl && (await new DownloadService().get(oaUrl))

    if (oaLocal) {
      try {
        const oaLocalPath = path.resolve(oaLocal)
        await fs.copyFile(oaLocalPath, './tmp/converted/spec.yml')
        openApiSpec = './tmp/converted/spec.yml'
      } catch (err) {
        console.error('\x1b[31m', 'Local OAS error - no such file or directory "' + oaLocal + '"')
        process.exit(1)
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
      const openApiSpecPath = oaOutput ? oaOutput : './tmp/converted/filtered.yml'

      await execShellCommand(
        `npx openapi-format ${openApiSpec} -o ${openApiSpecPath} --yaml --filterFile ${filterFile}`
      )
      openApiSpec = openApiSpecPath
    }

    const oasParser = new OpenApiParser()
    await oasParser.convert({
      inputFile: openApiSpec,
      ignoreCircularRefs
    })

    // Assign oasParser entity
    this.oasParser = oasParser

    // Rename OpenAPI document title
    if (collectionName) {
      this.oasParser.oas = renamePostmanCollection(this.oasParser.oas, this.options)
    }
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

    let postmanObj: Record<string, unknown>

    if (localPostman) {
      try {
        const postmanJson = path.resolve(localPostman)
        postmanObj = JSON.parse(fs.readFileSync(postmanJson, 'utf8').toString())
      } catch (err) {
        throw new Error(`Loading ${localPostman} failed.`)
      }
    } else {
      postmanObj = await oaToPostman.convert(oaToPostmanConfig).catch(err => {
        console.error('Postman Collection generation failed: ', err.toString())
        process.exit(1)
      })
    }

    await this.runPortmanOverrides(postmanObj)

    this.postmanParser = new PostmanParser({
      collection: this.postmanCollection,
      oasParser: this.oasParser
    })

    this.portmanCollection = this.postmanParser.collection.toJSON()
  }

  injectTestSuite(): void {
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

      // Inject PreRequestScripts
      testSuite.injectPreRequestScripts()

      this.testSuite = testSuite
      this.portmanCollection = testSuite.collection.toJSON()
    }
  }

  injectVariationTests(): void {
    const {
      options: { includeTests },
      testSuite
    } = this

    if (
      includeTests &&
      testSuite &&
      testSuite?.variationTests?.length &&
      testSuite?.variationTests?.length > 0
    ) {
      // Inject variations
      this.variationWriter = new VariationWriter({
        testSuite: testSuite,
        variationFolderName: 'Variation Tests'
      })
      testSuite.variationWriter = this.variationWriter
      testSuite.generateVariationTests()

      this.portmanCollection = testSuite.collection.toJSON()
    }
  }

  // eslint-disable-next-line @typescript-eslint/ban-types
  async runPortmanOverrides(postmanCollection: CollectionDefinition): Promise<void> {
    // --- Portman - Overwrite Postman variables & values
    const { config, options } = this
    const collectionWriter = new CollectionWriter(config, options, postmanCollection)
    collectionWriter.execute()

    this.postmanCollection = new Collection(collectionWriter.collection)
  }

  injectIntegrationTests(): void {
    const {
      options: { includeTests },
      testSuite
    } = this

    if (includeTests && testSuite) {
      // Inject variations
      this.integrationTestWriter = new IntegrationTestWriter({
        testSuite: testSuite,
        integrationTestFolderName: 'Integration Tests'
      })

      testSuite.integrationTestWriter = this.integrationTestWriter
      testSuite.generateIntegrationTests()

      this.portmanCollection = testSuite.collection.toJSON()
    }
  }

  injectVariationOverwrites(): void {
    const { testSuite, variationWriter } = this
    if (!variationWriter || !testSuite) return

    this.postmanParser.map(this.portmanCollection)
    Object.entries(variationWriter.overwriteMap).map(([id, overwrites]) => {
      const pmOperation = this.postmanParser.getOperationByItemId(id)
      pmOperation && testSuite.injectOverwrites([pmOperation], overwrites)
    })

    this.portmanCollection = this.postmanParser.collection.toJSON()
  }

  moveContractTestsToFolder(): void {
    if (!this.options.bundleContractTests) return

    let pmOpsWithContractTest: (string | undefined)[] = []

    // map back over settings and get all operation ids that have contract tests
    pmOpsWithContractTest = this.testSuite.requestTestTypes
      .filter(obj => obj.reqTestType === PortmanTestTypes.contract)
      .map(obj => obj.postmanItemId)

    if (!pmOpsWithContractTest) return

    // Create contract test folder
    const contractTestFolder = new ItemGroup({
      name: `Contract Tests`
    }) as ItemGroup<Item>

    pmOpsWithContractTest.map(id => {
      const pmOperation = this.postmanParser.getOperationByItemId(id)
      let target: ItemGroup<Item>

      if (pmOperation) {
        // get the folder this operation is in
        const parent = pmOperation.getParent()

        if (parent) {
          // remove the operation from the folder
          parent?.items.remove(item => item.id === id, {})

          // If we just removed the last item, remove the folder
          if (parent?.items.count() === 0) {
            this.postmanParser.collection.items.remove(item => item.id === parent.id, {})
          }

          if (!Collection.isCollection(parent)) {
            // check if we've already recreated operations folder in Contract Test folder
            const folderName = parent.name
            const folder: unknown = contractTestFolder.oneDeep(folderName)

            if (folder) {
              target = folder as ItemGroup<Item>
            } else {
              // recreate the operations original folder to move operation to
              const newFolder = new ItemGroup({
                name: folderName
              }) as ItemGroup<Item>
              contractTestFolder.items.add(newFolder)
              target = newFolder
            }
          } else {
            target = contractTestFolder
          }
          target.items.add(pmOperation.item)
        }
      }
    })

    // Add contract test folder to root of collection
    this.postmanParser.collection.items.prepend(contractTestFolder)
    this.portmanCollection = this.postmanParser.collection.toJSON()
  }

  writePortmanCollectionToFile(): void {
    // --- Portman - Write Postman collection to file
    const { output } = this.options
    const { globals } = this.config
    const fileName = this?.portmanCollection?.info?.name || 'portman-collection'

    let postmanCollectionFile = `./tmp/converted/${camelCase(fileName)}.json`
    if (output) {
      postmanCollectionFile = output as string
      if (!postmanCollectionFile.includes('.json')) {
        console.error(
          '\x1b[31m',
          'Output file error - Only .json filenames are allowed for "' + postmanCollectionFile + '"'
        )
        process.exit(1)
      }
    }

    try {
      // --- Portman - Strip Response Examples
      if (globals?.stripResponseExamples) {
        this.portmanCollection = stripResponseExamples(this.portmanCollection)
      }

      let collectionString = JSON.stringify(this.portmanCollection, null, 2)

      // --- Portman - Replace & clean-up Portman
      if (globals?.portmanReplacements) {
        collectionString = writeRawReplacements(collectionString, globals.portmanReplacements)
        this.portmanCollection = new Collection(JSON.parse(collectionString)).toJSON()
      }

      fs.writeFileSync(postmanCollectionFile, collectionString, 'utf8')
      this.collectionFile = postmanCollectionFile
    } catch (err) {
      console.error(
        '\x1b[31m',
        'Output file error - no such file or directory "' + postmanCollectionFile + '"'
      )
      process.exit(1)
    }
  }

  async runNewmanSuite(): Promise<void> {
    // --- Portman - Execute Newman tests
    const {
      consoleLine,
      options: { runNewman, baseUrl, newmanIterationData, newmanRunOptions = {} }
    } = this

    if (runNewman) {
      const fileName = this?.portmanCollection?.info?.name || 'portman-collection'
      const newmanEnvFile = `./tmp/newman/${fileName}-env.json`
      writeNewmanEnv(this.portmanCollection, newmanEnvFile)

      try {
        console.log(chalk.green(consoleLine))
        console.log(chalk`{cyan  Run Newman against: } {green ${baseUrl}}`)
        console.log(chalk.green(consoleLine))

        await runNewmanWith(
          this.collectionFile,
          newmanEnvFile,
          newmanIterationData,
          newmanRunOptions as Partial<NewmanRunOptions>
        )
      } catch (error) {
        console.log(`\n`)
        console.log(chalk.red(consoleLine))
        console.log(chalk.red(`Newman run failed with: `))
        console.log(error?.message)
        process.exit(1)
      }
    }
  }

  async syncCollectionToPostman(): Promise<void> {
    // --- Portman - Upload Postman collection to Postman app
    const {
      portmanCollection,
      options: { syncPostman, postmanRefreshCache, postmanFastSync }
    } = this

    if (!syncPostman) return

    const postmanUid = this.options?.postmanUid
      ? this.options.postmanUid
      : process.env.POSTMAN_COLLECTION_UID || ''
    const postmanWorkspaceName = this.options?.postmanWorkspaceName
      ? this.options.postmanWorkspaceName
      : process.env.POSTMAN_WORKSPACE_NAME || ''

    const consoleLine = process.stdout.columns ? '='.repeat(process.stdout.columns) : '='.repeat(80)

    this.postmanSyncService = new PostmanSyncService({
      postmanUid,
      postmanWorkspaceName,
      portmanCollection,
      postmanRefreshCache: postmanRefreshCache,
      postmanFastSync: postmanFastSync
    })

    let response: unknown

    try {
      response = await this.postmanSyncService.sync()
    } catch (error) {
      console.log(`\n`)
      console.log(chalk.red(consoleLine))
      console.log(chalk.red(`Postman sync failed with: `))
      console.log(emoji.get(':cold_sweat:'), chalk.yellow(error?.message || error))

      console.log(chalk.red(consoleLine))
      process.exit(1)
    }

    // Process Postman API response as console output
    const { status, data } = JSON.parse(response as string)

    if (status === 'success') {
      this.postmanSyncService?.postmanWorkspaceName &&
        console.log(
          chalk`{cyan    -> Postman Workspace: }{green ${this.postmanSyncService?.postmanWorkspaceName}}`
        )
      console.log(
        chalk`{cyan    -> Postman Name: } \t {green ${
          data?.collection?.name || this.postmanSyncService?.collectionName
        }}`
      )
      console.log(
        chalk`{cyan    -> Postman UID: } \t {green ${
          data?.collection?.uid || this.postmanSyncService.postmanUid
        }}`
      )
    }

    if (status === 'fail') {
      console.log(
        chalk`{red    -> Postman Name: } \t${
          portmanCollection?.info?.name || this.postmanSyncService?.collectionName
        }`
      )
      console.log(
        chalk`{red    -> Postman UID: } \t${
          data?.collection?.uid || this.postmanSyncService.postmanUid
        }`
      )

      console.log(data?.error)
      console.log(`\n`)
      console.log(chalk.red(consoleLine))
      process.exit(1)
    }
  }
}
