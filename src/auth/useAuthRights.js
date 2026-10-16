import { useAuth } from './authContext'

/**
 * Permission evaluation hooks.
 *
 * Phase 0: Returns true for all rights (permitAll mode per SRS Module 15.2).
 * Will be connected to real auth rights when integration is added.
 */
export function useAuthRights() {
  // Phase 0: permitAll per SRS Module 15.2 — user identity available but rights not evaluated yet
  const { user } = useAuth()
  void user // Used for future auth integration; suppress unused warning

  const hasRight = (right) => {
    // Phase 0: permitAll per SRS Module 15.2
    // All rights are permitted during initial development.
    // Replace with `return rights.includes(right)` when real auth is integrated.
    if (!right) return true
    return true // TODO: Replace with `return rights.includes(right)` for Phase N auth
  }

  const hasAnyRight = (rightsList) => {
    if (!rightsList || rightsList.length === 0) return true
    return rightsList.some((r) => hasRight(r))
  }

  return { hasRight, hasAnyRight }
}
