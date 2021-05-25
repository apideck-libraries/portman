import axios, { AxiosRequestConfig } from 'axios'
import chalk from 'chalk'
import ora from 'ora'
import { CollectionDefinition } from 'postman-collection'

export class PostmanService {
  private baseUrl: string
  private apiKey: string

  constructor() {
    this.baseUrl = 'https://api.getpostman.com'
    this.apiKey = `${process.env.POSTMAN_API_KEY}`
  }

  async createCollection(collection: CollectionDefinition): Promise<string> {
    const consoleLine = '='.repeat(process.stdout.columns - 80)
    const data = JSON.stringify({
      collection: collection
    })

    const config = {
      method: 'post',
      url: `${this.baseUrl}/collections`,
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': this.apiKey
      },
      data: data
    } as AxiosRequestConfig

    try {
      const res = await axios(config)
      const data = res.data
      console.log('Upload to Postman Success:', data)
      return JSON.stringify(data, null, 2)
    } catch (error) {
      console.log(chalk.red(consoleLine))
      console.log(
        chalk.red(`Upload to Postman Failed'
      `)
      )
      console.log(error?.response?.data)
      console.log(`\n`)
      console.log(chalk.red(consoleLine))
      return error.toString()
    }
  }

  async updateCollection(collection: CollectionDefinition, uuid: string): Promise<string> {
    const consoleLine = '='.repeat(process.stdout.columns - 80)
    const data = JSON.stringify({
      collection: collection
    })

    const config = {
      method: 'put',
      url: `${this.baseUrl}/collections/${uuid}`,
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': this.apiKey
      },
      data: data
    } as AxiosRequestConfig

    const spinner = ora({
      prefixText: ' ',
      text: 'Uploading to Postman ...'
    })

    try {
      axios.interceptors.request.use(req => {
        spinner.start()
        return req
      })

      const res = await axios(config)
      const data = res.data

      spinner.succeed('Upload to Postman Success')

      console.log(chalk`{cyan    -> Name: } \t\t{green ${data?.collection?.name}}`)
      console.log(chalk`{cyan    -> UID: } \t\t{green ${data?.collection?.uid}}`)
      return JSON.stringify(data, null, 2)
    } catch (error) {
      console.log(chalk.red(consoleLine))
      spinner.fail(chalk.red(`Upload to Postman Failed`))
      console.log(error?.response?.data)
      console.log(`\n`)
      console.log(chalk.red(consoleLine))
      return error.toString()
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
            '\nMultiple Postman collection matching "' +
              collName +
              '", the most recent collection is updated.'
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
