import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios'
import chalk from 'chalk'
import * as Either from 'fp-ts/lib/Either'
import ora from 'ora'
import { CollectionDefinition } from 'postman-collection'
import { Readable } from 'stream'

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

  async getWorkspaces(): Promise<Either.Either<string, PostmanApiWorkspaceResult[]>> {
    const config = {
      method: 'get',
      url: `${this.baseUrl}/workspaces`,
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': this.apiKey
      }
    } as AxiosRequestConfig

    try {
      const res = await axios(config)
      const data = res.data

      if (Array.isArray(data?.workspaces)) {
        return Either.right(data.workspaces)
      } else {
        return Either.left('No workspaces found')
      }
    } catch (error) {
      return Either.left(error.toString())
    }
  }

  async getWorkspace(id: string): Promise<Either.Either<string, PostmanApiWorkspaceDetailResult>> {
    const config = {
      method: 'get',
      url: `${this.baseUrl}/workspaces/${id}`,
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': this.apiKey
      }
    } as AxiosRequestConfig

    try {
      const res = await axios(config)
      const data = res.data

      if (data?.workspace) {
        return Either.right(data.workspace)
      } else {
        return Either.left('Workspace not found')
      }
    } catch (error) {
      return Either.left(error.toString())
    }
  }

  async getCollections(): Promise<Either.Either<string, PostmanApiCollectionResult[]>> {
    const config = {
      method: 'get',
      url: `${this.baseUrl}/collections`,
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': this.apiKey
      }
    } as AxiosRequestConfig

    try {
      const res = await axios(config)
      const data = res.data

      if (Array.isArray(data?.collections)) {
        return Either.right(data.collections)
      } else {
        return Either.left('No collections found')
      }
    } catch (error) {
      return Either.left(error.toString())
    }
  }

  async createCollection(collection: CollectionDefinition, workspaceId?: string): Promise<string> {
    const data = JSON.stringify({
      collection: collection
    })
    const workspaceIdParam = workspaceId ? `?workspace=${workspaceId}` : ''
    const config = {
      method: 'post',
      url: `${this.baseUrl}/collections${workspaceIdParam}`,
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': this.apiKey
      },
      data: data
    } as AxiosRequestConfig

    const spinner = ora({
      prefixText: ' ',
      text: 'Creating collection in Postman ...\n'
    })

    // Start Spinner
    spinner.start()
    let responseStatusCode

    try {
      axios.interceptors.request.use(req => {
        spinner.text = `Executing Request. Waiting on response...\n`
        return req
      })

      axios.interceptors.response.use(
        response => {
          spinner.text = `Response Received: ${response?.status}\n`

          responseStatusCode = response.status
          return response
        },
        error => {
          // Some errors don't have a response
          if (!error.response) {
            error.response = {}
          }
          responseStatusCode = error?.response?.status || error?.code
          return error
        }
      )

      let response: AxiosResponse<Readable> | undefined
      let error: AxiosError | undefined

      try {
        response = await axios.request(config)
      } catch (err) {
        error = err
        response = error?.response
      }

      const respData = response?.data

      spinner.succeed('Upload to Postman Success')
      return JSON.stringify({ status: 'success', data: respData }, null, 2)
    } catch (error) {
      spinner.fail(chalk.red(`Upload to Postman Failed: ${responseStatusCode}`))
      spinner.clear()
      return JSON.stringify(
        {
          status: 'fail',
          data: error?.response?.data || error.response || error?.toJSON() || error?.toString()
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
      method: 'put',
      url: `${this.baseUrl}/collections/${postmanUid}${workspaceIdParam}`,
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': this.apiKey
      },
      data: data
    } as AxiosRequestConfig

    const spinner = ora({
      prefixText: ' ',
      text: 'Updating collection in Postman ...\n'
    })

    // Start Spinner
    spinner.start()
    let responseStatusCode

    try {
      axios.interceptors.request.use(req => {
        spinner.text = `Executing Request. Waiting on response...\n`
        return req
      })

      axios.interceptors.response.use(
        response => {
          spinner.text = `Response Received: ${response?.status}\n`

          responseStatusCode = response.status
          return response
        },
        error => {
          // Some errors don't have a response
          if (!error.response) {
            error.response = {}
          }
          responseStatusCode = error?.response?.status || error?.code
          return error
        }
      )

      let response: AxiosResponse<Readable> | undefined
      let error: AxiosError | undefined

      try {
        response = await axios.request(config)
      } catch (err) {
        error = err
        response = error?.response
      }

      const respData = response?.data ?? {}

      if (responseStatusCode < 300) {
        spinner.succeed(`Upload to Postman Succeeded`)
      } else {
        spinner.succeed(
          `Upload to Postman completed with status: ${responseStatusCode}. \n\n Please review your collection within Postman as they can respond with a 504 timeout but still import your collection`
        )
      }
      return JSON.stringify({ status: 'success', data: { ...respData, collection } }, null, 2)
    } catch (error) {
      spinner.fail(chalk.red(`Upload to Postman Failed: ${responseStatusCode}`))
      spinner.clear()
      return JSON.stringify(
        {
          status: 'fail',
          data: error?.response?.data || error.response || error?.toJSON() || error?.toString()
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
