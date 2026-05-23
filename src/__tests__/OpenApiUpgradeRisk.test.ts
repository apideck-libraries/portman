import fs from 'fs-extra'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'
import { Collection } from 'postman-collection'
import { Portman } from '../Portman'
import { PostmanParser } from '../postman'
import { OpenApiParser } from '../oas'

type FixtureCase = {
  name: string
  oasFile: string
  portmanConfigFile: string
  postmanConfigFile: string
  expectedOperationCount: number
  expectedOperationIds?: string[]
  fallbackSelectors?: string[]
  expectedInjectedSelectors?: string[]
}

const FIXTURE_CASES: FixtureCase[] = [
  {
    name: 'oas3-basic-operation-ids',
    oasFile: '__tests__/fixtures/openapi-upgrade/oas3-basic.yaml',
    portmanConfigFile: '__tests__/fixtures/openapi-upgrade/portman-config.with-operation-ids.json',
    postmanConfigFile: '__tests__/fixtures/openapi-upgrade/postman-config.tags.json',
    expectedOperationCount: 5,
    expectedOperationIds: ['usersList', 'usersCreate', 'usersOne', 'usersUpdate', 'usersDelete'],
    fallbackSelectors: ['GET::/users/{id}', 'POST::/users'],
    expectedInjectedSelectors: ['POST::/users']
  },
  {
    name: 'oas3-no-operation-ids-fallback',
    oasFile: '__tests__/fixtures/openapi-upgrade/oas3-no-operationid.yaml',
    portmanConfigFile: '__tests__/fixtures/openapi-upgrade/portman-config.no-operation-ids.json',
    postmanConfigFile: '__tests__/fixtures/openapi-upgrade/postman-config.tags.json',
    expectedOperationCount: 4,
    fallbackSelectors: ['PATCH::/orders/{id}', 'POST::/orders'],
    expectedInjectedSelectors: ['PATCH::/orders/{id}']
  },
  {
    name: 'oas31-jsonschema-features',
    oasFile: '__tests__/fixtures/openapi-upgrade/oas31-jsonschema.yaml',
    portmanConfigFile: '__tests__/fixtures/openapi-upgrade/portman-config.generic.json',
    postmanConfigFile: '__tests__/fixtures/openapi-upgrade/postman-config.tags.json',
    expectedOperationCount: 2,
    expectedOperationIds: ['eventsCreate', 'eventsOne'],
    fallbackSelectors: ['POST::/events']
  },
  {
    name: 'swagger2-basic',
    oasFile: '__tests__/fixtures/openapi-upgrade/swagger2-basic.yaml',
    portmanConfigFile: '__tests__/fixtures/openapi-upgrade/portman-config.generic.json',
    postmanConfigFile: '__tests__/fixtures/openapi-upgrade/postman-config.tags.json',
    expectedOperationCount: 3,
    expectedOperationIds: ['widgetsList', 'widgetsCreate', 'widgetsOne'],
    fallbackSelectors: ['POST::/widgets']
  },
  {
    name: 'oas3-local-refs',
    oasFile: '__tests__/fixtures/openapi-upgrade/oas3-refs.yaml',
    portmanConfigFile: '__tests__/fixtures/openapi-upgrade/portman-config.generic.json',
    postmanConfigFile: '__tests__/fixtures/openapi-upgrade/postman-config.tags.json',
    expectedOperationCount: 2,
    expectedOperationIds: ['thingsCreate', 'thingsOne'],
    fallbackSelectors: ['POST::/things']
  },
  {
    name: 'oas3-deepobject-params',
    oasFile: '__tests__/fixtures/openapi-upgrade/oas3-deepobject.yaml',
    portmanConfigFile: '__tests__/fixtures/openapi-upgrade/portman-config.get-only.json',
    postmanConfigFile: '__tests__/fixtures/openapi-upgrade/postman-config.tags.json',
    expectedOperationCount: 1,
    expectedOperationIds: ['searchDeepObject'],
    fallbackSelectors: ['GET::/search']
  },
  {
    name: 'oas3-cookie-params',
    oasFile: '__tests__/fixtures/openapi-upgrade/oas3-cookie-params.yaml',
    portmanConfigFile: '__tests__/fixtures/openapi-upgrade/portman-config.get-only.json',
    postmanConfigFile: '__tests__/fixtures/openapi-upgrade/postman-config.tags.json',
    expectedOperationCount: 1,
    expectedOperationIds: ['profileByCookie'],
    fallbackSelectors: ['GET::/profile']
  },
  {
    name: 'oas3-xml-request-response',
    oasFile: '__tests__/fixtures/openapi-upgrade/oas3-xml.yaml',
    portmanConfigFile: '__tests__/fixtures/openapi-upgrade/portman-config.generic.json',
    postmanConfigFile: '__tests__/fixtures/openapi-upgrade/postman-config.tags.json',
    expectedOperationCount: 1,
    expectedOperationIds: ['feedsCreateXml'],
    fallbackSelectors: ['POST::/feeds'],
    expectedInjectedSelectors: ['POST::/feeds']
  },
  {
    name: 'oas3-oauth2-flow',
    oasFile: '__tests__/fixtures/openapi-upgrade/oas3-oauth2.yaml',
    portmanConfigFile: '__tests__/fixtures/openapi-upgrade/portman-config.get-only.json',
    postmanConfigFile: '__tests__/fixtures/openapi-upgrade/postman-config.tags.json',
    expectedOperationCount: 1,
    expectedOperationIds: ['reportsList'],
    fallbackSelectors: ['GET::/reports']
  }
]

