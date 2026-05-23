type AnyFn = (...args: any[]) => any

const randomString = (): string => Math.random().toString(36).slice(2, 10)

const randomNumber = (min = 0, max = 9999): number => {
  const low = Number.isFinite(min) ? min : 0
  const high = Number.isFinite(max) ? max : low + 9999
  return Math.floor(Math.random() * (high - low + 1)) + low
}

const createGenerator = (path: string[] = []): AnyFn =>
  new Proxy(
    (...args: any[]): any => {
      const key = path[path.length - 1]
      if (key === 'number') {
        const options = (args[0] || {}) as { min?: number; max?: number }
        return randomNumber(options.min ?? 0, options.max ?? 9999)
      }
      if (key === 'boolean') return Math.random() > 0.5
      if (key === 'uuid') return `mock-${randomString()}`
      if (key === 'alphaNumeric') return randomString()
      if (key === 'arrayElement' && Array.isArray(args[0])) {
        const arr = args[0] as unknown[]
        return arr.length ? arr[Math.floor(Math.random() * arr.length)] : undefined
      }
      if (key?.toLowerCase().includes('date')) return new Date().toISOString()
      return randomString()
    },
    {
      get: (_target, prop: string): any => {
        if (prop === 'toJSON') return () => randomString()
        return createGenerator([...path, prop])
      }
    }
  ) as unknown as AnyFn

export const fakerEN = new Proxy(
  {},
  {
    get: (_target, prop: string): any => createGenerator([prop])
  }
)
