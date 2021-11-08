import chalk from 'chalk'
import newman, { NewmanRunOptions } from 'newman'
import path from 'path'

export const runNewmanWith = async (
  postmanCollectionFile: string,
  newmanEnvFile: string,
  newmanDataFile: string | undefined,
  newmanRunOptions: Partial<NewmanRunOptions>
): Promise<void> => {
  const defaultNewmanOptions = {
    collection: require(path.resolve(postmanCollectionFile)),
    environment: require(path.resolve(newmanEnvFile)),
    reporters: ['cli'],
    reporter: {
      htmlextra: {
        showEnvironmentData: true
      }
    },
    abortOnFailure: true,
    ignoreRedirects: true
  }

  if (newmanDataFile) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const iterationData = require(path.resolve(newmanDataFile))
    defaultNewmanOptions['iterationData'] = iterationData
  }

  const newmanOptions = { ...defaultNewmanOptions, ...newmanRunOptions }

  return new Promise((resolve, reject) => {
    try {
      newman.run(newmanOptions).on('done', (err: Error, summary) => {
        if (err || summary.error) {
          reject(err || summary.error)
        } else {
          console.log(chalk.green('Collection run completed.'))
          resolve()
        }
      })
      // eslint-disable-next-line no-empty
    } catch (_error) {}
  })
}
