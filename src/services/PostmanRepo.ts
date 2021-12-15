import * as Either from 'fp-ts/lib/Either'
import fs from 'fs-extra'
import {
  PostmanApiCollectionResult,
  PostmanApiService,
  PostmanApiWorkspaceDetailResult,
  PostmanApiWorkspaceResult
} from 'services'

export type PostmanCache = {
  collections: PostmanApiCollectionResult[]
  workspaces: PostmanApiWorkspaceResult[]
  workspace?: PostmanApiWorkspaceDetailResult
  collectionsLastUpdated: number
  workspacesLastUpdated: number
}

export class PostmanRepo {
  public cache: PostmanCache

  constructor(private cacheFile: string, private postmanApi: PostmanApiService) {
    this.cacheFile = cacheFile
  }

  async initCache(
    refreshCollectionCache?: boolean,
    refreshWorkspaceCache?: boolean
  ): Promise<void> {
    try {
      this.cache = await fs.readJSON(this.cacheFile)
    } catch (error) {
      this.cache = {
        collectionsLastUpdated: new Date().getTime(),
        workspacesLastUpdated: new Date().getTime(),
        collections: [],
        workspaces: []
      }
      await this.persistCache()
    }

    // Check cache expiration
    const oneHour = 60 * 60 * 1000
    const collExpired = new Date().getTime() - this.cache?.workspacesLastUpdated > oneHour // expire after 1h
    const workspaceExpired = new Date().getTime() - this.cache?.workspacesLastUpdated > oneHour // expire after 1h

    if (refreshCollectionCache || this.cache?.collections?.length === 0 || collExpired) {
      await this.getCollections()
    }
    if (refreshWorkspaceCache || this.cache?.workspaces?.length === 0 || workspaceExpired) {
      await this.getWorkspaces()
    }

    this.cache = await fs.readJSON(this.cacheFile)
  }

  async persistCache(): Promise<void> {
    this.cache.collectionsLastUpdated = new Date().getTime()
    this.cache.workspacesLastUpdated = new Date().getTime()
    await fs.writeJSON(this.cacheFile, this.cache)
  }

  async getWorkspaces(): Promise<PostmanApiWorkspaceResult[]> {
    const workspacesResult = await this.postmanApi.getWorkspaces()
    if (Either.isLeft(workspacesResult)) {
      throw workspacesResult.left
    }
    const workspaces = workspacesResult.right
    this.cache.workspaces = workspaces as PostmanApiWorkspaceResult[]

    await this.persistCache()
    return workspaces
  }

  async getWorkspace(id: string): Promise<PostmanApiWorkspaceDetailResult> {
    const workspaceResult = await this.postmanApi.getWorkspace(id)
    if (Either.isLeft(workspaceResult)) {
      throw workspaceResult.left
    }
    const workspace = workspaceResult.right
    this.cache.workspace = workspace as PostmanApiWorkspaceDetailResult

    await this.persistCache()
    return workspace
  }

  // get collections and caches them
  async getCollections(): Promise<PostmanApiCollectionResult[]> {
    const collectionsResult = await this.postmanApi.getCollections()
    if (Either.isLeft(collectionsResult)) {
      throw collectionsResult.left
    }
    const collections = collectionsResult.right
    this.cache.collections = collections as PostmanApiCollectionResult[]

    await this.persistCache()
    return collections
  }

  findCollectionByName(name: string): PostmanApiCollectionResult | undefined {
    if (!this.cache.collections) {
      return undefined
    }

    const results = this.cache.collections.filter(
      collection => collection.name.toLowerCase() === name.toLowerCase()
    )

    if (results.length === 0) {
      return undefined
    }

    if (results.length > 1) {
      console.log(
        `\n    Note: Multiple Postman collection found matching "${name}", the most recent collection is updated.`
      )

      results.sort((a, b) => {
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      })
    }

    return results[0]
  }

  findCollectionByUid(uid: string): PostmanApiCollectionResult | undefined {
    if (!this.cache.collections) {
      return undefined
    }

    return this.cache.collections.find(collection => collection.uid === uid)
  }

  findWorkspaceCollectionByName(name: string): unknown | undefined {
    if (!this.cache.workspace || !name) {
      return undefined
    }

    const collections = this.cache.workspace.collections ?? []
    const results = collections.filter(
      collection => collection.name.toLowerCase() === name.toLowerCase()
    )

    if (results.length === 0) {
      return undefined
    }

    return results[0] as Partial<PostmanApiCollectionResult>
  }

  findWorkspaceByName(name: string): PostmanApiWorkspaceResult | undefined {
    if (!this.cache.workspaces) {
      return undefined
    }

    return this.cache.workspaces.find(
      workspace => workspace.name.toLowerCase() === name.toLowerCase()
    )
  }

  findWorkspaceById(id: string): PostmanApiWorkspaceResult | undefined {
    if (!this.cache.workspaces) {
      return undefined
    }

    return this.cache.workspaces.find(workspace => workspace.id === id)
  }
}
