import fs from 'fs-extra'
import oaConverter from 'openapi-to-postmanv2'
import { OpenAPIV3 } from 'openapi-types'
import ora from 'ora'
import path from 'path'

export interface IOpenApiToPostmanConfig {
  inputFile?: string
  openApiObj?: OpenAPIV3.Document
  outputFile: string
  configFile: string
}

export class OpenApiToPostmanService {
  openApiObj: OpenAPIV3.Document

  async convert(options: IOpenApiToPostmanConfig): Promise<Record<string, unknown>> {
    return await new Promise((resolve, reject) => {
      let converterOptions = {}
      const { inputFile, openApiObj, configFile, outputFile } = options

      if (openApiObj) {
        this.openApiObj = openApiObj
      } else if (inputFile) {
        this.openApiObj = JSON.parse(fs.readFileSync(path.resolve(inputFile), 'utf8'))
      } else {
        throw new Error('Missing OpenApiSpec Input.')
      }

      // apply options from config file if present
      if (configFile) {
        converterOptions = JSON.parse(fs.readFileSync(path.resolve(configFile), 'utf8'))
      }

      const spinner = ora({
        prefixText: ' ',
        text: 'Converting OpenApi to Postman Collection'
      }).start()

      // Convert OpenApi to Postman collection
      oaConverter.convert(
        {
          type: 'json',
          data: this.openApiObj
        },
        converterOptions,
        (err, status) => {
          if (err) {
            spinner.fail(err.toString())
            reject(err)
          }
          if (!status.result) {
            spinner.fail(status.reason)
            reject(status.reason)
          } else if (outputFile) {
            const filePath = path.resolve(outputFile)

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
