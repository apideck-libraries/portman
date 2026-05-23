import fs from 'fs-extra'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'
import { Portman } from '../Portman'

type CliOptions = Record<string, unknown>

type ExampleCase = {
  name: string
  cliOptionsFile: string
}

const EXAMPLE_OPTION_FILES = [
  'examples/cli-filtering/portman-cli-options.json',
  'examples/cli-options/portman-cli-options.json',
  'examples/config-references/portman-cli-options.json',
  'examples/portman-globals/portman-cli-options.json',
  'examples/testsuite-assign-overwrite/portman-cli-options.json',
  'examples/testsuite-assign-variables/portman-cli-options.json',
  'examples/testsuite-content-tests/portman-cli-options.json',
  'examples/testsuite-contract-content-types/portman-cli-options.json',
  'examples/testsuite-contract-tests/portman-cli-options.json',
  'examples/testsuite-fuzzing-tests/portman-cli-options.json',
  'examples/testsuite-overwrites/portman-cli-options.json',
  'examples/testsuite-variation-content-types/portman-cli-options.json',
  'examples/testsuite-variation-tests/portman-cli-options.json'
]

const EXAMPLE_CASES: ExampleCase[] = EXAMPLE_OPTION_FILES.map(cliOptionsFile => ({
  name: path.dirname(cliOptionsFile).replace('examples/', ''),
  cliOptionsFile
}))

const PATH_KEYS = [
  'local',
  'output',
  'newmanIterationData',
  'newmanOptionsFile',
  'localPostman',
  'portmanConfigFile',
  'postmanConfigFile',
  'filterFile',
  'oaOutput',
  'envFile'
]

const resolveFromExampleDir = (dir: string, value: string): string => {
  if (value.startsWith('http://') || value.startsWith('https://')) return value
  const fromCwd = path.resolve(value)
  if (fs.existsSync(fromCwd)) return fromCwd
  return path.resolve(dir, value)
}

const resolveCliOptionsPaths = (exampleDir: string, raw: CliOptions): CliOptions => {
  const options = { ...raw }
  PATH_KEYS.forEach(key => {
    const value = options[key]
    if (typeof value === 'string' && value.length > 0) {
      options[key] = resolveFromExampleDir(exampleDir, value)
    }
  })
  return options
}

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
    // Keep scalar example values in example snapshot suite.
    return value
  }

  const normalizeRawText = (value: string): unknown => {
    const trimmed = value.trim()
    if (!trimmed) return ''

    try {
      const parsed = JSON.parse(trimmed) as unknown
      return normalizeScalar(parsed)
    } catch (e) {
      return trimmed
        .replace(
          /\b[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/gi,
          '<uuid>'
        )
        .replace(/\b\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z\b/g, '<iso-datetime>')
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

describe('Examples normalized snapshots', () => {
  beforeEach(() => {
    jest.spyOn(global.console, 'log').mockImplementation(() => undefined)
    jest.spyOn(global.console, 'error').mockImplementation(() => undefined)
    jest.spyOn(process, 'exit').mockImplementation(() => {
      return undefined as never
    })
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it.each(EXAMPLE_CASES)(
    '$name',
    async exampleCase => {
      const cliOptionsPath = path.resolve(exampleCase.cliOptionsFile)
      const exampleDir = path.dirname(cliOptionsPath)
      const cliOptionsRaw = JSON.parse(await fs.readFile(cliOptionsPath, 'utf8')) as CliOptions
      const cliOptions = resolveCliOptionsPaths(exampleDir, cliOptionsRaw)

      const outputFile = path.resolve(
        `./tmp/converted/example-snapshot.${exampleCase.name}.${uuidv4()}.json`
      )

      const portman = new Portman({
        ...cliOptions,
        oaLocal: (cliOptions.local as string) || '',
        oaUrl: (cliOptions.url as string) || '',
        portmanConfigPath:
          (cliOptions.portmanConfigFile as string) || path.resolve('portman-config.default.json'),
        postmanConfigPath:
          (cliOptions.postmanConfigFile as string) || path.resolve('postman-config.default.json'),
        output: outputFile,
        runNewman: false,
        syncPostman: false,
        includeTests: cliOptions.includeTests !== false,
        warn: true
      })

      await portman.run()

      expect(await fs.pathExists(outputFile)).toBe(true)
      const rawCollection = JSON.parse(await fs.readFile(outputFile, 'utf8'))
      const normalizedCollection = normalizeCollectionForSnapshot(rawCollection)

      expect(normalizedCollection).toMatchSnapshot()
    },
    120000
  )
})
