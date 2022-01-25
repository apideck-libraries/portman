import fs from 'fs'
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

    const scriptContents = scripts.map(src => {
      if (src.startsWith('file:')) {
        return getScriptContent(src.replace('file:', ''))
      } else {
        return src
      }
    })
    const script = new Script(preRequestEvent.script as ScriptDefinition)
    if (script.exec === undefined) script.exec = []
    const exec =
      script.exec && Array.isArray(script.exec)
        ? ([] as string[]).concat(Array.from(script.exec), Array.from(scriptContents))
        : ([script.exec] as string[]).concat(Array.from(scriptContents))
    script.update({ exec: exec.filter(i => Boolean(i)) as string[] })
    preRequestEvent.script = script.toJSON()
    operation.events.add(new Event(preRequestEvent))

    return pmOperation
  })
}

function getScriptContent(scriptPath: string): string {
  try {
    return fs.readFileSync(scriptPath, { encoding:'utf8', flag:'r' })
  } catch(ex) {
    console.error(
      '\x1b[31m', 
      `Config pre-request script file error - no such file or directory "${scriptPath}"`)
    process.exit(1)
  }
}
