import { generateVarName } from './generateVarName'
import { PostmanMappedOperation, PostmanParser } from '../postman'
import { OasMappedOperation, OpenApiParser } from '../oas'

import { Collection, CollectionDefinition } from 'postman-collection'
import fs from 'fs-extra'

describe('generateVarName', () => {
  let postmanParser: PostmanParser
  let oasParser: OpenApiParser
  let postmanObj: CollectionDefinition

  const path = 'POST::/crm/leads'
  let pmOperationOne: PostmanMappedOperation
  let oaOperationOne: OasMappedOperation

  const postmanJson = '__tests__/fixtures/crm_compact.postman.json'
  const oasYml = '__tests__/fixtures/crm_compact.yml'

  beforeAll(async () => {
    oasParser = new OpenApiParser()
    await oasParser.convert({ inputFile: oasYml })
    postmanObj = JSON.parse(fs.readFileSync(postmanJson).toString())

    postmanParser = new PostmanParser({
      collection: new Collection(postmanObj),
      oasParser: oasParser
    })

    pmOperationOne = postmanParser.getOperationByPath(path) as PostmanMappedOperation
    oaOperationOne = oasParser.getOperationByPath(pmOperationOne.pathRef) as OasMappedOperation
  })

  test('generates default variable name', () => {
    const dto = {
      oaOperation: oaOperationOne,
      dynamicValues: { varProp: 'id' }
    }
    const result = generateVarName(dto)
    expect(result).toBe('leadsAdd.id')
  })

  test('generates variable name without options', () => {
    const dto = {
      template: '<operationId>_<responseProp>',
      oaOperation: oaOperationOne,
      dynamicValues: { responseProp: 'id' }
    }
    const result = generateVarName(dto)
    expect(result).toBe('leadsAdd_id')
  })

  test('generates variable name with all expressions', () => {
    const dto = {
      template: '<operationId>_<path>_<pathRef>_<method>_<opsRef>_<responseProp>',
      oaOperation: oaOperationOne,
      dynamicValues: { responseProp: 'id' }
    }
    const result = generateVarName(dto)
    expect(result).toBe('leadsAdd_/crm/leads_POST::/crm/leads_POST_leadsAdd_id')
  })

  test('generates variable name with all expressions with casing', () => {
    const dto = {
      template: '<operationId>_<path>_<pathRef>_<method>_<opsRef>_<responseProp>',
      oaOperation: oaOperationOne,
      dynamicValues: { responseProp: 'id' },
      options: { casing: 'kebabCase' }
    }
    const result = generateVarName(dto)
    expect(result).toBe('leads-add-crm-leads-post-crm-leads-post-leads-add-id')
  })

  test('generates variable name with casing and prefix', () => {
    const dto = {
      template: '<operationId>_<responseProp>',
      oaOperation: oaOperationOne,
      dynamicValues: { responseProp: 'id' },
      options: { casing: 'constantCase', prefix: 'prefix_' }
    }
    const result = generateVarName(dto)
    expect(result).toBe('PREFIX_LEADS_ADD_ID')
  })

  test('handles missing dynamic values', () => {
    const dto = {
      template: '<operationId>_<missingProp>',
      oaOperation: oaOperationOne,
      dynamicValues: {}
    }
    const result = generateVarName(dto)
    expect(result).toBe('leadsAdd_<missingProp>')
  })

  test('applies default casing if not provided', () => {
    const dto = {
      template: '<operationId>_<responseProp>',
      oaOperation: oaOperationOne,
      dynamicValues: { responseProp: 'id' },
      options: { prefix: 'prefix_' }
    }
    const result = generateVarName(dto)
    expect(result).toBe('prefix_leadsAdd_id')
  })

  test('trims spaces around prefix and suffix', () => {
    const dto = {
      template: '<operationId>_<responseProp>',
      oaOperation: oaOperationOne,
      dynamicValues: { responseProp: 'id' },
      options: { prefix: ' prefix_ ', suffix: ' _suffix ' }
    }
    const result = generateVarName(dto)
    expect(result).toBe('prefix_leadsAdd_id_suffix')
  })

  test('generates variable name with overwritten OpenAPI info', () => {
    const dto = {
      template: '<operationId>_<responseProp>',
      oaOperation: oaOperationOne,
      dynamicValues: { operationId: 'companiesAdd', responseProp: 'id' },
      options: { prefix: ' prefix_ ', suffix: ' _suffix ' }
    }
    const result = generateVarName(dto)
    expect(result).toBe('prefix_companiesAdd_id_suffix')
  })

  test('generates variable name with static value', () => {
    const dto = {
      template: '<operationId>_<responseProp>_static_name',
      oaOperation: oaOperationOne,
      dynamicValues: { responseProp: 'id' },
      options: { prefix: ' prefix_ ', suffix: ' _suffix ' }
    }
    const result = generateVarName(dto)
    expect(result).toBe('prefix_leadsAdd_id_static_name_suffix')
  })

  test('generates variable name with static value and spaces', () => {
    const dto = {
      template: 'static.<operationId>_<responseProp>_static_name ',
      oaOperation: oaOperationOne,
      dynamicValues: { responseProp: 'id' },
      options: { prefix: ' prefix_ ', suffix: ' _suffix ' }
    }
    const result = generateVarName(dto)
    expect(result).toBe('prefix_static.leadsAdd_id_static_name _suffix')
  })

  test('generates variable name static value and spaces with casing', () => {
    const dto = {
      template: 'static.<operationId>_<responseProp>_static-name ',
      oaOperation: oaOperationOne,
      dynamicValues: { responseProp: 'id' },
      options: { casing: 'constantCase' }
    }
    const result = generateVarName(dto)
    expect(result).toBe('STATIC_LEADS_ADD_ID_STATIC_NAME')
  })
})
