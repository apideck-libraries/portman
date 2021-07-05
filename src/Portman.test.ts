import fs from 'fs-extra'
import path from 'path'
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
    expect(writePortmanCollectionToFileSpy).toHaveBeenCalled()
    expect(runNewmanSuiteSpy).toHaveBeenCalled()
    expect(syncCollectionToPostmanSpy).toHaveBeenCalled()

    const outputFilePath = path.resolve('./tmp/converted/crmApi.json')
    const finalCollection = JSON.parse(await fs.readFile(outputFilePath, 'utf8'))
    expect(omitKeys(finalCollection, ['id', '_postman_id', 'postman_id'])).toMatchSnapshot()
  })
})
