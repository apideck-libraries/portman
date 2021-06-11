import fs from 'fs-extra'
import path from 'path'
import { Collection } from 'postman-collection'

export const getPostmanCollection = (): Collection => {
  const postmanJson = path.resolve('__tests__/fixtures/crm.postman.json')
  const postmanObj = JSON.parse(fs.readFileSync(postmanJson).toString())
  const collection = new Collection(postmanObj)
  return collection
}
