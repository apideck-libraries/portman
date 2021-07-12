import { createWriteStream } from 'fs'
import fetch from 'node-fetch'

export class DownloadService {
  async get(url: string): Promise<string> {
    const res = await fetch(url)
    const fileName = url.replace(/\/$/, '').split('/').pop()
    const filePath = `./tmp/${fileName}`

    return await new Promise((resolve, reject) => {
      const fileStream = createWriteStream(filePath)
      res.body.pipe(fileStream)
      res.body.on('error', err => {
        reject(err.toString())
      })
      fileStream.on('finish', () => {
        resolve(filePath)
      })
    })
  }
}
