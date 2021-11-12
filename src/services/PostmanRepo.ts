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
}

export class PostmanRepo {
  public cache: PostmanCache

  constructor(private cacheFile: string, private postmanApi: PostmanApiService) {
    this.cacheFile = cacheFile
  }

  async initCache(): Promise<void> {
    try {
      this.cache = await fs.readJSON(this.cacheFile)
    } catch (error) {
      this.cache = {
        collections: [],
        workspaces: []
      }
      await this.persistCache()
    }

    await this.getCollections()
    await this.getWorkspaces()

    this.cache = await fs.readJSON(this.cacheFile)
  }

  async persistCache(): Promise<void> {
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
    if (!this.cache.workspace) {
      return undefined
    }

    const results = this.cache.workspace.collections.filter(
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
