import fs from 'fs-extra'
import os from 'os'
import path from 'path'

export const createPortmanTmpRoot = (): Promise<string> =>
  fs.mkdtemp(path.join(os.tmpdir(), 'portman-'))

export const defaultPostmanCacheFile = (): string => path.join(os.tmpdir(), '.portman.cache.json')
