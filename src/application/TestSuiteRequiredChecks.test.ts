import fs from 'fs-extra'
import { Collection } from 'postman-collection'
import { TestSuite } from '../application'
import { OpenApiParser } from '../oas'
import { PostmanParser } from '../postman'
import { ContractTestCheck, ContractTestConfig, PortmanConfig } from '../types'

describe('TestSuite.getMissingRequiredChecks', () => {
  let postmanParser: PostmanParser
  let oasParser: OpenApiParser

  const postmanJson = '__tests__/fixtures/crm_compact.postman.json'
  const oasYml = '__tests__/fixtures/crm_compact.yml'

  beforeEach(async () => {
    oasParser = new OpenApiParser()
    await oasParser.convert({ inputFile: oasYml })
    const postmanObj = JSON.parse(fs.readFileSync(postmanJson).toString())
    postmanParser = new PostmanParser({
      collection: new Collection(postmanObj),
      oasParser: oasParser
    })
  })

  const getViolations = (
    contractTests: ContractTestConfig[],
    required: ContractTestCheck[] = ['statusSuccess']
  ) => {
    const config = { version: 1.0, tests: { contractTests } } as PortmanConfig
    const testSuite = new TestSuite({ oasParser, postmanParser, config })
    return testSuite
      .getMissingRequiredChecks(required)
      .map(({ pmOperation, missingChecks }) => [pmOperation.pathRef, missingChecks])
  }

  it('should pass when all operations have the required checks', () => {
    const violations = getViolations(
      [
        {
          openApiOperation: '*::/crm/*',
          statusSuccess: { enabled: true },
          contentType: { enabled: true }
        },
        { openApiOperation: '*::/crm/*', schemaValidation: { enabled: true } }
      ],
      ['statusSuccess', 'contentType', 'schemaValidation']
    )
    expect(violations).toEqual([])
  })

  it('should list the operation missing schemaValidation', () => {
    const violations = getViolations(
      [
        { openApiOperation: '*::/crm/*', statusSuccess: { enabled: true } },
        {
          openApiOperation: '*::/crm/*',
          schemaValidation: { enabled: true, excludeForOperations: ['leadsOne'] }
        }
      ],
      ['statusSuccess', 'schemaValidation']
    )
    expect(violations).toEqual([['GET::/crm/leads/{id}', ['schemaValidation']]])
  })

  it('should respect wildcards and excludeForOperations of the contract test target', () => {
    const violations = getViolations([
      {
        openApiOperation: '*::/crm/*',
        excludeForOperations: ['GET::/crm/companies', 'leadsAdd'],
        statusSuccess: { enabled: true }
      }
    ])
    expect(violations).toEqual([
      ['GET::/crm/companies', ['statusSuccess']],
      ['POST::/crm/leads', ['statusSuccess']]
    ])
  })

  it('should accept a check enabled by another contract test for an excluded operation', () => {
    const violations = getViolations([
      {
        openApiOperation: '*::/crm/*',
        excludeForOperations: ['GET::/crm/companies'],
        statusSuccess: { enabled: true }
      },
      { openApiOperationId: 'companiesAll', statusSuccess: { enabled: true } }
    ])
    expect(violations).toEqual([])
  })

  it('should not count disabled checks', () => {
    const violations = getViolations([
      { openApiOperation: '*::/crm/*', statusSuccess: { enabled: true } },
      { openApiOperation: 'GET::/crm/contacts', statusSuccess: { enabled: false } }
    ])
    expect(violations).toEqual([])

    const allMissing = getViolations([
      { openApiOperation: '*::/crm/*', statusSuccess: { enabled: false } }
    ])
    expect(allMissing).toHaveLength(postmanParser.mappedOperations.length)
  })
})
