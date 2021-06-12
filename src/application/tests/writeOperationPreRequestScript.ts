import { Event } from 'postman-collection'
import { PostmanMappedOperation } from '../../postman'

export const writeOperationPreRequestScript = (
  pmOperation: PostmanMappedOperation,
  preRequestScript: string,
  overwrite = false,
  append = true
): PostmanMappedOperation => {
  const pmPreRequestEvent = pmOperation.item.events.find(e => e?.listen === 'prerequest', null)

  if (pmPreRequestEvent === undefined) {
    // Create new tests in events
    pmOperation.item.events.add(
      new Event({
        listen: 'prerequest',
        script: {
          exec: [preRequestScript],
          type: 'text/javascript'
        }
      })
    )
    return pmOperation
  }
  // Reset pre-request scripts
  if (!pmPreRequestEvent?.script?.exec || overwrite) {
    pmPreRequestEvent.script.exec = []
  }

  if (append) {
    // Append new script in existing pre-request
    pmPreRequestEvent.script.exec.push(preRequestScript)
  } else {
    // Prepend new script in existing pre-request
    pmPreRequestEvent.script.exec.unshift(preRequestScript)
  }
  return pmOperation
}
