import fs from 'fs-extra'
import { CollectionDefinition } from 'postman-collection'

export const writeNewmanEnv = (obj: CollectionDefinition, newmanEnvFilePath: string): void => {
  if (!obj?.variable) {
    console.log('Collection contains no variables to write to env file')
    return
  }

  const envVariables = obj.variable.map(item => {
    return {
      enabled: true,
      key: item.key,
      value: item.value
    }
  })

  fs.outputFileSync(
    newmanEnvFilePath,
    JSON.stringify(
      {
        id: 'fed4e16e-2f7f-4a16-8fda-9929c41296dd',
        name: 'Newman Run',
        _postman_variable_scope: 'environment',
        values: envVariables
      },
      null,
      2
    )
  )
}
