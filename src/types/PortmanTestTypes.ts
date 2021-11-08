export const PortmanTestTypes = {
  integration: 'integration',
  variation: 'variation',
  contract: 'contract'
} as const

export type PortmanTestType = typeof PortmanTestTypes[keyof typeof PortmanTestTypes]
