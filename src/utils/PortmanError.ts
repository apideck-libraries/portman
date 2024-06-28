import chalk from 'chalk'
import emoji from 'node-emoji'

export class PortmanError extends Error {
  public static render(error: Record<string, unknown>): void {
    const consoleLine = process.stdout.columns ? '='.repeat(process.stdout.columns) : '='.repeat(80)

    console.log(
      emoji.get(':cold_sweat:'),
      chalk.yellow(`Portman Error:
    `)
    )
    error?.error && console.log(chalk.red(error.error))
    error?.detail && console.log(chalk.red(error.detail))
    console.log(chalk.red(consoleLine))

    process.exit(1)
  }
}
