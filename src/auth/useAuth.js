import { useCallback, useMemo } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { logout as logoutThunk } from '../store/slices/authSlice'

/**
 * Redux-backed auth hook for QC LIMS.
 * Provides user info, roles, rights, and rights-based access checks.
 * Follows marketing-automation convention: all authorization checks use user.rights.
 */
export default function useAuth() {
  const { token, user, isAuthenticated, loading } = useSelector((state) => state.auth)
  const dispatch = useDispatch()

  const logout = useCallback(() => {
    dispatch(logoutThunk())
  }, [dispatch])

  /** Extract normalized rights (upper-case) from user. */
  const rights = useMemo(
    () => (user?.rights ?? []).map((r) => String(r).toUpperCase()),
    [user],
  )

  /** Check if user holds a specific right. */
  const hasRight = useCallback(
    (right) => {
      if (!right) return false
      return rights.includes(String(right).toUpperCase())
    },
    [rights],
  )

  /** Check if user holds ANY of the given rights. */
  const hasAnyRight = useCallback(
    (...required) => {
      const flat = required.flat().filter(Boolean)
      if (!flat.length) return false
      return flat.some((r) => rights.includes(String(r).toUpperCase()))
    },
    [rights],
  )

  /** Check if user holds a specific role (case-insensitive). */
  const hasRole = useCallback(
    (roleName) => {
      const roles = user?.roles
      if (!roles || !roleName) return false
      return roles.some((r) => r.toLowerCase() === roleName.toLowerCase())
    },
    [user],
  )

  /** Check if user holds ANY of the given roles. */
  const hasAnyRole = useCallback(
    (...roleNames) => {
      const roles = (user?.roles ?? []).map((r) => r.toLowerCase())
      return roleNames.some((n) => roles.includes(n.toLowerCase()))
    },
    [user],
  )

  return {
    user,
    token,
    rights,
    loading,
    isAuthenticated,
    isAdmin: hasAnyRole('admin'),
    hasRight,
    hasAnyRight,
    hasRole,
    hasAnyRole,
    logout,
  }
}
