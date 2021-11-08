import fs from 'fs-extra'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'
import { Portman } from './Portman'
import { PortmanOptions } from './types'
import { omitKeys } from './utils'

describe('Portman', () => {
  let options: PortmanOptions = {}

  beforeEach(async () => {
    /* eslint-disable @typescript-eslint/no-empty-function */
    jest.spyOn(global.console, 'log').mockImplementation(() => {})

    const cliOptionsFilePath = path.resolve('./__tests__/fixtures/portman.cli.json')
    options = JSON.parse(await fs.readFile(cliOptionsFilePath, 'utf8'))
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should be runnable', async () => {
    const portman = new Portman({
      ...options,
      oaLocal: options.local,
      portmanConfigPath: options.portmanConfigFile,
      postmanConfigPath: options.postmanConfigPath
    })
    const beforeSpy = jest.spyOn(portman, 'before')
    const afterSpy = jest.spyOn(portman, 'after')

    const parseOpenApiSpecSpy = jest.spyOn(portman, 'parseOpenApiSpec')
    const convertToPostmanCollectionSpy = jest.spyOn(portman, 'convertToPostmanCollection')
    const injectTestSuiteSpy = jest.spyOn(portman, 'injectTestSuite')
    const injectVariationTestsSpy = jest.spyOn(portman, 'injectVariationTests')
    const injectIntegrationTestsSpy = jest.spyOn(portman, 'injectIntegrationTests')
    const moveContractTestsToFolder = jest.spyOn(portman, 'moveContractTestsToFolder')
    const writePortmanCollectionToFileSpy = jest.spyOn(portman, 'writePortmanCollectionToFile')
    const runNewmanSuiteSpy = jest.spyOn(portman, 'runNewmanSuite')
    const syncCollectionToPostmanSpy = jest.spyOn(portman, 'syncCollectionToPostman')

    await portman.run()

    expect(beforeSpy).toHaveBeenCalled()
    expect(afterSpy).toHaveBeenCalled()
    expect(parseOpenApiSpecSpy).toHaveBeenCalled()
    expect(convertToPostmanCollectionSpy).toHaveBeenCalled()
    expect(injectTestSuiteSpy).toHaveBeenCalled()
    expect(injectVariationTestsSpy).toHaveBeenCalled()
    expect(injectIntegrationTestsSpy).toHaveBeenCalled()
    expect(moveContractTestsToFolder).toHaveBeenCalled()
    expect(writePortmanCollectionToFileSpy).toHaveBeenCalled()
    expect(runNewmanSuiteSpy).toHaveBeenCalled()
    expect(syncCollectionToPostmanSpy).toHaveBeenCalled()

    const outputFilePath = path.resolve('./tmp/converted/crmApi.json')
    const finalCollection = JSON.parse(await fs.readFile(outputFilePath, 'utf8'))
    expect(omitKeys(finalCollection, ['id', '_postman_id', 'postman_id'])).toMatchSnapshot()
  }, 30000)

  it('should generate collection without contract tests (enabled:false)', async () => {
    const outputFile = `./tmp/converted/crmApi.${uuidv4()}.json`
    const portman = new Portman({
      ...options,
      oaLocal: options.local,
      portmanConfigPath: './__tests__/fixtures/portman-no-contract-tests.crm.json',
      output: outputFile
    })
    await portman.run()

    const outputFilePath = path.resolve(outputFile)
    const finalCollection = JSON.parse(await fs.readFile(outputFilePath, 'utf8'))
    expect(omitKeys(finalCollection, ['id', '_postman_id', 'postman_id', 'info'])).toMatchSnapshot()
    await fs.rm(outputFile)
  }, 30000)

  it('should check example CLI: filtering', async () => {
    const cliOptionsFilePath = path.resolve('./examples/cli-filtering/portman-cli-options.json')
    options = JSON.parse(await fs.readFile(cliOptionsFilePath, 'utf8'))
    const outputFile = `./tmp/converted/crmApi.${uuidv4()}.json`
    const portman = new Portman({
      ...options,
      oaUrl: options.url,
      output: outputFile
    })
    await portman.run()

    const outputFilePath = path.resolve(outputFile)
    const finalCollection = JSON.parse(await fs.readFile(outputFilePath, 'utf8'))

    expect(omitKeys(finalCollection, ['id', '_postman_id', 'postman_id', 'info'])).toMatchSnapshot()
    await fs.rm(outputFile)
  }, 30000)

  it('should check example CLI: options', async () => {
    const postmanOptionsFilePath = path.resolve('./__tests__/fixtures/postman-config.crm.json')
    const cliOptionsFilePath = path.resolve('./examples/cli-options/portman-cli-options.json')
    options = JSON.parse(await fs.readFile(cliOptionsFilePath, 'utf8'))
    const outputFile = `./tmp/converted/crmApi.${uuidv4()}.json`
    const portman = new Portman({
      ...options,
      oaLocal: options.local,
      output: outputFile,
      portmanConfigPath: options.portmanConfigFile,
      postmanConfigPath: postmanOptionsFilePath
    })
    await portman.run()

    const outputFilePath = path.resolve(outputFile)
    const finalCollection = JSON.parse(await fs.readFile(outputFilePath, 'utf8'))
    expect(omitKeys(finalCollection, ['id', '_postman_id', 'postman_id', 'info'])).toMatchSnapshot()
    await fs.rm(outputFile)
  }, 30000)

  it('should check example portman globals', async () => {
    const postmanOptionsFilePath = path.resolve('./__tests__/fixtures/postman-config.crm.json')
    const cliOptionsFilePath = path.resolve('./examples/portman-globals/portman-cli-options.json')
    options = JSON.parse(await fs.readFile(cliOptionsFilePath, 'utf8'))
    const outputFile = `./tmp/converted/crmApi.${uuidv4()}.json`
    const portman = new Portman({
      ...options,
      oaLocal: options.local,
      output: outputFile,
      portmanConfigPath: options.portmanConfigFile,
      postmanConfigPath: postmanOptionsFilePath
    })
    await portman.run()

    const outputFilePath = path.resolve(outputFile)
    const finalCollection = JSON.parse(await fs.readFile(outputFilePath, 'utf8'))
    expect(omitKeys(finalCollection, ['id', '_postman_id', 'postman_id', 'info'])).toMatchSnapshot()
    await fs.rm(outputFile)
  }, 30000)

  it('should check example portman ordering', async () => {
    const postmanOptionsFilePath = path.resolve('./__tests__/fixtures/postman-config.crm.json')
    const outputFile = `./tmp/converted/crmApi.${uuidv4()}.json`
    const portman = new Portman({
      oaLocal: './examples/postman-ordering/crm.yml',
      output: outputFile,
      includeTests: false,
      portmanConfigPath: './examples/postman-ordering/portman-config.ordering.json',
      postmanConfigPath: postmanOptionsFilePath
    })
    await portman.run()

    const outputFilePath = path.resolve(outputFile)
    const finalCollection = JSON.parse(await fs.readFile(outputFilePath, 'utf8'))
    expect(omitKeys(finalCollection, ['id', '_postman_id', 'postman_id', 'info'])).toMatchSnapshot()
    await fs.rm(outputFile)
  }, 30000)

  it('should check example testsuite assign variables', async () => {
    const postmanOptionsFilePath = path.resolve('./__tests__/fixtures/postman-config.crm.json')
    const cliOptionsFilePath = path.resolve(
      './examples/testsuite-assign-variables/portman-cli-options.json'
    )
    const outputFile = `./tmp/converted/crmApi.${uuidv4()}.json`
    options = JSON.parse(await fs.readFile(cliOptionsFilePath, 'utf8'))
    const portman = new Portman({
      ...options,
      oaLocal: options.local,
      output: outputFile,
      portmanConfigPath: options.portmanConfigFile,
      postmanConfigPath: postmanOptionsFilePath
    })
    await portman.run()

    const outputFilePath = path.resolve(outputFile)
    const finalCollection = JSON.parse(await fs.readFile(outputFilePath, 'utf8'))
    expect(omitKeys(finalCollection, ['id', '_postman_id', 'postman_id', 'info'])).toMatchSnapshot()
    await fs.rm(outputFile)
  }, 30000)

  it('should check example testsuite content tests', async () => {
    const postmanOptionsFilePath = path.resolve('./__tests__/fixtures/postman-config.crm.json')
    const cliOptionsFilePath = path.resolve(
      './examples/testsuite-content-tests/portman-cli-options.json'
    )
    const outputFile = `./tmp/converted/crmApi.${uuidv4()}.json`
    options = JSON.parse(await fs.readFile(cliOptionsFilePath, 'utf8'))
    const portman = new Portman({
      ...options,
      oaLocal: options.local,
      output: outputFile,
      portmanConfigPath: options.portmanConfigFile,
      postmanConfigPath: postmanOptionsFilePath
    })
    await portman.run()

    const outputFilePath = path.resolve(outputFile)
    const finalCollection = JSON.parse(await fs.readFile(outputFilePath, 'utf8'))
    expect(omitKeys(finalCollection, ['id', '_postman_id', 'postman_id', 'info'])).toMatchSnapshot()
    await fs.rm(outputFile)
  }, 30000)

  it('should check example testsuite contract tests', async () => {
    const postmanOptionsFilePath = path.resolve('./__tests__/fixtures/postman-config.crm.json')
    const cliOptionsFilePath = path.resolve(
      './examples/testsuite-contract-tests/portman-cli-options.json'
    )
    const outputFile = `./tmp/converted/crmApi.${uuidv4()}.json`
    options = JSON.parse(await fs.readFile(cliOptionsFilePath, 'utf8'))
    const portman = new Portman({
      ...options,
      oaLocal: options.local,
      output: outputFile,
      portmanConfigPath: options.portmanConfigFile,
      postmanConfigPath: postmanOptionsFilePath
    })
    await portman.run()

    const outputFilePath = path.resolve(outputFile)
    const finalCollection = JSON.parse(await fs.readFile(outputFilePath, 'utf8'))
    expect(omitKeys(finalCollection, ['id', '_postman_id', 'postman_id', 'info'])).toMatchSnapshot()
    await fs.rm(outputFile)
  }, 30000)

  it('should check example testsuite overwrites', async () => {
    const postmanOptionsFilePath = path.resolve('./__tests__/fixtures/postman-config.crm.json')
    const cliOptionsFilePath = path.resolve(
      './examples/testsuite-overwrites/portman-cli-options.json'
    )
    const outputFile = `./tmp/converted/crmApi.${uuidv4()}.json`
    options = JSON.parse(await fs.readFile(cliOptionsFilePath, 'utf8'))
    const portman = new Portman({
      ...options,
      oaLocal: options.local,
      output: outputFile,
      portmanConfigPath: options.portmanConfigFile,
      postmanConfigPath: postmanOptionsFilePath
    })
    await portman.run()

    const outputFilePath = path.resolve(outputFile)
    const finalCollection = JSON.parse(await fs.readFile(outputFilePath, 'utf8'))
    expect(omitKeys(finalCollection, ['id', '_postman_id', 'postman_id', 'info'])).toMatchSnapshot()
    await fs.rm(outputFile)
  }, 30000)

  it('should check example testsuite variation tests', async () => {
    const postmanOptionsFilePath = path.resolve('./__tests__/fixtures/postman-config.crm.json')
    const cliOptionsFilePath = path.resolve(
      './examples/testsuite-variation-tests/portman-cli-options.json'
    )
    const outputFile = `./tmp/converted/crmApi.${uuidv4()}.json`
    options = JSON.parse(await fs.readFile(cliOptionsFilePath, 'utf8'))
    const portman = new Portman({
      ...options,
      oaLocal: options.local,
      output: outputFile,
      portmanConfigPath: options.portmanConfigFile,
      postmanConfigPath: postmanOptionsFilePath
    })
    await portman.run()

    const outputFilePath = path.resolve(outputFile)
    const finalCollection = JSON.parse(await fs.readFile(outputFilePath, 'utf8'))
    expect(omitKeys(finalCollection, ['id', '_postman_id', 'postman_id', 'info'])).toMatchSnapshot()
    await fs.rm(outputFile)
  }, 30000)

  it('should check testsuite variation tests, with bundled contract test', async () => {
    const postmanOptionsFilePath = path.resolve('./__tests__/fixtures/postman-config.crm.json')
    const portmanOptionsFilePath = path.resolve('./__tests__/fixtures/portman-variations.crm.json')
    const cliOptionsFilePath = path.resolve(
      './examples/testsuite-variation-tests/portman-cli-options.json'
    )
    options = JSON.parse(await fs.readFile(cliOptionsFilePath, 'utf8'))
    const outputFile = `./tmp/converted/crmApi.${uuidv4()}.json`
    const portman = new Portman({
      ...options,
      oaLocal: options.local,
      output: outputFile,
      portmanConfigPath: portmanOptionsFilePath,
      postmanConfigPath: postmanOptionsFilePath,
      bundleContractTests: true
    })
    await portman.run()

    const outputFilePath = path.resolve(outputFile)
    const finalCollection = JSON.parse(await fs.readFile(outputFilePath, 'utf8'))
    expect(omitKeys(finalCollection, ['id', '_postman_id', 'postman_id', 'info'])).toMatchSnapshot()
    await fs.rm(outputFile)
  }, 30000)

  it('should check testsuite content tests, with bundled contract test', async () => {
    const postmanOptionsFilePath = path.resolve('./__tests__/fixtures/postman-config.crm.json')
    const portmanOptionsFilePath = path.resolve('./__tests__/fixtures/portman-variations.crm.json')
    const cliOptionsFilePath = path.resolve(
      './examples/testsuite-content-tests/portman-cli-options.json'
    )
    options = JSON.parse(await fs.readFile(cliOptionsFilePath, 'utf8'))
    const outputFile = `./tmp/converted/crmApi.${uuidv4()}.json`
    const portman = new Portman({
      ...options,
      oaLocal: options.local,
      output: outputFile,
      portmanConfigPath: portmanOptionsFilePath,
      postmanConfigPath: postmanOptionsFilePath,
      bundleContractTests: true
    })
    await portman.run()

    const outputFilePath = path.resolve(outputFile)
    const finalCollection = JSON.parse(await fs.readFile(outputFilePath, 'utf8'))
    expect(omitKeys(finalCollection, ['id', '_postman_id', 'postman_id', 'info'])).toMatchSnapshot()
    await fs.rm(outputFile)
  }, 30000)

  it('should match JSON & YAML generated Postman', async () => {
    const postmanOptionsFilePath = path.resolve('./__tests__/fixtures/postman-config.crm.json')
    const cliOptionsJsonFormat = {
      local: './__tests__/fixtures/crm.yml',
      portmanConfigFile: './__tests__/fixtures/portman.crm.json',
      syncPostman: false,
      includeTests: true,
      runNewman: false
    }
    const cliOptionsYamlFormat = {
      local: './__tests__/fixtures/crm.yml',
      portmanConfigFile: './__tests__/fixtures/portman.crm.yaml',
      syncPostman: false,
      includeTests: true,
      runNewman: false
    }
    const outputFile = `./tmp/converted/crmApi.${uuidv4()}.json`
    // JSON export
    const portmanJson = new Portman({
      ...cliOptionsJsonFormat,
      oaLocal: options.local,
      output: outputFile,
      portmanConfigPath: options.portmanConfigFile,
      postmanConfigPath: postmanOptionsFilePath
    })
    await portmanJson.run()

    const outputFilePathJson = path.resolve(outputFile)
    const finalCollectionJson = JSON.parse(await fs.readFile(outputFilePathJson, 'utf8'))

    // YAML export
    const portmanYaml = new Portman({
      ...cliOptionsYamlFormat,
      oaLocal: options.local,
      output: outputFile,
      portmanConfigPath: options.portmanConfigFile,
      postmanConfigPath: postmanOptionsFilePath
    })
    await portmanYaml.run()

    const outputFilePathYaml = path.resolve(outputFile)
    const finalCollectionYaml = JSON.parse(await fs.readFile(outputFilePathYaml, 'utf8'))

    expect(omitKeys(finalCollectionJson, ['id', '_postman_id', 'postman_id', 'info'])).toEqual(
      omitKeys(finalCollectionYaml, ['id', '_postman_id', 'postman_id', 'info'])
    )
    await fs.rm(outputFile)
  }, 30000)
})
