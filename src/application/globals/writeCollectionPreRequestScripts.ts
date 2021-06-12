import { Collection, Event } from 'postman-collection'

export const writeCollectionPreRequestScripts = (
  collection: Collection,
  scripts: string[]
): Collection => {
  const preRequest = findCollectionPrequestScript(collection)

  if (!preRequest?.script) {
    preRequest.update({
      listen: 'prerequest',
      script: { exec: [], type: 'text/javascript' }
    })
  }

  preRequest.script.exec = [...scripts]

  return collection
}

export const findCollectionPrequestScript = (collection: Collection): Event => {
  let collectionPreRequestEvent = collection.events.find(e => e?.listen === 'prerequest', null)

  if (!collectionPreRequestEvent) {
    collection.events.add(
      new Event({
        listen: 'prerequest',
        script: {
          exec: [],
          type: 'text/javascript'
        }
      })
    )
    collectionPreRequestEvent = findCollectionPrequestScript(collection)
  }

  if (!collectionPreRequestEvent?.script) {
    collectionPreRequestEvent.update({
      listen: 'prerequest',
      script: { exec: [], type: 'text/javascript' }
    })
  }

  return collectionPreRequestEvent
}
