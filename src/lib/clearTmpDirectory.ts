import * as Option from 'fp-ts/lib/Option'
import fs from 'fs-extra'

export const clearTmpDirectory = async (workingDir: string): Promise<Option.Option<string>> => {
  try {
    await fs.emptyDir(workingDir)
    await fs.rmdir(workingDir)
  } catch (error) {
    return Option.some(error.toString())
  }

  return Option.none
}