const SUPPORTED_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS']

const normalizeCollectionForSnapshot = (input: unknown): unknown => {
  const normalizeScalar = (value: unknown): unknown => {
    if (value === null) return null
    if (Array.isArray(value)) return value.map(item => normalizeScalar(item))
    if (typeof value === 'object') {
      const obj = value as Record<string, unknown>
      const normalizedObj: Record<string, unknown> = {}
      Object.keys(obj)
        .sort()
        .forEach(key => {
          normalizedObj[key] = normalizeScalar(obj[key])
        })
      return normalizedObj
    }
    // Keep scalar values to make snapshot diffs reflect real converter output.
    if (typeof value === 'string') return value
    if (typeof value === 'number') return value
    if (typeof value === 'boolean') return value
    return value
  }

  const normalizeRawText = (value: string): unknown => {
    const trimmed = value.trim()
    if (!trimmed) return ''

    try {
      const parsed = JSON.parse(trimmed) as unknown
      return normalizeScalar(parsed)
    } catch (e) {
      // best-effort normalization for non-JSON raw payloads
      return trimmed
        .replace(
          /\b[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/gi,
          '<uuid>'
        )
        .replace(/\b\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z\b/g, '<iso-datetime>')
        .replace(/\b\d+\b/g, '<number>')
    }
  }

  const normalize = (value: unknown): unknown => {
    if (Array.isArray(value)) {
      return value.map(item => normalize(item))
    }
    if (!value || typeof value !== 'object') return value

    const obj = value as Record<string, unknown>
    const normalized: Record<string, unknown> = {}

    Object.keys(obj)
      .filter(key => !['id', '_postman_id', 'postman_id'].includes(key))
      .sort()
      .forEach(key => {
        let nextValue = normalize(obj[key])

        if (key === 'exec' && Array.isArray(nextValue)) {
          nextValue = (nextValue as unknown[])
            .map(line => (typeof line === 'string' ? line.trimEnd() : line))
            .filter(line => line !== '')
        }

        if (key === 'header' && Array.isArray(nextValue)) {
          nextValue = [...(nextValue as unknown[])].sort((a, b) =>
            JSON.stringify(a).localeCompare(JSON.stringify(b))
          )
        }
        if (key === 'raw' && typeof nextValue === 'string') {
          nextValue = normalizeRawText(nextValue)
        }

        normalized[key] = nextValue
      })

    return normalized
  }

  return normalize(input)
}

const scriptLength = (exec: unknown): number => {
  return Array.isArray(exec) ? exec.length : 0
}

const operationSummary = (postmanParser: PostmanParser): Record<string, unknown>[] => {
  return postmanParser.mappedOperations
    .map(op => {
      const testEvent = op.item.events.find(event => event.listen === 'test', null)
      const preRequestEvent = op.item.events.find(event => event.listen === 'prerequest', null)
      return {
        id: op.id || null,
        method: op.method,
        pathRef: op.pathRef,
        name: op.item.name,
        parent: op.getParentFolderName(),
        authType: op.item.request.auth?.type || null,
        bodyMode: op.item.request.body?.mode || null,
        headerKeys: op.item.request.headers
          .toJSON()
          .map(header => header.key)
          .sort(),
        queryParamKeys: op.item.request.url.query
          .toJSON()
          .map(query => query.key)
          .sort(),
        testLines: scriptLength(testEvent?.script?.exec),
        preRequestLines: scriptLength(preRequestEvent?.script?.exec)
      }
    })
    .sort((a, b) => {
      return `${a.method}::${a.pathRef}`.localeCompare(`${b.method}::${b.pathRef}`)
    })
}

describe('OpenAPI upgrade risk gate', () => {
  beforeEach(() => {
    jest.spyOn(global.console, 'log').mockImplementation(() => undefined)
    jest.spyOn(global.console, 'error').mockImplementation(() => undefined)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it.each(FIXTURE_CASES)(
    '$name',
    async fixture => {
      const outputFile = path.resolve(
        `./tmp/converted/openapi-upgrade.${fixture.name}.${uuidv4()}.json`
      )

      const portman = new Portman({
        oaLocal: fixture.oasFile,
        postmanConfigFile: fixture.postmanConfigFile,
        postmanConfigPath: fixture.postmanConfigFile,
        portmanConfigFile: fixture.portmanConfigFile,
        portmanConfigPath: fixture.portmanConfigFile,
        output: outputFile,
        baseUrl: 'https://api.example.com',
        syncPostman: false,
        includeTests: true,
        runNewman: false,
        warn: true
      })

      await portman.run()

      expect(await fs.pathExists(outputFile)).toBe(true)

      const rawCollection = JSON.parse(await fs.readFile(outputFile, 'utf8'))
      const normalizedCollection = normalizeCollectionForSnapshot(rawCollection)

      const oasParser = new OpenApiParser()
      await oasParser.convert({ inputFile: fixture.oasFile })

      const postmanParser = new PostmanParser({
        collection: new Collection(rawCollection),
        oasParser
      })

      const summary = operationSummary(postmanParser)

      const oasRequestOperations = oasParser.mappedOperations.filter(operation =>
        SUPPORTED_METHODS.includes(operation.method)
      )

      expect(postmanParser.mappedOperations).toHaveLength(fixture.expectedOperationCount)
      expect(oasRequestOperations).toHaveLength(fixture.expectedOperationCount)

      // no unexpected unmatched selector targets
      expect(portman.testSuite.track.openApiOperationIds).toEqual([])
      expect(portman.testSuite.track.openApiOperations).toEqual([])

      if (fixture.expectedOperationIds) {
        fixture.expectedOperationIds.forEach(operationId => {
          expect(postmanParser.getOperationById(operationId)).not.toBeNull()
        })
      }

      if (fixture.fallbackSelectors) {
        fixture.fallbackSelectors.forEach(selector => {
          expect(postmanParser.getOperationsByPath(selector).length).toBeGreaterThan(0)
        })
      }

      if (fixture.expectedInjectedSelectors) {
        fixture.expectedInjectedSelectors.forEach(selector => {
          const operations = postmanParser.getOperationsByPath(selector)
          expect(operations.length).toBeGreaterThan(0)
          operations.forEach(operation => {
            const testEvent = operation.item.events.find(event => event.listen === 'test', null)
            const preRequestEvent = operation.item.events.find(
              event => event.listen === 'prerequest',
              null
            )
            const hasTest = scriptLength(testEvent?.script?.exec) > 0
            const hasPreRequest = scriptLength(preRequestEvent?.script?.exec) > 0
            expect(hasTest || hasPreRequest).toBe(true)
          })
        })
      }

      expect(summary).toMatchSnapshot()
      expect(normalizedCollection).toMatchSnapshot()
    },
    60000
  )
})
