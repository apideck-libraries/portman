import { Event, EventDefinition, EventList, Script, ScriptDefinition } from 'postman-collection'
import { PostmanMappedOperation } from 'src/postman'

export const writeOperationPreRequestScripts = (
  pmOperations: PostmanMappedOperation[],
  scripts: string[]
): PostmanMappedOperation[] => {
  return pmOperations.map(pmOperation => {
    const operation = pmOperation.item
    const operationEvents: EventList = operation?.events || []

    let preRequestEvent: EventDefinition =
      operationEvents && operationEvents.find(e => e?.listen === 'prerequest', null)

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
    const exec = Array.isArray(script.exec)
      ? [...script.exec, ...scripts]
      : [script.exec, ...scripts]
    script.update({ exec: exec.filter(i => Boolean(i)) as string[] })
    preRequestEvent.script = script.toJSON()
    operation.events.add(new Event(preRequestEvent))

    return pmOperation
  })
}
