import * as Either from 'fp-ts/lib/Either'
import fs from 'fs-extra'
import { CollectionDefinition } from 'postman-collection'
import { PostmanApiService } from './PostmanApiService'
import { PostmanSyncService } from './PostmanSyncService'
const workspacesJson = JSON.parse(
  fs.readFileSync('__tests__/fixtures/api_workspaces.json').toString()
)

const workspaceJson = JSON.parse(
  fs.readFileSync('__tests__/fixtures/api_workspace.json').toString()
)

const collectionsJson = JSON.parse(
  fs.readFileSync('__tests__/fixtures/api_collections.json').toString()
)

const knownCollection: CollectionDefinition = {
  info: {
    name: 'Sample Collection',
    version: '1.0.0'
  }
}

const unknownCollection = {
  info: {
    name: 'Unknown Collection',
    version: '1.0.0'
  }
}

const unknownWorkspaceCollection = {
  info: {
    name: 'Cloud API',
    version: '1.0.0'
  }
}

const cacheFile = `${process.cwd()}/tmp/.portman.jest.cache.json`
const successResponse = {
  status: 200,
  data: {
    collection: {
      id: '2412a72c-1d8e-491b-aced-93809c0e94e9',
      name: 'Sample Collection',
      uid: '5852-2412a72c-1d8e-491b-aced-93809c0e94e9'
    }
  }
}

const createCollectionSpy = jest
  .spyOn(PostmanApiService.prototype, 'createCollection')
  .mockResolvedValue(JSON.stringify(successResponse))

const updateCollectionSpy = jest
  .spyOn(PostmanApiService.prototype, 'updateCollection')
  .mockResolvedValue(JSON.stringify(successResponse))

beforeAll(() => {
  jest
    .spyOn(PostmanApiService.prototype, 'getWorkspaces')
    .mockResolvedValue(Either.right(workspacesJson.workspaces))

  jest
    .spyOn(PostmanApiService.prototype, 'getWorkspace')
    .mockResolvedValue(Either.right(workspaceJson.workspace))

  jest
    .spyOn(PostmanApiService.prototype, 'getCollections')
    .mockResolvedValue(Either.right(collectionsJson.collections))

  fs.ensureDirSync(`${process.cwd()}/tmp`)
})

beforeEach(() => {
  jest.clearAllMocks()
})

afterAll(() => {
  jest.restoreAllMocks
  fs.removeSync(cacheFile)
})

