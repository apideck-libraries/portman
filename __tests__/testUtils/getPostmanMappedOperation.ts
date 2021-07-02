import fs from 'fs-extra'
import { Collection } from 'postman-collection'
import { OpenApiParser } from '../../src/oas'
import { PostmanMappedOperation, PostmanParser } from '../../src/postman'

const postmanJson = '__tests__/fixtures/crm.postman.json'
const oasYml = '__tests__/fixtures/crm.yml'
const oasParser = new OpenApiParser()

export const getPostmanMappedOperation = async (): Promise<PostmanMappedOperation> => {
  await oasParser.convert({ inputFile: oasYml })
  const postmanObj = JSON.parse(fs.readFileSync(postmanJson).toString())
  const postmanParser = new PostmanParser({
    collection: new Collection(postmanObj),
    oasParser: oasParser
  })
  return postmanParser.mappedOperations[2]
}

export const getPostmanMappedCreateOperation = async (): Promise<PostmanMappedOperation> => {
  await oasParser.convert({ inputFile: oasYml })
  const postmanObj = JSON.parse(fs.readFileSync(postmanJson).toString())
  const postmanParser = new PostmanParser({
    collection: new Collection(postmanObj),
    oasParser: oasParser
  })
  return postmanParser.mappedOperations[1]
}
