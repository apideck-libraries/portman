export const PortmanRequestTypes = {
  integration: 'integration',
  variation: 'variation',
  contract: 'contract'
} as const

export type PortmanRequestType = typeof PortmanRequestTypes[keyof typeof PortmanRequestTypes]
