import { useState, useCallback } from 'react'
import { AuthContext } from './authContext'

/**
 * Authentication context provider.
 *
 * Phase 0: Mock user data for initial development (per SRS Module 15.2).
 * Will be replaced with real auth integration in a later phase.
 */
export function AuthProvider({ children }) {
  const [authState, setAuthState] = useState({
    user: {
      id: 1,
      name: 'Demo User',
      designation: 'QC Head',
    },
    rights: [],
    token: null,
    isAuthenticated: true,
  })

  const login = useCallback((token, user) => {
    localStorage.setItem('auth_token', token)
    setAuthState({
      user,
      rights: [],
      token,
      isAuthenticated: true,
    })
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('auth_token')
    setAuthState({
      user: null,
      rights: [],
      token: null,
      isAuthenticated: false,
    })
  }, [])

  const setRights = useCallback((rights) => {
    setAuthState((prev) => ({ ...prev, rights }))
  }, [])

  return (
    <AuthContext.Provider value={{ ...authState, login, logout, setRights }}>
      {children}
    </AuthContext.Provider>
  )
}
