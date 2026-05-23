import * as Either from 'fp-ts/lib/Either'
import { CollectionDefinition } from 'postman-collection'
import axios from 'axios'
import ora from 'ora'
import { PostmanApiService } from './PostmanApiService'

jest.mock('axios')
jest.mock('ora')

type SpinnerMock = {
  start: jest.Mock
  succeed: jest.Mock
  fail: jest.Mock
  clear: jest.Mock
  text: string
}

const mockedAxios = axios as jest.Mocked<typeof axios>
const mockedAxiosCall = axios as unknown as jest.Mock
const mockedOra = ora as jest.MockedFunction<typeof ora>

const collection: CollectionDefinition = {
  info: {
    name: 'Sample Collection',
    version: '1.0.0'
  }
}

const createSpinnerMock = (): SpinnerMock => ({
  start: jest.fn(),
  succeed: jest.fn(),
  fail: jest.fn(),
  clear: jest.fn(),
  text: ''
})

describe('PostmanApiService regression behavior', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    process.env.POSTMAN_API_KEY = 'test-api-key'

    mockedAxios.interceptors = {
      request: { use: jest.fn() },
      response: { use: jest.fn() }
    } as unknown as typeof axios.interceptors
  })

  it('returns Either.right(workspaces) for successful getWorkspaces response', async () => {
    mockedAxiosCall.mockResolvedValue({
      data: {
        workspaces: [{ id: 'ws_1', name: 'Workspace 1', type: 'team' }]
      }
    } as never)

    const service = new PostmanApiService()
    const result = await service.getWorkspaces()

    expect(Either.isRight(result)).toBe(true)

    if (Either.isRight(result)) {
      expect(result.right).toEqual([{ id: 'ws_1', name: 'Workspace 1', type: 'team' }])
    }
  })

  it('returns fail envelope for createCollection when Postman responds non-2xx', async () => {
    const spinner = createSpinnerMock()
    mockedOra.mockReturnValue(spinner as never)

    let onResponseError: ((error: unknown) => unknown) | undefined
    ;(mockedAxios.interceptors.response.use as jest.Mock).mockImplementation(
      (_onSuccess: unknown, onError: (error: unknown) => unknown) => {
        onResponseError = onError
      }
    )

    mockedAxios.request.mockImplementation(async () => {
      const error = {
        response: {
          status: 500,
          data: { error: { message: 'Server error' } }
        }
      }

      if (onResponseError) {
        onResponseError(error)
      }

      throw error
    })

    const service = new PostmanApiService()
    const response = await service.createCollection(collection)
    const parsed = JSON.parse(response)

    expect(parsed.status).toBe('fail')
    expect(parsed.data).toEqual({ error: { message: 'Server error' } })
    expect(spinner.fail).toHaveBeenCalledWith(expect.stringContaining('status: 500'))
  })

  it('returns fail envelope for createCollection network failures without HTTP response', async () => {
    const spinner = createSpinnerMock()
    mockedOra.mockReturnValue(spinner as never)

    let onResponseError: ((error: unknown) => unknown) | undefined
    ;(mockedAxios.interceptors.response.use as jest.Mock).mockImplementation(
      (_onSuccess: unknown, onError: (error: unknown) => unknown) => {
        onResponseError = onError
      }
    )

    mockedAxios.request.mockImplementation(async () => {
      const error = {
        code: 'ECONNRESET',
        toJSON: () => ({ message: 'network down', code: 'ECONNRESET' })
      }

      if (onResponseError) {
        onResponseError(error)
      }

      throw error
    })

    const service = new PostmanApiService()
    const response = await service.createCollection(collection)
    const parsed = JSON.parse(response)

    expect(parsed.status).toBe('fail')
    expect(parsed.data).toBeUndefined()
    expect(spinner.fail).toHaveBeenCalledWith(expect.stringContaining('ECONNRESET'))
  })

  it('returns Either.left when response payload shape is malformed for getWorkspaces', async () => {
    mockedAxiosCall.mockResolvedValue({
      data: 'not-a-workspaces-object'
    } as never)

    const service = new PostmanApiService()
    const result = await service.getWorkspaces()

    expect(Either.isLeft(result)).toBe(true)

    if (Either.isLeft(result)) {
      expect(result.left).toBe('No workspaces found')
    }
  })
})
