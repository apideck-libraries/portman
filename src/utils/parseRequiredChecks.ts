import { contractTestChecks, ContractTestCheck } from '../types'

/**
 * Parses the requireChecks option (comma-separated string or array) into a list of contract test checks.
 * Throws when an unknown contract test check name is passed.
 */
export const parseRequiredChecks = (
  requireChecks: string | string[] | undefined
): ContractTestCheck[] => {
  if (!requireChecks) return []

  const checks = (Array.isArray(requireChecks) ? requireChecks : [requireChecks])
    .flatMap(check => String(check).split(','))
    .map(check => check.trim())
    .filter(check => check !== '')

  const unknownChecks = checks.filter(
    check => !contractTestChecks.includes(check as ContractTestCheck)
  )
  if (unknownChecks.length > 0) {
    throw new Error(
      `Unknown contract test check(s): ${unknownChecks.join(', ')}. ` +
        `Valid checks are: ${contractTestChecks.join(', ')}`
    )
  }

  return [...new Set(checks)] as ContractTestCheck[]
}
