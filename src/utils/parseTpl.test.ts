import { parseTpl, hasTpl } from './parseTpl'
import { PostmanMappedOperation, PostmanParser } from '../postman'
import { OasMappedOperation, OpenApiParser } from '../oas'

import { Collection, CollectionDefinition } from 'postman-collection'
import fs from 'fs-extra'

describe('parseTpl', () => {
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
    const result = parseTpl(dto)
    expect(result).toBe('leadsAdd.id')
  })

  test('generates variable name without options', () => {
    const dto = {
      template: '<operationId>_<responseProp>',
      oaOperation: oaOperationOne,
      dynamicValues: { responseProp: 'id' }
    }
    const result = parseTpl(dto)
    expect(result).toBe('leadsAdd_id')
  })

  test('generates variable name with all expressions', () => {
    const dto = {
      template: '<operationId>_<path>_<pathRef>_<method>_<opsRef>_<responseProp>',
      oaOperation: oaOperationOne,
      dynamicValues: { responseProp: 'id' }
    }
    const result = parseTpl(dto)
    expect(result).toBe('leadsAdd_/crm/leads_POST::/crm/leads_POST_leadsAdd_id')
  })

  test('generates variable name with all expressions with casing', () => {
    const dto = {
      template:
        '<operationId>_<path>_<pathPart1>_<pathPart2>_<pathRef>_<method>_<opsRef>_<responseProp>_<tag>_<tag1>_<tag2>',
      oaOperation: oaOperationOne,
      dynamicValues: { responseProp: 'id' },
      options: { casing: 'kebabCase' }
    }
    const result = parseTpl(dto)
    expect(result).toBe(
      'leads-add-crm-leads-crm-leads-post-crm-leads-post-leads-add-id-leads-leads'
    )
  })

  test('generates variable name with casing and prefix', () => {
    const dto = {
      template: '<operationId>_<responseProp>',
      oaOperation: oaOperationOne,
      dynamicValues: { responseProp: 'id' },
      options: { casing: 'constantCase', prefix: 'prefix_' }
    }
    const result = parseTpl(dto)
    expect(result).toBe('PREFIX_LEADS_ADD_ID')
  })

  test('handles missing dynamic values', () => {
    const dto = {
      template: '<operationId>_<missingProp>',
      oaOperation: oaOperationOne,
      dynamicValues: {}
    }
    const result = parseTpl(dto)
    expect(result).toBe('leadsAdd_')
  })

  test('applies default casing if not provided', () => {
    const dto = {
      template: '<operationId>_<responseProp>',
      oaOperation: oaOperationOne,
      dynamicValues: { responseProp: 'id' },
      options: { prefix: 'prefix_' }
    }
    const result = parseTpl(dto)
    expect(result).toBe('prefix_leadsAdd_id')
  })

  test('trims spaces around prefix and suffix', () => {
    const dto = {
      template: '<operationId>_<responseProp>',
      oaOperation: oaOperationOne,
      dynamicValues: { responseProp: 'id' },
      options: { prefix: ' prefix_ ', suffix: ' _suffix ' }
    }
    const result = parseTpl(dto)
    expect(result).toBe('prefix_leadsAdd_id_suffix')
  })

  test('generates variable name with overwritten OpenAPI info', () => {
    const dto = {
      template: '<operationId>_<responseProp>',
      oaOperation: oaOperationOne,
      dynamicValues: { operationId: 'companiesAdd', responseProp: 'id' },
      options: { prefix: ' prefix_ ', suffix: ' _suffix ' }
    }
    const result = parseTpl(dto)
    expect(result).toBe('prefix_companiesAdd_id_suffix')
  })

  test('generates variable name with static value', () => {
    const dto = {
      template: '<operationId>_<responseProp>_static_name',
      oaOperation: oaOperationOne,
      dynamicValues: { responseProp: 'id' },
      options: { prefix: ' prefix_ ', suffix: ' _suffix ' }
    }
    const result = parseTpl(dto)
    expect(result).toBe('prefix_leadsAdd_id_static_name_suffix')
  })

  test('generates variable name with static value and spaces', () => {
    const dto = {
      template: 'static.<operationId>_<responseProp>_static_name ',
      oaOperation: oaOperationOne,
      dynamicValues: { responseProp: 'id' },
      options: { prefix: ' prefix_ ', suffix: ' _suffix ' }
    }
    const result = parseTpl(dto)
    expect(result).toBe('prefix_static.leadsAdd_id_static_name _suffix')
  })

  test('generates variable name static value and spaces with casing', () => {
    const dto = {
      template: 'static.<operationId>_<responseProp>_static-name ',
      oaOperation: oaOperationOne,
      dynamicValues: { responseProp: 'id' },
      options: { casing: 'constantCase' }
    }
    const result = parseTpl(dto)
    expect(result).toBe('STATIC_LEADS_ADD_ID_STATIC_NAME')
  })

  test('generates variable name with {{', () => {
    const dto = {
      template: '{{<tag>Id}}',
      oaOperation: oaOperationOne,
      dynamicValues: { responseProp: 'id' }
    }
    const result = parseTpl(dto)
    expect(result).toBe('{{LeadsId}}')
  })

  test('generates variable name with casing, keeping the {{}}', () => {
    const dto = {
      template: '{{<tag>Id}}',
      oaOperation: oaOperationOne,
      dynamicValues: { responseProp: 'id' },
      options: { casing: 'camelCase' }
    }
    const result = parseTpl(dto)
    expect(result).toBe('{{leadsId}}')
  })

  test('generates multiple variable names with casing, keeping the outer {{}}', () => {
    const dto = {
      template: '{{<tag>Id_<operationId>}} ',
      oaOperation: oaOperationOne,
      dynamicValues: { responseProp: 'id' },
      options: { casing: 'camelCase' }
    }
    const result = parseTpl(dto)
    expect(result).toBe('{{leadsIdLeadsAdd}} ')
  })

  test('generates multiple variable names with casing, keeping the {{}}', () => {
    const dto = {
      template: '{{<tag>Id}}_{{<operationId>}} ',
      oaOperation: oaOperationOne,
      dynamicValues: { responseProp: 'id' },
      options: { casing: 'camelCase' }
    }
    const result = parseTpl(dto)
    expect(result).toBe('{{leadsId}}_{{leadsAdd}} ')
  })

  test('generates variable name with casing, keeping the {{{}}}', () => {
    const dto = {
      template: '{{{<tag>MonetaryAmount}}}',
      oaOperation: oaOperationOne,
      dynamicValues: { responseProp: 'id' },
      options: { casing: 'camelCase' }
    }
    const result = parseTpl(dto)
    expect(result).toBe('{{{leadsMonetaryAmount}}}')
  })
})

describe('hasTpl', () => {
  test('returns true if template contains template tags', () => {
    const templateWithAngleBrackets = '<example>'
    const result = hasTpl(templateWithAngleBrackets)
    expect(result).toBe(true)
  })

  test('returns false if template does not contain template tags', () => {
    const templateWithoutAngleBrackets = 'example'
    const result = hasTpl(templateWithoutAngleBrackets)
    expect(result).toBe(false)
  })

  test('returns true if template contains either < or >', () => {
    const templateWithEitherBracket = 'a < b'
    const result = hasTpl(templateWithEitherBracket)
    expect(result).toBe(true)
  })

  test('returns true if template has multiple template tags', () => {
    const templateWithMultipleTags = '<example> <example>'
    const result = hasTpl(templateWithMultipleTags)
    expect(result).toBe(true)
  })
})
