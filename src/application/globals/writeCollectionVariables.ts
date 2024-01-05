import { CollectionDefinition, VariableDefinition } from 'postman-collection'
import { upsertVariable } from 'application'

export const writeCollectionVariables = (
  obj: CollectionDefinition,
  dictionary: Record<string, unknown>
): CollectionDefinition => {
  let variables = (obj.variable as VariableDefinition[]) || []

  // Set Variables
  for (const [key, value] of Object.entries(dictionary)) {
    variables = upsertVariable(variables, key, value, typeof value)
  }

  // Make variables unique
  const uniqueVariables = Array.from(new Set(variables))

  const collection = JSON.parse(JSON.stringify(obj))
  collection.variable = uniqueVariables

  return collection as CollectionDefinition
}
