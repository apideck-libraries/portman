import * as globals from '../application'
import { CollectionWriter } from '../application'
import { PortmanConfig, PortmanOptions } from '../types'

jest.mock('./globals/overwriteCollectionKeyValues')
jest.mock('./globals/overwriteCollectionValues')
jest.mock('./globals/orderCollectionRequests')
jest.mock('./globals/writeCollectionPreRequestScripts')
jest.mock('./globals/injectEnvVariables')
jest.mock('./globals/writeRawReplacements')

describe('CollectionWriter.execute()', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('overwriteCollectionKeyValues', () => {
    const spy = jest.spyOn(globals, 'overwriteCollectionKeyValues')

    it('should call with keyValueReplacements', () => {
      const config = {
        globals: {
          keyValueReplacements: { foo: 'bar' }
        }
      } as PortmanConfig

      const collectionWriter = new CollectionWriter(config, {}, {})
      collectionWriter.execute()

      expect(spy).toHaveBeenCalled()
    })

    it('should not call without keyValueReplacements', () => {
      const config = {
        globals: {}
      } as PortmanConfig

      const collectionWriter = new CollectionWriter(config, {}, {})
      collectionWriter.execute()

      expect(spy).not.toHaveBeenCalled()
    })
  })

  describe('overwriteCollectionValues', () => {
    const spy = jest.spyOn(globals, 'overwriteCollectionValues')

    it('should call with valueReplacements', () => {
      const config = {
        globals: {
          valueReplacements: { foo: 'bar' }
        }
      } as PortmanConfig

      const collectionWriter = new CollectionWriter(config, {}, {})
      collectionWriter.execute()

      expect(spy).toHaveBeenCalled()
    })

    it('should not call without valueReplacements', () => {
      const config = {
        globals: {}
      } as PortmanConfig

      const collectionWriter = new CollectionWriter(config, {}, {})
      collectionWriter.execute()

      expect(spy).not.toHaveBeenCalled()
    })
  })

  describe('orderCollectionRequests', () => {
    const spy = jest.spyOn(globals, 'orderCollectionRequests')

    it('should call with orderOfOperations', () => {
      const config = {
        globals: {
          orderOfOperations: ['getCompany', 'updateCompany']
        }
      } as PortmanConfig

      const collectionWriter = new CollectionWriter(config, {}, {})
      collectionWriter.execute()

      expect(spy).toHaveBeenCalled()
    })

    it('should not call without orderOfOperations', () => {
      const config = {
        globals: {}
      } as PortmanConfig

      const collectionWriter = new CollectionWriter(config, {}, {})
      collectionWriter.execute()

      expect(spy).not.toHaveBeenCalled()
    })
  })

  describe('writeCollectionPreRequestScripts', () => {
    const spy = jest.spyOn(globals, 'writeCollectionPreRequestScripts')

    it('should call with collectionPreRequestScripts', () => {
      const config = {
        globals: {
          collectionPreRequestScripts: ['console.log("foo")']
        }
      } as PortmanConfig

      const collectionWriter = new CollectionWriter(config, {}, {})
      collectionWriter.execute()

      expect(spy).toHaveBeenCalled()
    })

    it('should not call without collectionPreRequestScripts', () => {
      const config = {
        globals: {}
      } as PortmanConfig

      const collectionWriter = new CollectionWriter(config, {}, {})
      collectionWriter.execute()

      expect(spy).not.toHaveBeenCalled()
    })
  })

  describe('injectEnvVariables', () => {
    const spy = jest.spyOn(globals, 'injectEnvVariables')

    it('should call with envFile', () => {
      const config = {
        globals: {}
      } as PortmanConfig

      const options = {
        envFile: '.test.env',
        baseUrl: 'http://example.com'
      } as PortmanOptions

      const collectionWriter = new CollectionWriter(config, options, {})
      collectionWriter.execute()

      expect(spy).toHaveBeenCalled()
    })

    it('should call with envFile without globals', () => {
      const config = {} as PortmanConfig

      const options = {
        envFile: '.test.env',
        baseUrl: 'http://example.com'
      } as PortmanOptions

      const collectionWriter = new CollectionWriter(config, options, {})
      collectionWriter.execute()

      expect(spy).toHaveBeenCalled()
    })

    it('should not call without envFile', () => {
      const config = {
        globals: {}
      } as PortmanConfig

      const options = {
        includetests: true
      } as PortmanOptions

      const collectionWriter = new CollectionWriter(config, options, {})
      collectionWriter.execute()

      expect(spy).not.toHaveBeenCalled()
    })
  })

  describe('writeRawReplacements', () => {
    const spy = jest.spyOn(globals, 'writeRawReplacements').mockReturnValue('{}')

    it('should call with rawReplacements', () => {
      const config = {
        globals: {
          rawReplacements: [{ searchFor: 'foo', replaceWith: 'bar' }]
        }
      } as PortmanConfig

      const collectionWriter = new CollectionWriter(config, {}, {})
      collectionWriter.execute()

      expect(spy).toHaveBeenCalled()
    })

    it('should not call without rawReplacements', () => {
      const config = {
        globals: {}
      } as PortmanConfig

      const collectionWriter = new CollectionWriter(config, {}, {})
      collectionWriter.execute()

      expect(spy).not.toHaveBeenCalled()
    })
  })
})
