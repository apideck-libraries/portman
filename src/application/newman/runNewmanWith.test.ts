import newman from 'newman'
import { runNewmanWith } from '../../application'

jest.mock('newman')

describe('runNewmanWith', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  const newmanEnvFile = '__tests__/fixtures/crmApi-env.json'
  const postmanFile = '__tests__/fixtures/crm.postman.json'

  it('should call newman with options', async () => {
    const runSpy = jest.spyOn(newman, 'run')

    runNewmanWith(postmanFile, newmanEnvFile, undefined, {})

    expect(runSpy).toHaveBeenCalled()
  })
})
