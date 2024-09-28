import * as Option from 'fp-ts/lib/Option'
import fs from 'fs-extra'

export const clearTmpDirectory = async (): Promise<Option.Option<string>> => {
  try {
    await fs.emptyDir(`${__dirname}/../../tmp/working`)
    await fs.rmdir(`${__dirname}/../../tmp/working`)
    await fs.emptyDir(`${__dirname}/../../tmp/converted`)
    await fs.rmdir(`${__dirname}/../../tmp/converted`)
  } catch (error) {
    return Option.some(error.toString())
  }

  return Option.none
}
