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

  const script = new Script(preRequestEvent.script as ScriptDefinition)
  const exec = Array.isArray(script.exec) ? [...script.exec, ...scripts] : [script.exec, ...scripts]
  script.update({ exec: exec.filter(i => Boolean(i)) as string[] })
  preRequestEvent.script = script.toJSON()
  collection.event = collection?.event ? [...collection.event, preRequestEvent] : [preRequestEvent]

  return collection
}
