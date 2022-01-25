import fs from 'fs'
import { CollectionDefinition, EventDefinition, Script, ScriptDefinition } from 'postman-collection'

export const writeCollectionPreRequestScripts = (
  collection: CollectionDefinition,
  scripts: string[]
): CollectionDefinition => {
  const collectionEvents = collection?.event || []

  let preRequestEvent =
    collectionEvents && collectionEvents.find(e => e?.listen === 'prerequest', null)

  if (!preRequestEvent) {
    preRequestEvent = {
      listen: 'prerequest',
      script: {
        exec: [],
        type: 'text/javascript'
      }
    } as EventDefinition
  }

  const scriptContents = scripts.map(src => {
    if (src.startsWith('file:')) {
      return fs.readFileSync(src.replace('file:', ''), { encoding:'utf8', flag:'r' })
    } else {
      return src
    }
  })
  const script = new Script(preRequestEvent.script as ScriptDefinition)
  if (script.exec === undefined) script.exec = []
  const exec = Array.isArray(script.exec)
    ? ([] as string[]).concat(Array.from(script.exec), Array.from(scriptContents))
    : ([script.exec] as string[]).concat(Array.from(scriptContents))
  script.update({ exec: exec.filter(i => Boolean(i)) as string[] })
  preRequestEvent.script = script.toJSON()
  collection.event = collection?.event
    ? ([] as EventDefinition[]).concat(Array.from(collection.event), [preRequestEvent])
    : [preRequestEvent]

  return collection
}
