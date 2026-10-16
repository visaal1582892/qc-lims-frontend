import { useAuth } from './authContext'

/**
 * Permission evaluation hooks.
 *
 * Phase 0: Returns true for all rights (permitAll mode per SRS Module 15.2).
 * Will be connected to real auth rights when integration is added.
 */
export function useAuthRights() {
  const { rights } = useAuth()

  const hasRight = (right) => {
    // Phase 0: permitAll
    if (!right) return true
    return rights.includes(right)
  }

  const hasAnyRight = (rightsList) => {
    if (!rightsList || rightsList.length === 0) return true
    return rightsList.some((r) => hasRight(r))
  }

  return { hasRight, hasAnyRight }
}
