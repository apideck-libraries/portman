import SwaggerParser from '@apidevtools/swagger-parser'
import fs from 'fs-extra'
import { OpenAPIV3 } from 'openapi-types'
import { CollectionDefinition } from 'postman-collection'
import * as mockOAS from '../../__tests__/fixtures/mockOAS.json'
import * as mockPostman from '../../__tests__/fixtures/mockPostman.json'
import { IntegrationTestWriter, VariationWriter } from '../application'
import { TestSuite } from '../application/TestSuite'
import * as configLoader from '../lib/getConfig'
import { OpenApiParser } from '../oas'
import { Portman } from '../Portman'
import { PostmanParser } from '../postman'
import { OpenApiToPostmanService } from '../services'
import { PortmanOptions } from '../types'
import { omitKeys } from '../utils'
import * as validateJsonSchema from '../utils/PortmanConfig.validator'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const portmanResult = (collection: CollectionDefinition): any => {
  return JSON.parse(JSON.stringify(collection))
}

const mockPostmanSync = jest.fn(() =>
  Promise.resolve(JSON.stringify({ status: 'success', data: {} }))
)

jest.mock('../services/PostmanSyncService', () => {
  return {
    PostmanSyncService: jest.fn().mockImplementation(() => {
      return {
        sync: mockPostmanSync
      }
    })
  }
})

afterAll(() => {
  jest.restoreAllMocks()
})

