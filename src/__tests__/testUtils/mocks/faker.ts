type FakerLeafFn = (...args: unknown[]) => unknown

function defaultValueForPath(path: string[]): unknown {
  const key = path[path.length - 1] || ''

  if (key.toLowerCase().includes('number') || key.toLowerCase().includes('int')) return 42
  if (key.toLowerCase().includes('boolean') || key.startsWith('is')) return true
  if (key.toLowerCase().includes('uuid')) return '00000000-0000-4000-8000-000000000000'
  if (key.toLowerCase().includes('email')) return 'test@example.com'
  if (key === 'arrayElement') {
    return (arr: unknown[]) => (Array.isArray(arr) && arr.length ? arr[0] : 'value')
  }
  if (key === 'int') return 42
  if (key === 'float') return 42.42
  return 'example-value'
}

function buildFakerProxy(path: string[] = []): unknown {
  const fn: FakerLeafFn = (...args: unknown[]) => {
    const key = path[path.length - 1]

    if (key === 'arrayElement' && Array.isArray(args[0])) {
      return args[0][0] ?? 'value'
    }

    return defaultValueForPath(path)
  }

  return new Proxy(fn, {
    get(_target, prop) {
      if (prop === '__esModule') return true
      if (prop === 'default') return buildFakerProxy(path)
      return buildFakerProxy([...path, String(prop)])
    },
    apply() {
      return defaultValueForPath(path)
    }
  })
}

export const fakerEN = buildFakerProxy() as any
