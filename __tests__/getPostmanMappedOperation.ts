import fs from 'fs-extra'
import { OpenApiParser, PostmanParser } from '../src/application'
import { PostmanMappedOperation } from '../src/lib'

export const getPostmanMappedOperation = async (): Promise<PostmanMappedOperation> => {
  const postmanJson = '__tests__/fixtures/crm.postman.json'
  const oasYml = '__tests__/fixtures/crm.yml'

  const oasParser = new OpenApiParser()
  await oasParser.convert({ inputFile: oasYml })
  const postmanObj = JSON.parse(fs.readFileSync(postmanJson).toString())
  const postmanParser = new PostmanParser({ postmanObj: postmanObj, oasParser: oasParser })
  return postmanParser.mappedOperations[2]
}