describe('PostmanSyncService', () => {
  let service = new PostmanSyncService({
    portmanCollection: knownCollection,
    cacheFile
  })

  it('initializes repo cache when one does not exist', async () => {
    try {
      await fs.rm(cacheFile)
    } catch (e) {
      // ignore
    }
    expect(await fs.pathExists(cacheFile)).toBe(false)

    await service.sync()
    expect(await fs.pathExists(cacheFile)).toBe(true)
  })

  describe('when postmanUid not provided', () => {
    it('will be set to create when collection does not exist', async () => {
      service = new PostmanSyncService({
        portmanCollection: unknownCollection,
        cacheFile
      })

      await service.sync()

      expect(service.state).toEqual(
        expect.objectContaining({
          shouldCreate: true,
          shouldUpdate: false,
          postmanUid: undefined
        })
      )

      expect(createCollectionSpy).toHaveBeenCalled()
    })

    it('will be set to update when collection exists', async () => {
      const service = new PostmanSyncService({
        portmanCollection: knownCollection,
        cacheFile
      })

      await service.sync()

      expect(service.state).toEqual(
        expect.objectContaining({
          shouldCreate: false,
          shouldUpdate: true,
          postmanUid: '631643-22eb0345-7fcb-4358-88bc-af234ffc8943'
        })
      )

      expect(updateCollectionSpy).toHaveBeenCalled()
    })
  })

  describe('when postmanUid provided', () => {
    it('will be set to create when collection does not exist', async () => {
      service = new PostmanSyncService({
        portmanCollection: knownCollection,
        postmanUid: 'FOO-f2e66c2e-BAR-e4a5-739e-BAZ',
        cacheFile
      })

      await service.sync()

      expect(service.state).toEqual(
        expect.objectContaining({
          shouldCreate: true,
          shouldUpdate: false,
          postmanUid: undefined
        })
      )

      expect(createCollectionSpy).toHaveBeenCalled()
    })

    it('will be set to update when collection exists', async () => {
      const service = new PostmanSyncService({
        portmanCollection: knownCollection,
        postmanUid: '631643-f2e66c2e-5297-e4a5-739e-20cbb90900e3',
        cacheFile
      })

      await service.sync()

      expect(service.state).toEqual(
        expect.objectContaining({
          shouldCreate: false,
          shouldUpdate: true,
          postmanUid: '631643-f2e66c2e-5297-e4a5-739e-20cbb90900e3'
        })
      )
      expect(updateCollectionSpy).toHaveBeenCalled()
    })
  })

  describe('When Workspace Name not provided', () => {
    beforeEach(async () => {
      await service.sync()
    })

    it('be set to create when collection is not known', async () => {
      service = new PostmanSyncService({
        portmanCollection: unknownCollection,
        cacheFile
      })

      await service.sync()

      expect(service.state).toEqual(
        expect.objectContaining({ shouldCreate: true, shouldUpdate: false })
      )
      expect(createCollectionSpy).toHaveBeenCalled()
    })

    it('be set to update when collection is known', async () => {
      service = new PostmanSyncService({
        portmanCollection: knownCollection,
        cacheFile
      })
      await service.sync()

      expect(service.state).toEqual(
        expect.objectContaining({ shouldCreate: false, shouldUpdate: true })
      )
      expect(updateCollectionSpy).toHaveBeenCalled()
    })
  })

  describe('When Workspace Name provided', () => {
    let service = new PostmanSyncService({
      portmanCollection: knownCollection,
      postmanWorkspaceName: 'My Workspace',
      cacheFile
    })

    it('should use the workspaceName to get the workspaceId', async () => {
      await service.sync()

      expect(service.state).toEqual(
        expect.objectContaining({
          shouldCreate: false,
          workspaceId: '4e6d34c2-cfdb-4b33-8868-12a875bebda3'
        })
      )
      expect(updateCollectionSpy).toHaveBeenCalled()
    })

    it('should throw new Error() when workspaceName not found', async () => {
      service = new PostmanSyncService({
        portmanCollection: unknownCollection,
        postmanWorkspaceName: 'Unknown Workspace',
        cacheFile
      })

      await expect(service.sync()).rejects.toThrow(
        new Error('Could not find workspace with name Unknown Workspace')
      )
      expect(createCollectionSpy).not.toHaveBeenCalled()
      expect(updateCollectionSpy).not.toHaveBeenCalled()
    })

    describe('when collection is found and exists in resolved workspace', () => {
      const service = new PostmanSyncService({
        portmanCollection: knownCollection,
        postmanWorkspaceName: 'My Workspace',
        cacheFile
      })

      it('should update collection with workspaceId', async () => {
        await service.sync()

        expect(service.state).toEqual(
          expect.objectContaining({
            shouldCreate: false,
            shouldUpdate: true,
            postmanUid: '631643-22eb0345-7fcb-4358-88bc-af234ffc8943'
          })
        )
        expect(updateCollectionSpy).toHaveBeenCalled()
      })
    })

    describe('when collection is found but not in the resolved workspace', () => {
      const service = new PostmanSyncService({
        portmanCollection: unknownWorkspaceCollection,
        postmanWorkspaceName: 'My Workspace',
        cacheFile
      })

      it('should create collection with workspaceId', async () => {
        await service.sync()

        expect(service.state).toEqual(
          expect.objectContaining({
            shouldCreate: true,
            shouldUpdate: false,
            postmanUid: undefined
          })
        )

        expect(createCollectionSpy).toHaveBeenCalled()
      })
    })
  })
})
