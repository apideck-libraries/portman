import axios, { AxiosRequestConfig } from 'axios'
import chalk from 'chalk'
import { CollectionDefinition } from 'postman-collection'

export class PostmanService {
  private baseUrl: string
  private apiKey: string

  constructor() {
    this.baseUrl = 'https://api.getpostman.com'
    this.apiKey = `${process.env.POSTMAN_API_KEY}`
  }

  async updateCollection(collection: CollectionDefinition, uuid: string): Promise<string> {
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

    try {
      const res = await axios(config)
      const data = res.data
      console.log('Upload to Postman Success:', data)
      return JSON.stringify(data, null, 2)
    } catch (error) {
      console.log(
        chalk.red(`=================================================================
      `)
      )
      console.log(
        chalk.red(`Upload to Postman Failed'
      `)
      )
      console.log(error?.response?.data)
      console.log(`\n`)
      console.log(
        chalk.red(`=================================================================
      `)
      )
      return error.toString()
    }
  }
}
