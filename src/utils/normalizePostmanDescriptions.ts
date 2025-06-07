export const normalizePostmanDescriptions = (obj: any): any => {
  if (Array.isArray(obj)) {
    return obj.map(normalizePostmanDescriptions)
  } else if (obj && typeof obj === 'object') {
    // Avoid mutating original object
    const normalized: Record<string, any> = { ...obj }
    for (const key of Object.keys(normalized)) {
      if (key === 'description') {
        const value = normalized[key]
        if (typeof value === 'object' && value !== null) {
          // Replace with content string or empty string
          normalized[key] = typeof value.content === 'string' ? value.content : ''
        }
      } else {
        normalized[key] = normalizePostmanDescriptions(normalized[key])
      }
    }
    return normalized
  } else {
    return obj
  }
}
