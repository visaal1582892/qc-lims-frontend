import { Navigate } from 'react-router-dom'
import { useAuth } from './authContext'
import { Routes } from '../constants/routes'

/**
 * Right-based route guard.
 * Renders children only if the user is authenticated.
 *
 * Phase 0: permitAll behavior — only checks authentication.
 * Right gating will be enforced when real auth is integrated.
 */
export function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth()

  if (!isAuthenticated) {
    return <Navigate to={Routes.LOGIN} replace />
  }

  // Phase 0: All routes are open (permitAll per SRS Module 15.2)
  return children
}
