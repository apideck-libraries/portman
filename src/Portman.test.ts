import fs from 'fs-extra'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'
import { Portman } from './Portman'
import { omitKeys } from './utils'

describe('Portman', () => {
  beforeEach(async () => {
    /* eslint-disable @typescript-eslint/no-empty-function */
    jest.spyOn(global.console, 'log').mockImplementation(() => {})
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it.only('should be runnable', async () => {
    const outputFile = `./tmp/converted/crmApi.${uuidv4()}.json`

    const portman = new Portman({
      postmanUid: 'eb1ffad6-eece-456b-ad32-3f2a3f605537',
      oaLocal: './__tests__/fixtures/crm.yml',
      postmanConfigFile: './__tests__/fixtures/postman-config.json',
      portmanConfigFile: './__tests__/fixtures/portman.crm.json',
      portmanConfigPath: './__tests__/fixtures/portman.crm.json',
      envFile: './__tests__/fixtures/.crm.env',
      baseUrl: 'http://localhost:3050',
      output: outputFile,
      syncPostman: false,
      includeTests: true,
      runNewman: false
    })

    await portman.run()

    const outputFilePath = path.resolve(outputFile)
    expect(await fs.pathExists(outputFilePath)).toBe(true)

    const finalCollection = JSON.parse(await fs.readFile(outputFilePath, 'utf8'))
    expect(omitKeys(finalCollection, ['id', '_postman_id', 'postman_id', 'info'])).toMatchSnapshot()
  }, 30000)
})
