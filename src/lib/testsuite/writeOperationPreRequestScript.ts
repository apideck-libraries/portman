import { PostmanMappedOperation } from 'lib/postman/PostmanMappedOperation'
import { Event } from 'postman-collection'

<<<<<<< HEAD:src/lib/testsuite/writeOperationPreRequestScript.ts
export const writeOperationPreRequestScript = (
=======
export const setPreRequestScript = (
>>>>>>> 4a289ac (add writeCollectionPreRequestScripts):src/lib/testsuite/setPreRequestScript.ts
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
