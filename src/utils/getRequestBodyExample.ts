const normalizeRequestBodyExample = (example: unknown, contentType: string): unknown => {
  if (!contentType.includes('json') || typeof example !== 'string') return example
  try {
    return JSON.parse(example)
  } catch (error) {
    return example
  }
}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const getRequestBodyExamples = (reqBody: any, contentType: string): unknown[] => {
  if (!reqBody?.content) return []
  const content = reqBody.content[contentType]
  if (!content) return []
  const examples = [] as unknown[]
  if (content.example !== undefined) {
    examples.push(normalizeRequestBodyExample(content.example, contentType))
  }
  if (content.examples) {
    const exampleMap = content.examples as Record<string, { value?: unknown }>
    Object.values(exampleMap).forEach(exampleObj => {
      if (exampleObj?.value !== undefined) {
        examples.push(normalizeRequestBodyExample(exampleObj.value, contentType))
      }
    })
  }
  if (content.schema && (content.schema as any).example !== undefined) {
    examples.push(normalizeRequestBodyExample((content.schema as any).example, contentType))
  }
  return examples
}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const getRequestBodyExample = (reqBody: any, contentType: string): string | undefined => {
  const examples = getRequestBodyExamples(reqBody, contentType)
  if (examples.length === 0) return undefined
  const example = examples[0]
  return typeof example === 'string' ? example : JSON.stringify(example, null, 2)
}

export const getRawLanguageFromContentType = (contentType: string): string => {
  if (contentType.includes('json')) return 'json'
  if (contentType.includes('xml')) return 'xml'
  return 'text'
}
