import { createWriteStream } from 'fs'
import axios from 'axios'

export class DownloadService {
  async get(url: string): Promise<string> {
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
  }
}
