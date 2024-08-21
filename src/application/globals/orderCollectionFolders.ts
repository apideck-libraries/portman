/* eslint-disable @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any */
import { Collection, Item, ItemGroup } from 'postman-collection'

export const orderCollectionFolders = (obj: any, orderOfFolders: any = []): any => {
  // Convert the input object to a Postman Collection instance if it isn't already
  const collection = obj instanceof Collection ? obj : new Collection(obj)

  // Arrays to hold folders and non-folder items
  const folders: ItemGroup<Item>[] = []
  const nonFolderItems: Item[] = []

  // Iterate over the collection items to categorize them
  collection.items.each(item => {
    if (ItemGroup.isItemGroup(item)) {
      folders.push(item as ItemGroup<Item>)
    } else {
      nonFolderItems.push(item as Item)
    }
  })

  // Create a map for quick lookup of folder indexes by name
  const folderMap = new Map(folders.map((folder, index) => [folder.name, index]))

  // Sort folders based on the order provided
  const sortedFolders = orderOfFolders
    .map(name => folderMap.get(name)) // get the index of the folder by name
    .filter(index => index !== undefined) // filter out undefined (non-existent folders in the order list)
    .map(index => folders[index] as ItemGroup<Item>) // map to the actual folder items

  // Append remaining folders that were not in the orderOfFolders list
  const remainingFolders = folders.filter(folder => !orderOfFolders.includes(folder.name))

  // Combine the sorted and remaining folders
  const orderedFolders = [...sortedFolders, ...remainingFolders]

  // Clear the collection items
  collection.items.clear()

  // Add the sorted folders back to the collection
  orderedFolders.forEach(folder => collection.items.add(folder))

  // Append the non-folder root items back to the collection
  nonFolderItems.forEach(item => collection.items.add(item))

  const collectionObj = JSON.parse(JSON.stringify(collection))
  return collectionObj
}
