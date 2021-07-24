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
  if (script.exec === undefined) script.exec = []
  const exec = Array.isArray(script.exec)
    ? ([] as string[]).concat(Array.from(script.exec), Array.from(scripts))
    : ([script.exec] as string[]).concat(Array.from(scripts))
  script.update({ exec: exec.filter(i => Boolean(i)) as string[] })
  preRequestEvent.script = script.toJSON()
  collection.event = collection?.event
    ? ([] as EventDefinition[]).concat(Array.from(collection.event), [preRequestEvent])
    : [preRequestEvent]

  return collection
}
