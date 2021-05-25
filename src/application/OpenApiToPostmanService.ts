import fs from 'fs-extra'
import oaConverter from 'openapi-to-postmanv2'
import ora from 'ora'
import path from 'path'

export class OpenApiToPostmanService {
  /**
   * Helper function for the CLI to convert OpenApi data input
   * (ported from https://github.com/postmanlabs/openapi-to-postman)
   * @param {String} openApiObj - OpenApi spec file used for conversion input
   * @param options - OpenApi to Postman conversion options
   * @returns {string}
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-module-boundary-types
  async convert(openApiObj: string, options: any): Promise<string> {
    return await new Promise((resolve, reject) => {
      const inputFile = path.resolve(options.inputFile)
      openApiObj = fs.readFileSync(inputFile, 'utf8')

      // apply options from config file if present
      if (options.configFile) {
        const configFile = path.resolve(options.configFile)
        // console.log('Options Config file: ', configFile)
        const configFileOptions = JSON.parse(fs.readFileSync(configFile, 'utf8'))
        options = Object.assign({}, options, configFileOptions)
      }

      if (options.testsuiteFile) {
        const testsuiteFile = path.resolve(options.testsuiteFile)
        // console.log('Testsuite file: ', testsuiteFile)
        options.testSuite = true
        options.testSuiteSettings = JSON.parse(fs.readFileSync(testsuiteFile, 'utf8'))
      }

      const spinner = ora({
        prefixText: ' ',
        text: 'Converting OpenApi to Postman Collection'
      }).start()

      // Convert OpenApi to Postman collection
      oaConverter.convert(
        {
          type: 'string',
          data: openApiObj
        },
        options,
        (err, status) => {
          if (err) {
            spinner.fail(err.toString())
            reject(err)
          }
          if (!status.result) {
            // console.log(status.reason)
            spinner.fail(status.reason)
            reject(status.reason)
          } else if (options.outputFile) {
            const filePath = path.resolve(options.outputFile)

            try {
              fs.writeFileSync(filePath, JSON.stringify(status.output[0].data, null, 4))
            } catch (error) {
              console.log('Could not write to file', error)
              spinner.fail(error.toString())
              reject(error)
            }

            // Return Postman collection
            spinner.succeed('Conversion successful')
            resolve(status.output[0].data)
          } else {
            spinner.succeed('Conversion successful')
            resolve(status.output[0].data)
          }
        }
      )
    })
  }
}
