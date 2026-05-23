import chalk from 'chalk'
import * as Either from 'fp-ts/lib/Either'
import ora from 'ora'
import { CollectionDefinition } from 'postman-collection'

type RequestConfig = {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE'
  url: string
  headers: Record<string, string>
  body?: string
}

type RequestResult = {
  status?: number
  statusText?: string
  data: unknown
}

type RequestError = {
  code?: string
  response?: RequestResult
  toJSON?: () => unknown
  toString: () => string
}

export type PostmanApiWorkspaceResult = {
  id: string
  name: string
  type: string
}

export type PostmanApiWorkspaceDetailResult = {
  id: string
  name: string
  type: string
  description: string
  createdAt: string
  updatedAt: string
  collections: [
    {
      id: string
      uid: string
      name: string
    }
  ]
}

export type PostmanApiCollectionResult = {
  id: string
  uid: string
  name: string
  owner: string
  isPublic: boolean
  createdAt: string
  updatedAt: string
}

export class PostmanApiService {
  private baseUrl: string
  private apiKey: string

  constructor() {
    this.baseUrl = 'https://api.getpostman.com'
    this.apiKey = `${process.env.POSTMAN_API_KEY}`
  }

  private async parseResponseData(response: Response): Promise<unknown> {
    const responseText = await response.text()

    if (!responseText) {
      return undefined
    }

    try {
      return JSON.parse(responseText)
    } catch (error) {
      return responseText
    }
  }

  private normalizeNetworkError(error: unknown): RequestError {
    const err = error as {
      code?: string
      toString?: () => string
    }

    return {
      code: err?.code || 'FETCH_ERROR',
      toJSON: undefined,
      toString: () => (err?.toString ? err.toString() : String(error))
    }
  }

  private async request<T = unknown>(
    config: RequestConfig,
    spinner?: {
      onRequest?: () => void
      onResponse?: (statusCode: number) => void
    }
  ): Promise<RequestResult> {
    spinner?.onRequest?.()

    let response: Response
    try {
      response = await fetch(config.url, {
        method: config.method,
        headers: config.headers,
        body: config.body
      })
    } catch (error) {
      throw this.normalizeNetworkError(error)
    }

    spinner?.onResponse?.(response.status)

    const data = await this.parseResponseData(response)

    if (!response.ok) {
      throw {
        response: {
          status: response.status,
          statusText: response.statusText,
          data
        },
        toString: () => `Error: Request failed with status code ${response.status}`
      } as RequestError
    }

    return {
      status: response.status,
      statusText: response.statusText,
      data: data as T
    }
  }

  async getWorkspaces(): Promise<Either.Either<string, PostmanApiWorkspaceResult[]>> {
    const config = {
      method: 'GET',
      url: `${this.baseUrl}/workspaces`,
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': this.apiKey
      }
    } as RequestConfig

