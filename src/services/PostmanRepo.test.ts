import * as Either from 'fp-ts/lib/Either'
import fs from 'fs-extra'
import { PostmanApiService } from './PostmanApiService'
import { PostmanRepo } from './PostmanRepo'
import { omitKeys } from '../utils'
const workspacesJson = JSON.parse(
  fs.readFileSync('__tests__/fixtures/api_workspaces.json').toString()
)

const collectionsJson = JSON.parse(
  fs.readFileSync('__tests__/fixtures/api_collections.json').toString()
)

const cacheFile = `${process.cwd()}/tmp/.portman.jest.cache.json`
const repo = new PostmanRepo(cacheFile, new PostmanApiService())

beforeAll(() => {
  jest
    .spyOn(PostmanApiService.prototype, 'getWorkspaces')
    .mockResolvedValue(Either.right(workspacesJson.workspaces))

  jest
    .spyOn(PostmanApiService.prototype, 'getCollections')
    .mockResolvedValue(Either.right(collectionsJson.collections))

  fs.ensureDirSync(`${process.cwd()}/tmp`)
})

afterAll(() => {
  jest.restoreAllMocks
  fs.removeSync(cacheFile)
})

describe('PostmanRepo', () => {
  it('initializes cache when one does not exist', async () => {
    try {
      await fs.rm(cacheFile)
    } catch (e) {
      // ignore
    }
    expect(await fs.pathExists(cacheFile)).toBe(false)

    await repo.initCache()
    expect(await fs.pathExists(cacheFile)).toBe(true)
  })

  it('should read from existing cache', async () => {
    await fs.writeFile(
      cacheFile,
      JSON.stringify({
        workspaces: [
          {
            id: '10c04cfb-e0b8-448b-84d9-c37974957ff2',
            name: 'Unified APIs',
            type: 'team'
          }
        ]
      })
    )
    await repo.initCache(true, true)
    expect(
      omitKeys(repo.cache, ['collectionsLastUpdated', 'workspacesLastUpdated'])
    ).toMatchSnapshot()
  })

  it('should be able to retrieve collection by case-insensitive name', async () => {
    await repo.initCache()

    const collection = await repo.findCollectionByName('Sample CollectioN')

    expect(collection).toBeDefined()
    expect(collection).toMatchSnapshot()
  })

  it('should be able to retrieve collection by Uid', async () => {
    await repo.initCache()
    const collection = await repo.findCollectionByUid('631643-dac5eac9-148d-a32e-b76b-3edee9da28f7')
    expect(collection).toBeDefined()
    expect(collection).toMatchSnapshot()
  })

  it('should be able to retrieve workspace by case-insensitive name', async () => {
    await repo.initCache()

    const workspace = await repo.findWorkspaceByName('TeaM WorkSpace')

    expect(workspace).toBeDefined()
    expect(workspace).toMatchSnapshot()
  })

  it('should be able to retrieve workspace by id', async () => {
    await repo.initCache()
    const workspace = await repo.findWorkspaceById('4e6d34c2-cfdb-4b33-8868-12a875bebda3')

    expect(workspace).toBeDefined()
    expect(workspace).toMatchSnapshot()
  })
})
