import chalk from 'chalk'
import newman, { NewmanRunOptions } from 'newman'
import path from 'path'
import { camelCase } from 'camel-case'

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
  // camelCase Newman run options
  const newmanRunOptionsCased = Object.keys(newmanRunOptions).reduce(
    (a, c) => ((a[`${camelCase(c)}`] = newmanRunOptions[c]), a),
    {}
  ) as Partial<NewmanRunOptions>
  // Merge Newman default and runtime options
  const newmanOptions = { ...defaultNewmanOptions, ...newmanRunOptionsCased }

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
