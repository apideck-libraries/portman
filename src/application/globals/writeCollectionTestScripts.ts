import fs from 'fs'
import { CollectionDefinition, EventDefinition, Script, ScriptDefinition } from 'postman-collection'

export const writeCollectionTestScripts = (
  collection: CollectionDefinition,
  scripts: string[]
): CollectionDefinition => {
  const collectionEvents = collection?.event || []

  let testEvent = collectionEvents && collectionEvents.find(e => e?.listen === 'test', null)

  if (!testEvent) {
    testEvent = {
      listen: 'test',
      script: {
        exec: [],
        type: 'text/javascript'
      }
    } as EventDefinition
  }

  const scriptContents = scripts.map(src => {
    if (src.startsWith('file:')) {
      return getScriptContent(src.replace('file:', ''))
    } else {
      return src
    }
  })
  const script = new Script(testEvent.script as ScriptDefinition)
  if (script.exec === undefined) script.exec = []
  const exec = Array.isArray(script.exec)
    ? ([] as string[]).concat(Array.from(script.exec), Array.from(scriptContents))
    : ([script.exec] as string[]).concat(Array.from(scriptContents))
  script.update({ exec: exec.filter(i => Boolean(i)) as string[] })
  testEvent.script = script.toJSON()
  collection.event = collection?.event
    ? ([] as EventDefinition[]).concat(Array.from(collection.event), [testEvent])
    : [testEvent]

  return collection
}

function getScriptContent(scriptPath: string): string {
  try {
    return fs.readFileSync(scriptPath, { encoding: 'utf8', flag: 'r' })
  } catch (ex) {
    console.error(
      '\x1b[31m',
      `Config collection test script file error - no such file or directory "${scriptPath}"`
    )
    process.exit(1)
  }
}
