import fs from 'fs-extra'
import { Collection } from 'postman-collection'
import { OpenApiParser } from '../oas'
import { PostmanMappedOperation, PostmanParser } from '../postman'

describe('OpenAPI methods', () => {
  let postmanParser: PostmanParser
  let oasParser: OpenApiParser
  let mappedOperation: PostmanMappedOperation

  const postmanJson = '__tests__/fixtures/oas.methods.json'
  const oasYml = '__tests__/fixtures/oas.methods.yaml'

  beforeEach(async () => {
    oasParser = new OpenApiParser()
    await oasParser.convert({ inputFile: oasYml })
    const postmanObj = JSON.parse(fs.readFileSync(postmanJson).toString())
    postmanParser = new PostmanParser({
      collection: new Collection(postmanObj),
      oasParser: oasParser
    })
  })

  it('should use the GET method', () => {
    mappedOperation = postmanParser.mappedOperations[0]
    expect(mappedOperation.method).toStrictEqual('GET')
  })
  it('should use the POST method', () => {
    mappedOperation = postmanParser.mappedOperations[8]
    expect(mappedOperation.method).toStrictEqual('POST')
  })
  it('should use the PUT method', () => {
    mappedOperation = postmanParser.mappedOperations[1]
    expect(mappedOperation.method).toStrictEqual('PUT')
  })
  it('should use the PATCH method', () => {
    mappedOperation = postmanParser.mappedOperations[2]
    expect(mappedOperation.method).toStrictEqual('PATCH')
  })
  it('should use the HEAD method', () => {
    mappedOperation = postmanParser.mappedOperations[3]
    expect(mappedOperation.method).toStrictEqual('HEAD')
  })
  it('should use the OPTIONS method', () => {
    mappedOperation = postmanParser.mappedOperations[4]
    expect(mappedOperation.method).toStrictEqual('OPTIONS')
  })
  it('should use the TRACE method', () => {
    mappedOperation = postmanParser.mappedOperations[5]
    expect(mappedOperation.method).toStrictEqual('TRACE')
  })
  it('should use the DELETE method', () => {
    mappedOperation = postmanParser.mappedOperations[6]
    expect(mappedOperation.method).toStrictEqual('DELETE')
  })
})
