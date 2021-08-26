import axios, { AxiosRequestConfig } from 'axios'
import chalk from 'chalk'
import ora from 'ora'
import { CollectionDefinition } from 'postman-collection'

export class PostmanApiService {
  private baseUrl: string
  private apiKey: string

  constructor() {
    this.baseUrl = 'https://api.getpostman.com'
    this.apiKey = `${process.env.POSTMAN_API_KEY}`
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
      text: 'Uploading & creating collection in Postman ...\n'
    })

    // Start Spinner
    spinner.start()

    try {
      axios.interceptors.request.use(req => {
        return req
      })

      const res = await axios(config)
      const respData = res.data

      spinner.succeed('Upload to Postman Success')
      return JSON.stringify({ status: 'success', data: respData }, null, 2)
    } catch (error) {
      spinner.fail(chalk.red(`Upload to Postman Failed`))
      spinner.clear()
      return JSON.stringify({ status: 'fail', data: error?.response?.data }, null, 2)
    }
  }

  async updateCollection(
    collection: CollectionDefinition,
    uuid: string,
    workspaceId?: string
  ): Promise<string> {
    const data = JSON.stringify({
      collection: collection
    })
    const workspaceIdParam = workspaceId ? `?workspace=${workspaceId}` : ''
    const config = {
      method: 'put',
      url: `${this.baseUrl}/collections/${uuid}${workspaceIdParam}`,
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': this.apiKey
      },
      data: data
    } as AxiosRequestConfig

    const spinner = ora({
      prefixText: ' ',
      text: 'Uploading & updating collection in Postman ...\n'
    })

    // Start Spinner
    spinner.start()

    try {
      axios.interceptors.request.use(req => {
        return req
      })

      const res = await axios(config)
      const respData = res.data

      spinner.succeed('Upload to Postman Success')
      return JSON.stringify({ status: 'success', data: respData }, null, 2)
    } catch (error) {
      spinner.fail(chalk.red(`Upload to Postman Failed`))
      spinner.clear()
      return JSON.stringify({ status: 'fail', data: error?.response?.data }, null, 2)
    }
  }

  async findCollectionByName(collName: string): Promise<CollectionDefinition> {
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
      let match = {}

      if (data.collections) {
        // Match all items by name, since Postman API does not support filtering by name
        const matches = data.collections.filter((o: CollectionDefinition) => {
          if (!o?.name) return
          return (
            o.name.toLowerCase().replace(/\s/g, '') === collName.toLowerCase().replace(/\s/g, '')
          )
        })

        if (matches.length === 1) {
          match = matches[0]
        }
        if (matches.length > 1) {
          // Sort by date and take newest
          matches.sort((a, b) => {
            // Turn your strings into dates, and then subtract them
            // to get a value that is either negative, positive, or zero.

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            return <any>new Date(b.updatedAt) - <any>new Date(a.updatedAt)
          })
          console.log(
            `\nMultiple Postman collection matching "${collName}", the most recent collection is updated.`
          )
          match = matches[0]
        }
      }
      return match
    } catch (error) {
      console.log(error?.response?.data)
      return error.toString()
    }
  }

  async findWorkspaceCollectionByName(
    workspaceId: string,
    collName: string
  ): Promise<CollectionDefinition> {
    const config = {
      method: 'get',
      url: `${this.baseUrl}/workspaces/${workspaceId}`,
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': this.apiKey
      }
    } as AxiosRequestConfig

    try {
      const res = await axios(config)
      const data = res.data
      let match = {}

      if (data?.workspace.collections) {
        // Match all items by name, since Postman API does not support filtering by name
        const matches = data.workspace.collections.filter((o: CollectionDefinition) => {
          if (!o?.name) return
          return (
            o.name.toLowerCase().replace(/\s/g, '') === collName.toLowerCase().replace(/\s/g, '')
          )
        })

        if (matches.length === 1) {
          match = matches[0]
        }
        if (matches.length > 1) {
          // Sort by date and take newest
          matches.sort((a, b) => {
            // Turn your strings into dates, and then subtract them
            // to get a value that is either negative, positive, or zero.

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            return <any>new Date(b.updatedAt) - <any>new Date(a.updatedAt)
          })
          console.log(
            `\nMultiple Postman collection matching "${collName}" in the workspace, the most recent collection is updated.`
          )
          match = matches[0]
        }
      }
      return match
    } catch (error) {
      console.log(error?.response?.data)
      return error.toString()
    }
  }

  async findWorkspaceByName(workspaceName: string): Promise<CollectionDefinition> {
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
      let match = {}

      if (data.workspaces) {
        // Match all items by name, since Postman API does not support filtering by name
        const matches = data.workspaces.filter(
          (o: { id?: string; name?: string; type?: string }) => {
            if (!o?.name) return
            return (
              o.name.toLowerCase().replace(/\s/g, '') ===
              workspaceName.toLowerCase().replace(/\s/g, '')
            )
          }
        )

        if (matches.length === 1) {
          match = matches[0]
        }
        if (matches.length > 1) {
          // Sort by date and take newest
          matches.sort((a, b) => {
            // Turn your strings into dates, and then subtract them
            // to get a value that is either negative, positive, or zero.

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            return <any>new Date(b.updatedAt) - <any>new Date(a.updatedAt)
          })
          console.log(
            `\nMultiple Postman workspaces matching "${workspaceName}", the most recent workspace is updated.`
          )
          match = matches[0]
        }
      }
      return match
    } catch (error) {
      console.log(error?.response?.data)
      return error.toString()
    }
  }

  isGuid(value: string | undefined): boolean {
    return /^\{?[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}\}?$/.test(
      <string>value
    )
  }
}
