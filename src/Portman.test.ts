import fs from 'fs-extra'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'
import { Portman } from './Portman'
import { omitKeys } from './utils'
import { Collection, Version } from 'postman-collection'

describe('Portman', () => {
  beforeEach(async () => {
    /* eslint-disable @typescript-eslint/no-empty-function */
    jest.spyOn(global.console, 'log').mockImplementation(() => {})
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should be runnable', async () => {
    const outputFile = `./tmp/converted/crmApi.${uuidv4()}.json`

    const portman = new Portman({
      postmanUid: 'eb1ffad6-eece-456b-ad32-3f2a3f605537',
      oaLocal: './__tests__/fixtures/crm-run.yml',
      postmanConfigFile: './__tests__/fixtures/postman-config.run.json',
      postmanConfigPath: './__tests__/fixtures/postman-config.run.json',
      portmanConfigFile: './__tests__/fixtures/portman.kitchensink.json',
      portmanConfigPath: './__tests__/fixtures/portman.kitchensink.json',
      envFile: './__tests__/fixtures/.crm.env',
      baseUrl: 'http://localhost:3050',
      output: outputFile,
      syncPostman: false,
      includeTests: true,
      runNewman: false
    })

    await portman.run()

    const outputFilePath = path.resolve(outputFile)
    expect(await fs.pathExists(outputFilePath)).toBe(true)

    const finalCollection = JSON.parse(await fs.readFile(outputFilePath, 'utf8'))
    expect(omitKeys(finalCollection, ['id', '_postman_id', 'postman_id', 'info'])).toMatchSnapshot()
  }, 30000)
})

describe('Portman version', () => {
  const outputFile = `./tmp/converted/crmApi.${uuidv4()}.json`
  let portmanInstance

  beforeEach(() => {
    portmanInstance = new Portman({
      postmanUid: 'eb1ffad6-eece-456b-ad32-3f2a3f605537',
      oaLocal: './__tests__/fixtures/crm.yml',
      postmanConfigFile: './__tests__/fixtures/postman-config.json',
      portmanConfigFile: './__tests__/fixtures/portman.kitchensink.json',
      portmanConfigPath: './__tests__/fixtures/portman.kitchensink.json',
      envFile: './__tests__/fixtures/.crm.env',
      baseUrl: 'http://localhost:3050',
      output: outputFile,
      syncPostman: false,
      includeTests: true,
      runNewman: false
    })

    portmanInstance.config = {
      globals: {
        stripResponseExamples: false,
        portmanReplacements: null
      }
    }

    portmanInstance.oasParser = {
      oas: {
        info: {
          version: '1.2.3'
        }
      }
    }

    portmanInstance.postmanParser = {
      collection: new Collection({
        info: {
          name: 'Test Collection'
        }
      })
    }
  })

  it('should set the postman collection version from the OpenAPI version', () => {
    portmanInstance.writePortmanCollectionToFile()
    expect(portmanInstance.postmanParser.collection.version).toEqual(new Version('1.2.3'))
  })

  it('should nto return the postman collection version since it is an incomplete version', () => {
    portmanInstance.oasParser = {
      oas: {
        info: {
          version: '1.2'
        }
      }
    }
    portmanInstance.writePortmanCollectionToFile()
    expect(portmanInstance.postmanParser.collection.version).toBeUndefined()
  })

  it('should handle swagger 2.0 info', () => {
    portmanInstance.oasParser = {
      oas: {
        swagger: '2.0',
        info: {
          version: 'v1'
        }
      }
    }

    portmanInstance.writePortmanCollectionToFile()
    expect(portmanInstance.postmanParser.collection.version).toBeUndefined()
    expect(portmanInstance.portmanCollection.info.version).toBeUndefined()
    expect(portmanInstance.portmanCollection.info.name).toEqual('Test Collection')
  })

  it('should handle case when there is no version', () => {
    portmanInstance.oasParser = {
      oas: {
        info: {
          title: 'Test Collection'
        }
      }
    }

    portmanInstance.writePortmanCollectionToFile()
    expect(portmanInstance.postmanParser.collection.version).toBeUndefined()
    expect(portmanInstance.portmanCollection.info.version).toBeUndefined()
    expect(portmanInstance.portmanCollection.info.name).toEqual('Test Collection')
  })
})
