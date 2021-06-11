import chalk from 'chalk'
import newman from 'newman'
import path from 'path'

export const runNewmanWith = (
  postmanCollectionFile: string,
  newmanEnvFile: string,
  newmanDataFile: string | undefined
): Promise<void> => {
  const newmanOptions = {
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
    newmanOptions['iterationData'] = iterationData
  }

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
