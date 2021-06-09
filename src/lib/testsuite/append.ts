import { PostmanMappedOperation } from 'lib/postman/PostmanMappedOperation'
import { Event } from 'postman-collection'

export const append = (
  pmOperation: PostmanMappedOperation,
  pmTest: string,
  overwrite = false,
  append = true
): PostmanMappedOperation => {
  // PropertyList has a find method that takes a context, but not sure that that is yet
  const pmTests = pmOperation.item.events.find(e => e?.listen === 'test', null)

  if (pmTests === undefined) {
    // Create new tests in events
    pmOperation.item.events.add(
      new Event({
        listen: 'test',
        script: {
          exec: [pmTest],
          type: 'text/javascript'
        }
      })
    )
    return pmOperation
  }
  // Reset test scripts
  if (!pmTests?.script?.exec || overwrite) {
    pmTests.script.exec = []
  }

  if (append) {
    // Append new tests in existing events
    pmTests.script.exec.push(pmTest)
  } else {
    // Prepend new tests in existing events
    pmTests.script.exec.unshift(pmTest)
  }
  return pmOperation
}
