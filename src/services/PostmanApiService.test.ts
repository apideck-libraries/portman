import * as Either from 'fp-ts/lib/Either'
import { CollectionDefinition } from 'postman-collection'
import ora from 'ora'
import { PostmanApiService } from './PostmanApiService'

jest.mock('ora')

type SpinnerMock = {
  start: jest.Mock
  succeed: jest.Mock
  fail: jest.Mock
  clear: jest.Mock
  text: string
}

const mockedOra = ora as jest.MockedFunction<typeof ora>
const mockFetch = jest.fn()

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

const createFetchResponse = ({
  ok,
  status,
  statusText = '',
  body
}: {
  ok: boolean
  status: number
  statusText?: string
  body: string
}) => ({
  ok,
  status,
  statusText,
  text: jest.fn().mockResolvedValue(body)
})

describe('PostmanApiService regression behavior', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    process.env.POSTMAN_API_KEY = 'test-api-key'
    ;(global as unknown as { fetch: typeof fetch }).fetch = mockFetch as unknown as typeof fetch
  })

  it('returns Either.right(workspaces) for successful getWorkspaces response', async () => {
    mockFetch.mockResolvedValue(
      createFetchResponse({
        ok: true,
        status: 200,
        body: JSON.stringify({
          workspaces: [{ id: 'ws_1', name: 'Workspace 1', type: 'team' }]
        })
      })
    )

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

    mockFetch.mockResolvedValue(
      createFetchResponse({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        body: JSON.stringify({ error: { message: 'Server error' } })
      })
    )

    const service = new PostmanApiService()
    const response = await service.createCollection(collection)
    const parsed = JSON.parse(response)

    expect(parsed.status).toBe('fail')
    expect(parsed.data).toEqual({ error: { message: 'Server error' } })
    expect(spinner.fail).toHaveBeenCalledWith(expect.stringContaining('status: 500'))
    expect(spinner.text).toContain('Response Received: 500')
  })

  it('returns fail envelope for createCollection network failures', async () => {
    const spinner = createSpinnerMock()
    mockedOra.mockReturnValue(spinner as never)

    const networkError = new Error('socket hang up')
    ;(networkError as Error & { code?: string }).code = 'ECONNRESET'

    mockFetch.mockRejectedValue(networkError)

    const service = new PostmanApiService()
    const response = await service.createCollection(collection)
    const parsed = JSON.parse(response)

    expect(parsed.status).toBe('fail')
    expect(parsed.data).toBe('Error: socket hang up')
    expect(spinner.fail).toHaveBeenCalledWith(expect.stringContaining('ECONNRESET'))
  })

  it('handles malformed JSON responses safely by falling back to non-object behavior', async () => {
    mockFetch.mockResolvedValue(
      createFetchResponse({
        ok: true,
        status: 200,
        body: '{"workspaces":'
      })
    )

    const service = new PostmanApiService()
    const result = await service.getWorkspaces()

    expect(Either.isLeft(result)).toBe(true)

    if (Either.isLeft(result)) {
      expect(result.left).toBe('No workspaces found')
    }
  })
})
