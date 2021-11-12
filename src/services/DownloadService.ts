import axios from 'axios'
import { createWriteStream } from 'fs'

export class DownloadService {
  async get(url: string): Promise<string> {
    try {
      const res = await axios({
        method: 'get',
        url: url,
        responseType: 'stream'
      })
      const fileName = url.replace(/\/$/, '').split('/').pop()
      const filePath = `./tmp/${fileName}`

      return await new Promise((resolve, reject) => {
        const fileStream = createWriteStream(filePath)
        res.data.pipe(fileStream)
        res.data.on('error', err => {
          reject(err.toString())
        })
        fileStream.on('finish', () => {
          resolve(filePath)
        })
      })
    } catch (axiosError) {
      console.error('\x1b[31m', `OAS URL error - There is a problem with the url: "${url}"`)
      console.error('\x1b[31m', axiosError.message)
      process.exit(1)
    }
  }
}
