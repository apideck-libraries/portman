import oaConverter from 'openapi-to-postmanv2'
import path from 'path'
import fs from 'fs-extra'

export class OpenApiToPostmanService {
  /**
   * Helper function for the CLI to convert OpenApi data input
   * (ported from https://github.com/postmanlabs/openapi-to-postman)
   * @param {String} openApiObj - OpenApi spec file used for conversion input
   * @param options - OpenApi to Postman conversion options
   * @returns {string}
   */
  async convert(openApiObj: string, options: any): Promise<string> {
    return await new Promise((resolve, reject) => {

      let inputFile = path.resolve(options.inputFile)
      openApiObj = fs.readFileSync(inputFile, 'utf8')

      // apply options from config file if present
      if (options.configFile) {
        let configFile = path.resolve(options.configFile)
        // console.log('Options Config file: ', configFile)
        let configFileOptions = JSON.parse(fs.readFileSync(configFile, 'utf8'))
        options = Object.assign({}, options, configFileOptions)
      }

      if (options.testsuiteFile) {
        let testsuiteFile = path.resolve(options.testsuiteFile)
        // console.log('Testsuite file: ', testsuiteFile)
        options.testSuite = true
        options.testSuiteSettings = JSON.parse(fs.readFileSync(testsuiteFile, 'utf8'))
      }

      // Convert OpenApi to Postman collection
      oaConverter.convert({
        type: 'string',
        data: openApiObj
      }, options, (err, status) => {
        if (err) {
          reject(err)
        }
        if (!status.result) {
          // console.log(status.reason)
          reject(status.reason)
        } else if (options.outputFile) {
          let filePath = path.resolve(options.outputFile)
          // console.log('Writing to Postman collection: ', options.prettyPrintFlag, filePath, status) // eslint-disable-line no-console
          fs.writeFile(filePath, JSON.stringify(status.output[0].data, null, 4), (err) => {
            if (err) {
              console.log('Could not write to file', err)
              reject(err)
            }
            console.log('\x1b[32m%s\x1b[0m', '\n ✅ Conversion successful, Postman collection written to file\n ')
          })
          // Return Postman collection
          resolve(status.output[0].data)
        } else {
          // console.log(status.output[0].data)
          resolve(status.output[0].data)
        }
      })
    })
  }
}