describe('Portman', () => {
  let options: PortmanOptions = {}

  beforeEach(async () => {
    /* eslint-disable @typescript-eslint/no-empty-function */
    jest.spyOn(global.console, 'log').mockImplementation(() => {})
    /* eslint-disable @typescript-eslint/no-empty-function */
    jest.spyOn(global.console, 'error').mockImplementation(() => {})
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    jest.spyOn(process, 'exit').mockImplementation(() => {
      return undefined as never
    })

    // mock conversions
    jest
      .spyOn(SwaggerParser.prototype, 'dereference')
      .mockImplementation(() => Promise.resolve(mockOAS as OpenAPIV3.Document))
    jest
      .spyOn(SwaggerParser.prototype, 'bundle')
      .mockImplementation(() => Promise.resolve(mockOAS as OpenAPIV3.Document))
    jest
      .spyOn(OpenApiToPostmanService.prototype, 'convert')
      .mockImplementation(() => Promise.resolve(mockPostman))

    options = {
      postmanUid: 'eb1ffad6-eece-456b-ad32-3f2a3f605537',
      oaLocal: './__tests__/fixtures/crm.yml',
      postmanConfigFile: './__tests__/fixtures/postman-config.json',
      portmanConfigFile: './__tests__/fixtures/portman.crm.json',
      portmanConfigPath: './__tests__/fixtures/portman.crm.json',
      envFile: './__tests__/fixtures/.crm.env',
      baseUrl: 'http://localhost:3050',
      syncPostman: false,
      includeTests: true,
      runNewman: false
    }
  })

  afterAll(() => {
    jest.restoreAllMocks()
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should be a function', () => {
    expect(Portman).toBeInstanceOf(Function)
  })

  it('should return a Portman instance', () => {
    const portman = new Portman(options)
    expect(portman).toBeInstanceOf(Portman)
  })

  it('should return a Portman instance with default options', () => {
    const portman = new Portman({})
    expect(portman).toBeInstanceOf(Portman)
  })

  describe('Portman.run()', () => {
    it('should be a function', () => {
      const portman = new Portman(options)
      expect(portman.run).toBeInstanceOf(Function)
    })
  })

  describe('Portman.before()', () => {
    it('should be a function', () => {
      const portman = new Portman(options)
      expect(portman.before).toBeInstanceOf(Function)
    })

    it('should get called when calling run', async () => {
      const portman = new Portman(options)
      const spy = jest.spyOn(portman, 'before')
      await portman.run()
      expect(spy).toHaveBeenCalled()
    })

    it('should load config file with getConfig()', async () => {
      const portman = new Portman(options)
      const spy = jest.spyOn(configLoader, 'getConfig')
      await portman.run()
      expect(spy).toHaveBeenCalled()
    })

    it('should validate config file with validateJsonSchema()', async () => {
      const portman = new Portman(options)
      const spy = jest.spyOn(validateJsonSchema, 'validate')
      await portman.run()
      expect(spy).toHaveBeenCalled()
    })
  })

  describe('Portman.parseOpenApiSpec()', () => {
    it('should be a function', () => {
      const portman = new Portman(options)
      expect(portman.parseOpenApiSpec).toBeInstanceOf(Function)
    })

    it('should throw an error when no spec is passed', async () => {
      const portman = new Portman({
        portmanConfigFile: './__tests__/fixtures/portman.crm.json'
      })
      await expect(portman.parseOpenApiSpec()).rejects.toThrow('Error initializing OpenApi Spec.')
    })

    it('should throw an error when spec path does not exist', async () => {
      const portman = new Portman({
        oaLocal: './__tests__/fixtures/not_a_spec.yml'
      })
      await expect(portman.parseOpenApiSpec()).rejects.toThrow('Error initializing OpenApi Spec.')
    })

    it('should parse OpenAPI spec and define an OpenApiParser', async () => {
      const portman = new Portman(options)
      const spy = jest.spyOn(portman, 'parseOpenApiSpec')
      await portman.run()

      expect(spy).toHaveBeenCalled()
      expect(portman.oasParser).toBeDefined()
      expect(portman.oasParser).toBeInstanceOf(OpenApiParser)
    })
  })

  describe('Portman.convertToPostmanCollection()', () => {
    it('should be a function', () => {
      const portman = new Portman(options)
      expect(portman.convertToPostmanCollection).toBeInstanceOf(Function)
    })

    it('should convert OpenAPI spec to Postman collection', async () => {
      const portman = new Portman(options)
      const spy = jest.spyOn(portman, 'convertToPostmanCollection')
      await portman.run()

      expect(spy).toHaveBeenCalled()
      expect(portman.postmanParser).toBeDefined()
      expect(portman.postmanParser).toBeInstanceOf(PostmanParser)
    })

    it('should call Portman.runPortmanOverrides', async () => {
      const portman = new Portman(options)
      const spy = jest.spyOn(portman, 'runPortmanOverrides')
      await portman.run()

      expect(spy).toHaveBeenCalled()
      expect(portman.portmanCollection).toBeDefined()
    })
  })

  describe('Portman.injectTestSuite()', () => {
    it('should be a function', () => {
      const portman = new Portman(options)
      expect(portman.injectTestSuite).toBeInstanceOf(Function)
    })

    it('should inject test suite into Postman collection', async () => {
      const portman = new Portman(options)
      const spy = jest.spyOn(portman, 'injectTestSuite')
      await portman.run()

      expect(spy).toHaveBeenCalled()
      expect(portman.testSuite).toBeDefined()
      expect(portman.testSuite).toBeInstanceOf(TestSuite)

      expect(omitKeys(portman.testSuite.requestTestTypes, ['postmanItemId'])).toMatchSnapshot()
    })
  })

  describe('Portman.injectVariationTests()', () => {
    it('should be a function', () => {
      const portman = new Portman(options)
      expect(portman.injectVariationTests).toBeInstanceOf(Function)
    })

    it('should inject variation tests into Postman collection', async () => {
      const portman = new Portman(options)
      const spy = jest.spyOn(portman, 'injectVariationTests')
      await portman.run()

      expect(spy).toHaveBeenCalled()

      expect(portman.variationWriter).toBeDefined()
      expect(portman.variationWriter).toBeInstanceOf(VariationWriter)
      expect(portman.variationWriter.variationFolder.name).toMatchSnapshot()

      expect(
        portmanResult(portman.portmanCollection).item.find(
          item => item.name === 'Integration Tests'
        )
      ).toBeDefined()
    })
  })

  describe('Portman.injectVariationOverwrites()', () => {
    it('should be a function', () => {
      const portman = new Portman(options)
      expect(portman.injectVariationOverwrites).toBeInstanceOf(Function)
    })

    it('should inject variation overwrites into Postman collection', async () => {
      const portman = new Portman(options)
      const spy = jest.spyOn(portman, 'injectVariationOverwrites')
      await portman.run()

      expect(spy).toHaveBeenCalled()

      expect(portman.integrationTestWriter).toBeDefined()
      expect(portman.integrationTestWriter).toBeInstanceOf(IntegrationTestWriter)
      expect(portman.integrationTestWriter.integrationTestFolder.name).toMatchSnapshot()

      expect(
        portmanResult(portman.portmanCollection).item.find(
          item => item.name === 'Integration Tests'
        )
      ).toBeDefined()
    })
  })

  describe('Portman.runPortmanOverrides()', () => {
    it('should be a function', () => {
      const portman = new Portman(options)
      expect(portman.runPortmanOverrides).toBeInstanceOf(Function)
    })

    it('should run portman overrides', async () => {
      const portman = new Portman(options)
      const spy = jest.spyOn(portman, 'runPortmanOverrides')
      await portman.run()

      expect(spy).toHaveBeenCalled()
    })
  })

  describe('Portman.moveContractTestsToFolder()', () => {
    it('should be a function', () => {
      const portman = new Portman(options)
      expect(portman.moveContractTestsToFolder).toBeInstanceOf(Function)
    })

    it('should be called when bundleContractTests true', async () => {
      const portman = new Portman({
        ...options,
        bundleContractTests: true
      })

      const spy = jest.spyOn(portman, 'moveContractTestsToFolder')
      await portman.run()

      expect(spy).toHaveBeenCalled()
      expect(
        portmanResult(portman.portmanCollection).item.find(item => item.name === 'Contract Tests')
      ).toBeDefined()
    })
  })

  describe('Portman.writePortmanCollectionToFile()', () => {
    const jestCollectionFile = './tmp/jest-collection.json'

    it('should be a function', () => {
      const portman = new Portman(options)
      expect(portman.writePortmanCollectionToFile).toBeInstanceOf(Function)
    })

    it('should write portman collection to file', async () => {
      try {
        await fs.rm(jestCollectionFile)
      } catch (e) {
        // ignore
      }
      expect(await fs.pathExists(jestCollectionFile)).toBe(false)

      const portman = new Portman({
        ...options,
        output: jestCollectionFile
      })

      const spy = jest.spyOn(portman, 'writePortmanCollectionToFile')
      await portman.run()

      expect(spy).toHaveBeenCalled()
      expect(portman.portmanCollection).toBeDefined()
      expect(portman.collectionFile).toBe(jestCollectionFile)

      expect(await fs.pathExists(jestCollectionFile)).toBe(true)
    })
  })

  describe('Portman.runNewmanSuite()', () => {
    it('should be a function', () => {
      const portman = new Portman(options)
      expect(portman.runNewmanSuite).toBeInstanceOf(Function)
    })

    it('should run newman suite', async () => {
      const portman = new Portman(options)
      const spy = jest.spyOn(portman, 'runNewmanSuite')
      await portman.run()

      expect(spy).toHaveBeenCalled()
    })
  })

  describe('Portman.syncCollectionToPostman()', () => {
    it('should be a function', () => {
      const portman = new Portman(options)
      expect(portman.syncCollectionToPostman).toBeInstanceOf(Function)
    })

    it('should sync collection to postman', async () => {
      const portman = new Portman(options)
      const spy = jest.spyOn(portman, 'syncCollectionToPostman')
      await portman.run()

      expect(spy).toHaveBeenCalled()
    })

    it('should call PostmanSyncService.sync when syncPostman is true', async () => {
      const portman = new Portman({
        ...options,
        syncPostman: true
      })

      await portman.run()

      expect(portman.postmanSyncService).toBeDefined()
      expect(mockPostmanSync).toHaveBeenCalled()
    })
  })

  describe('Portman.after()', () => {
    it('should be a function', () => {
      const portman = new Portman(options)
      expect(portman.after).toBeInstanceOf(Function)
    })

    it('should run after hook', async () => {
      const portman = new Portman(options)
      const spy = jest.spyOn(portman, 'after')
      await portman.run()

      expect(spy).toHaveBeenCalled()
    })
  })
})
