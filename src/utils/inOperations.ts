import { PostmanMappedOperation } from 'postman'

export const inOperations = (
  target: PostmanMappedOperation,
  operations: string[] | undefined
): boolean => {
  // Early exit
  if (!operations) return false

  return (target?.id && operations.includes(target?.id)) || operations.includes(target?.pathRef)
}
