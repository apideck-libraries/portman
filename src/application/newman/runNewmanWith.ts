import chalk from 'chalk'
import fs from 'fs-extra'
import newman, { NewmanRunOptions } from 'newman'
import path from 'path'
import { changeCase } from 'openapi-format'
import { buildJsonReport, JsonReportContext, writeJsonReport } from './jsonReport'

export interface RunNewmanReportOptions extends JsonReportContext {
  /** Write a machine-readable JSON run report to this path */
  jsonReport?: string
}

export const runNewmanWith = async (
  postmanCollectionFile: string,
  newmanEnvFile: string,
  newmanDataFile: string | undefined,
  newmanRunOptions: Partial<NewmanRunOptions>,
  reportOptions: RunNewmanReportOptions = {}
): Promise<void> => {
  const defaultNewmanOptions = {
    // Read the files on every run (not via require), so a long-lived process such as the MCP
    // server never runs a stale, cached collection or environment.
    collection: fs.readJsonSync(path.resolve(postmanCollectionFile)),
    environment: fs.readJsonSync(path.resolve(newmanEnvFile)),
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
    (a, c) => ((a[`${changeCase(c, 'camelCase')}`] = newmanRunOptions[c]), a),
    {}
  ) as Partial<NewmanRunOptions>
  // Merge Newman default and runtime options
  const newmanOptions = { ...defaultNewmanOptions, ...newmanRunOptionsCased }

  return new Promise((resolve, reject) => {
    try {
      newman.run(newmanOptions).on('done', (err: Error, summary) => {
        const assertionFailures = Number(summary?.run?.stats?.assertions?.failed || 0)
        const runFailures = Array.isArray(summary?.run?.failures) ? summary.run.failures.length : 0
        const hasError = Boolean(err || summary?.error)
        const hasFailures = assertionFailures > 0 || runFailures > 0

        // Write the JSON report before resolving/rejecting, so it exists on success and failure.
        // A report writing problem is logged but never changes the run outcome / exit code.
        if (reportOptions.jsonReport) {
          try {
            const { jsonReport, ...context } = reportOptions
            writeJsonReport(jsonReport, buildJsonReport(summary, context, err))
            console.log(chalk.green(`JSON report written to ${jsonReport}`))
          } catch (reportError) {
            console.error(chalk.red(`Unable to write JSON report: ${reportError?.message}`))
          }
        }

        if (hasError || hasFailures) {
          console.error(chalk.red('Collection run encountered failures.'))
          if (err) {
            console.error(chalk.red(err.message))
          }
          if (summary?.error) {
            console.error(chalk.red(summary.error.message))
          }
          if (hasFailures) {
            console.error(
              chalk.red(`Failed assertions: ${assertionFailures}; Failures: ${runFailures}`)
            )
          }
          // Reject instead of exiting; caller decides process exit code
          reject(err || summary?.error || new Error('Newman run failed with test failures'))
        } else {
          console.log(chalk.green('Collection run completed.'))
          resolve()
        }
      })
    } catch (caughtError) {
      reject(caughtError)
    }
  })
}
