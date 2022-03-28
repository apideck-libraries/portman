import fs from 'fs-extra'
import prompts from 'prompts'

type InitConfigOptions = {
  localFolder?: string
  url?: string
  local?: string
  output?: string
  envFile?: string
  portmanConfigFile?: string
  postmanConfigFile?: string
  includeTests?: boolean
  syncPostman?: boolean
  runNewman?: string
  postmanApiKey?: string
}

export const promptInit = async (): Promise<void> => {
  const config: InitConfigOptions = {}
  const localPath = JSON.stringify(process.cwd())
  const consoleLine = process.stdout.columns ? '='.repeat(process.stdout.columns) : '='.repeat(80)

  console.log('\x1b[32m', consoleLine)
  console.log(`  Portman Configuration Utility`)
  console.log('\x1b[32m', consoleLine)

  const { choiceExec } = await prompts({
    type: 'select',
    name: 'choiceExec',
    message: 'Welcome to Portman, how can we help?',
    choices: [
      {
        title: 'Configure my CLI options',
        value: 'portmanConfig'
      },
      { title: 'Enter my Postman API key', value: 'postmanApiKey' }
    ],
    initial: 0
  })

  if (choiceExec === 'postmanApiKey') {
    const { postmanApiKey } = await prompts({
      type: 'text',
      name: 'postmanApiKey',
      message:
        'For more details on how to get your Postman API key see https://github.com/apideck-libraries/portman/tree/main#configure-automatic-upload-to-postman-app\n' +
        'Enter your Postman API key:'
    })
    config.postmanApiKey = postmanApiKey
  }

  // Configure CLI Options

  if (choiceExec === 'portmanConfig') {
    const { choiceLocation } = await prompts({
      type: 'select',
      name: 'choiceLocation',
      message: 'Where is your OpenAPI specification located?',
      choices: [
        {
          title: 'REMOTE',
          value: 'remote',
          description: 'The OpenAPI spec is remote, on a publicly available URL'
        },
        { title: 'LOCAL', value: 'local', description: 'The OpenAPI spec is a local file' }
      ],
      initial: 0
    })

    if (choiceLocation === 'local') {
      const { local } = await prompts({
        type: 'text',
        name: 'local',
        message: 'Enter the local file path to your OpenAPI specification:'
      })
      config.local = local
    }

    if (choiceLocation === 'remote') {
      const { url } = await prompts({
        type: 'text',
        name: 'url',
        message: 'Enter the publicly available URL of your OpenAPI specification:',
        initial: 'https://'
      })
      config.url = url
    }

    const { output } = await prompts({
      type: 'text',
      name: 'output',
      message:
        `Define the path to store the generated the Postman collection, relative to ${localPath}\n` +
        `Enter the output file path:`,
      initial: `collection.postman.json`
    })
    config.output = output

    const { location } = await prompts({
      type: 'text',
      name: 'location',
      message:
        `Where do you want to save the Portman CLI settings, relative to ${localPath}\n` +
        `Enter the local folder path:`,
      initial: `portman`
    })
    config.localFolder = location

    const { choiceEnv } = await prompts({
      type: 'confirm',
      name: 'choiceEnv',
      message: 'Do you want to use a .ENV file to pass variables to Postman?',
      initial: true
    })

    if (choiceEnv) {
      const { envFile } = await prompts({
        type: 'text',
        name: 'envFile',
        message:
          `Define the file path for your .env file, relative to ${localPath}\n` +
          `Enter the .env file path:`,
        initial: config.localFolder + '/.env-portman'
      })
      config.envFile = envFile
    }

    const { choicePortmanConfigFile } = await prompts({
      type: 'toggle',
      name: 'choicePortmanConfigFile',
      message:
        'Use a custom Portman configuration file or the default "portman-config.default.json"?',
      initial: true,
      active: 'custom',
      inactive: 'default'
    })

    if (choicePortmanConfigFile) {
      const { portmanConfigFile } = await prompts({
        type: 'text',
        name: 'portmanConfigFile',
        message:
          `Let's define the file path to your Portman configuration file, relative to ${localPath}\n` +
          `Enter the Portman configuration file path:`,
        initial: config.localFolder + '/portman-config.json'
      })
      config.portmanConfigFile = portmanConfigFile
    }

    const { choicePostmanConfigFile } = await prompts({
      type: 'toggle',
      name: 'choicePostmanConfigFile',
      message:
        'Use a custom openapi-to-postman configuration file or the default "postman-config.default.json"?',
      initial: true,
      active: 'default',
      inactive: 'custom'
    })

    if (!choicePostmanConfigFile) {
      const { postmanConfigFile } = await prompts({
        type: 'text',
        name: 'postmanConfigFile',
        message:
          `Define the file path to your custom openapi-to-postman configuration file, relative to ${localPath}\n` +
          `Enter the openapi-to-postman configuration file path:`,
        initial: config.localFolder + '/openapi-to-postman-config.json'
      })
      config.postmanConfigFile = postmanConfigFile
    }

    const { includeTests } = await prompts({
      type: 'toggle',
      name: 'includeTests',
      message: 'Inject automatic contract tests, based on OpenAPI into Postman?',
      initial: true,
      active: 'yes',
      inactive: 'no'
    })
    config.includeTests = includeTests

    const { syncPostman } = await prompts({
      type: 'toggle',
      name: 'syncPostman',
      message: 'Upload the generated collection to Postman?',
      initial: true,
      active: 'yes',
      inactive: 'no'
    })
    config.syncPostman = syncPostman

    if (syncPostman) {
      const { postmanApiKey } = await prompts({
        type: 'text',
        name: 'postmanApiKey',
        message:
          'For more details on how to get your Postman API key see https://github.com/apideck-libraries/portman/tree/main#configure-automatic-upload-to-postman-app\n' +
          'Enter your Postman API key:'
      })
      config.postmanApiKey = postmanApiKey
    }

    const { runNewman } = await prompts({
      type: 'toggle',
      name: 'runNewman',
      message: 'Run Newman after the Portman conversion?',
      initial: false,
      active: 'yes',
      inactive: 'no'
    })
    config.runNewman = runNewman
  }

  // Write portman-cli.json file
  if (config.localFolder && (config.url || config.local)) {
    const portmanCliFilePath = `${config?.localFolder}/portman-cli.json`
    const { localFolder, postmanApiKey, ...cleanConfig } = config
    const portmanCliSettings = JSON.stringify(cleanConfig, null, 2)
    try {
      if (!fs.existsSync(config.localFolder)) {
        fs.mkdirSync(config.localFolder)
      }

      fs.outputFileSync(portmanCliFilePath, portmanCliSettings, 'utf8')
    } catch (err) {
      console.error('\x1b[31m', `Output file error - no such directory "./${config?.localFolder}"`)
      process.exit(1)
    }

    console.log('\x1b[32m', consoleLine)
    console.log(`  Configuration Complete`)
    console.log('\x1b[32m', consoleLine)

    console.log(
      `\nYour Portman configuration has been created in "${portmanCliFilePath}".\n` +
        `You can execute Portman by running the following command: `
    )

    console.log('\x1b[34m', `\n    portman --cliOptionsFile ${portmanCliFilePath}\n`)
    console.log('\x1b[32m', consoleLine)
  }

  if (config.envFile || config.postmanApiKey) {
    // Write .env file
    const envFilePath = config.envFile || '.env'
    let envContent = '' as string
    envContent += `### PORTMAN INJECTED VARIABLES\n`

    if (config.postmanApiKey)
      envContent += `\n### POSTMAN APP\nPOSTMAN_API_KEY=${config.postmanApiKey}`

    try {
      await fs.appendFile(envFilePath, envContent, { encoding: 'utf8' })
    } catch (err) {
      console.error('\x1b[31m', `Output file error - no such file directory "./${envFilePath}"`)
      process.exit(1)
    }
  }
}
