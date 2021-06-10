import { camelCase } from 'camel-case'
import { config } from 'dotenv'
import path from 'path'
import { CollectionDefinition, VariableDefinition } from 'postman-collection'

const upsertEnvVariable = (
  variables: VariableDefinition[],
  key: string,
  value: unknown,
  type: string
) => {
  const toInject = { key, value, type }
  const updateIndex = variables.findIndex(variable => variable['id'] === key)

  if (updateIndex > -1) {
    variables[updateIndex] = toInject
  } else {
    variables.push(toInject)
  }

  return variables
}

export const injectEnvVariables = (
  obj: CollectionDefinition,
  envFile: string | undefined,
  baseUrl: string | undefined
): CollectionDefinition => {
  if (!envFile) return obj

  let variables = (obj.variable as VariableDefinition[]) || []
  const baseUrlFromSpec = variables.find(item => {
    return (item.id = 'baseUrl')
  })?.value

  const { parsed = {} } = config({ path: path.resolve(envFile) })

  for (const [key, val] of Object.entries(parsed)) {
    if (key.startsWith('PORTMAN_')) {
      const id = key.replace('PORTMAN_', '')
      variables = upsertEnvVariable(variables, camelCase(id), val, 'string')
    }
  }

  variables = upsertEnvVariable(variables, 'baseUrl', baseUrl || baseUrlFromSpec, 'string')
  obj.variable = [...new Set(variables)]
  return obj
}
