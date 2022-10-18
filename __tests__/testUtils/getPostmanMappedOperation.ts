import fs from 'fs-extra'
import { Collection, FormParam, QueryParam } from 'postman-collection'
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

export const getPostmanMappedCreateArrayOperation = async (): Promise<PostmanMappedOperation> => {
  const postmanJson = '__tests__/fixtures/crm-request-items.json'
  const oasYml = '__tests__/fixtures/crm-request-items.yml'

  await oasParser.convert({ inputFile: oasYml })
  const postmanObj = JSON.parse(fs.readFileSync(postmanJson).toString())
  const postmanParser = new PostmanParser({
    collection: new Collection(postmanObj),
    oasParser: oasParser
  })
  return postmanParser.mappedOperations[0]
}

export const getPostmanMappedListArrayOperation = async (): Promise<PostmanMappedOperation> => {
  const postmanJson = '__tests__/fixtures/crm-request-array.json'
  const oasYml = '__tests__/fixtures/crm-request-array.yml'

  await oasParser.convert({ inputFile: oasYml })
  const postmanObj = JSON.parse(fs.readFileSync(postmanJson).toString())
  const postmanParser = new PostmanParser({
    collection: new Collection(postmanObj),
    oasParser: oasParser
  })
  return postmanParser.mappedOperations[1]
}

export const getPostmanMappedCreateFormData = async (): Promise<PostmanMappedOperation> => {
  await oasParser.convert({ inputFile: oasYml })
  const postmanObj = JSON.parse(fs.readFileSync(postmanJson).toString())
  const postmanParser = new PostmanParser({
    collection: new Collection(postmanObj),
    oasParser: oasParser
  })
  const pmOp = postmanParser.mappedOperations[1]
  const pmFormParam = {
    key: 'name',
    value: 'bar',
    description: 'form foo description',
    disabled: false
  } as FormParam

  if (pmOp.item.request.body) {
    pmOp.item.request.body.update({
      mode: 'formdata',
      formdata: []
    })
  }
  if (pmOp?.item?.request?.body?.formdata) {
    pmOp.item.request.body.formdata.clear()
    pmOp.item.request.body.formdata.assimilate([pmFormParam], false)
  }

  return pmOp
}

export const getPostmanMappedCreateFormUrlEncoded = async (): Promise<PostmanMappedOperation> => {
  await oasParser.convert({ inputFile: oasYml })
  const postmanObj = JSON.parse(fs.readFileSync(postmanJson).toString())
  const postmanParser = new PostmanParser({
    collection: new Collection(postmanObj),
    oasParser: oasParser
  })
  const pmOp = postmanParser.mappedOperations[1]
  const pmFormParam = {
    key: 'name',
    value: 'bar',
    description: 'form foo description',
    disabled: false
  } as QueryParam

  if (pmOp.item.request.body) {
    pmOp.item.request.body.update({
      mode: 'urlencoded',
      urlencoded: []
    })
  }
  if (pmOp?.item?.request?.body?.urlencoded) {
    pmOp.item.request.body.urlencoded.clear()
    pmOp.item.request.body.urlencoded.assimilate([pmFormParam], false)
  }

  return pmOp
}
