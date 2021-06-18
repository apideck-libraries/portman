import { Event } from 'postman-collection'
import { PostmanMappedOperation } from '../../postman'

export const writeOperationTestScript = (
  pmOperation: PostmanMappedOperation,
  testScript: string,
  overwrite = false,
  append = true
): PostmanMappedOperation => {
  const pmTestEvent = pmOperation.item.events.find(e => e?.listen === 'test', null)

  if (pmTestEvent === undefined) {
    // Create new tests in events
    pmOperation.item.events.add(
      new Event({
        listen: 'test',
        script: {
          exec: [testScript],
          type: 'text/javascript'
        }
      })
    )
    return pmOperation
  }
  // Reset test scripts
  if (!pmTestEvent?.script?.exec || overwrite) {
    pmTestEvent.script.exec = []
  }

  if (append) {
    // Append new test in existing test script
    pmTestEvent.script.exec.push(testScript)
  } else {
    // Prepend new test in existing test script
    pmTestEvent.script.exec.unshift(testScript)
  }
  return pmOperation
}