    try {
      const res = await this.request(config)
      const data = res.data as { workspaces?: PostmanApiWorkspaceResult[] }

      if (Array.isArray(data?.workspaces)) {
        return Either.right(data.workspaces)
      } else {
        return Either.left('No workspaces found')
      }
    } catch (error) {
      return Either.left(`Postman API List Workspaces ${String(error)}`)
    }
  }

  async getWorkspace(id: string): Promise<Either.Either<string, PostmanApiWorkspaceDetailResult>> {
    const config = {
      method: 'GET',
      url: `${this.baseUrl}/workspaces/${id}`,
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': this.apiKey
      }
    } as RequestConfig

    try {
      const res = await this.request(config)
      const data = res.data as { workspace?: PostmanApiWorkspaceDetailResult }

      if (data?.workspace) {
        return Either.right(data.workspace)
      } else {
        return Either.left('Workspace not found')
      }
    } catch (error) {
      return Either.left(`Postman API Get Workspace ${String(error)} (Workspace ID: ${id})`)
    }
  }

  async getCollections(): Promise<Either.Either<string, PostmanApiCollectionResult[]>> {
    const config = {
      method: 'GET',
      url: `${this.baseUrl}/collections`,
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': this.apiKey
      }
    } as RequestConfig

    try {
      const res = await this.request(config)
      const data = res.data as { collections?: PostmanApiCollectionResult[] }

      if (Array.isArray(data?.collections)) {
        return Either.right(data.collections)
      } else {
        return Either.left('No collections found')
      }
    } catch (error) {
      return Either.left(`Postman API Get Collections ${String(error)}`)
    }
  }

  async getCollection(collectionId: string): Promise<Either.Either<string, CollectionDefinition>> {
    const config = {
      method: 'GET',
      url: `${this.baseUrl}/collections/${collectionId}`,
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': this.apiKey
      }
    } as RequestConfig

    try {
      const res = await this.request(config)
      const data = res.data as {
        collection?: { info?: { _postman_id?: string } } & CollectionDefinition
      }

      collectionId = collectionId.replace(`${collectionId.split('-')[0]}-`, '')

      if (data?.collection?.info?._postman_id === collectionId) {
        return Either.right(data.collection)
      } else {
        return Either.left(`The collection with the id "${collectionId}" was not found.`)
      }
    } catch (error) {
      return Either.left(`Postman API Get Collections ${String(error)}`)
    }
  }

  async createCollection(collection: CollectionDefinition, workspaceId?: string): Promise<string> {
    const data = JSON.stringify({
      collection: collection
    })
    const workspaceIdParam = workspaceId ? `?workspace=${workspaceId}` : ''
    const config = {
      method: 'POST',
      url: `${this.baseUrl}/collections${workspaceIdParam}`,
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': this.apiKey
      },
      body: data
    } as RequestConfig

    const spinner = ora({
      prefixText: ' ',
      text: 'Creating collection in Postman ...\n'
    })

    // Start Spinner
    spinner.start()
    let responseStatusCode: number | string | undefined

    try {
      let response: RequestResult | undefined
      let error: RequestError | undefined

      try {
        response = await this.request(config, {
          onRequest: () => {
            spinner.text = `Executing Request. Waiting on response...\n`
          },
          onResponse: statusCode => {
            spinner.text = `Response Received: ${statusCode}\n`
            responseStatusCode = statusCode
          }
        })
      } catch (err) {
        error = err as RequestError
        response = error?.response
        responseStatusCode = error?.response?.status || error?.code
      }

      const respData = response?.data

      if (typeof responseStatusCode === 'number' && responseStatusCode < 300) {
        spinner.succeed('Upload to Postman Success')
        return JSON.stringify({ status: 'success', data: respData }, null, 2)
      } else {
        const errorData =
          error?.response?.data || error?.response || error?.toJSON?.() || error?.toString()
        spinner.fail(chalk.red(`Upload to Postman Failed with status: ${responseStatusCode}`))
        return JSON.stringify(
          { status: 'fail', data: respData !== undefined ? respData : errorData },
          null,
          2
        )
      }
    } catch (error) {
      const err = error as RequestError
      spinner.fail(chalk.red(`Upload to Postman Failed: ${responseStatusCode}`))
      spinner.clear()
      return JSON.stringify(
        {
          status: 'fail',
          data: err?.response?.data || err?.response || err?.toJSON?.() || err?.toString()
        },
        null,
        2
      )
    }
  }

  async updateCollection(
    collection: CollectionDefinition,
    postmanUid: string,
    workspaceId?: string
  ): Promise<string> {
    const data = JSON.stringify({
      collection: collection
    })
    const workspaceIdParam = workspaceId ? `?workspace=${workspaceId}` : ''
    const config = {
      method: 'PUT',
      url: `${this.baseUrl}/collections/${postmanUid}${workspaceIdParam}`,
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': this.apiKey
      },
      body: data
    } as RequestConfig

    const spinner = ora({
      prefixText: ' ',
      text: 'Updating collection in Postman ...\n'
    })

    // Start Spinner
    spinner.start()
    let responseStatusCode: number | string | undefined
    let responseStatusMessage: string | undefined

    try {
      let response: RequestResult | undefined
      let error: RequestError | undefined

      try {
        response = await this.request(config, {
          onRequest: () => {
            spinner.text = `Executing Request. Waiting on response...\n`
          },
          onResponse: statusCode => {
            spinner.text = `Response Received: ${statusCode}\n`
            responseStatusCode = statusCode
          }
        })
        responseStatusMessage = response.statusText
      } catch (err) {
        error = err as RequestError
        response = error?.response
        responseStatusCode = error?.response?.status || error?.code
        responseStatusMessage = error?.response?.statusText || error?.code
      }

      const respData = response?.data ?? {}

      if (typeof responseStatusCode === 'number' && responseStatusCode < 300) {
        spinner.succeed(`Upload to Postman Succeeded`)
      } else {
        spinner.succeed(
          `Upload to Postman completed with status: ${responseStatusCode} - ${responseStatusMessage} \n\n Please review your collection within Postman as they can respond with a 5xx but still import your collection`
        )
      }
      return JSON.stringify(
        {
          status: 'success',
          data: { ...((respData as Record<string, unknown>) || {}), collection }
        },
        null,
        2
      )
    } catch (error) {
      const err = error as RequestError
      spinner.fail(
        chalk.red(`Upload to Postman Failed: ${responseStatusCode} - ${responseStatusMessage}`)
      )
      spinner.clear()
      return JSON.stringify(
        {
          status: 'fail',
          data: err?.response?.data || err?.response || err?.toJSON?.() || err?.toString()
        },
        null,
        2
      )
    }
  }

  async deleteCollection(postmanUid: string): Promise<string> {
    const config = {
      method: 'DELETE',
      url: `${this.baseUrl}/collections/${postmanUid}`,
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': this.apiKey
      }
    } as RequestConfig

    const spinner = ora({
      prefixText: ' ',
      text: 'Deleting collection in Postman ...\n'
    })

    // Start Spinner
    spinner.start()
    let responseStatusCode: number | string | undefined

    try {
      let response: RequestResult | undefined
      let error: RequestError | undefined

      try {
        response = await this.request(config, {
          onRequest: () => {
            spinner.text = `Executing Request. Waiting on response...\n`
          },
          onResponse: statusCode => {
            spinner.text = `Response Received: ${statusCode}\n`
            responseStatusCode = statusCode
          }
        })
      } catch (err) {
        error = err as RequestError
        response = error?.response
        responseStatusCode = error?.response?.status || error?.code
      }

      const respData = response?.data ?? {}

      if (
        (typeof responseStatusCode === 'number' && responseStatusCode < 300) ||
        responseStatusCode === 404
      ) {
        spinner.succeed(`Delete from Postman Completed`)
        return JSON.stringify(
          { status: 'success', data: { ...((respData as Record<string, unknown>) || {}) } },
          null,
          2
        )
      } else {
        spinner.fail(`Delete from Postman Failed: ${responseStatusCode}`)
        spinner.clear()
        return JSON.stringify(
          {
            status: 'fail',
            data: error?.response?.data || error?.response || error?.toJSON?.() || error?.toString()
          },
          null,
          2
        )
      }
    } catch (error) {
      const err = error as RequestError
      spinner.fail(chalk.red(`Delete from Postman Failed: ${responseStatusCode}`))
      spinner.clear()
      return JSON.stringify(
        {
          status: 'fail',
          data: err?.response?.data || err?.response || err?.toJSON?.() || err?.toString()
        },
        null,
        2
      )
    }
  }

  isGuid(value: string | undefined): boolean {
    return /^\{?[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}\}?$/.test(
      <string>value
    )
  }
}
