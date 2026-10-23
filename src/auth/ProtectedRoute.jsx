import { Navigate, useLocation } from 'react-router-dom'
import useAuth from '../auth/useAuth'

/**
 * Rights-based route guard for QC LIMS.
 *
 * Props:
 *   requireRight    – single right string (must hold)
 *   requireAnyRight – right string OR array — pass if user holds ANY
 *   fallback        – redirect target when denied (default /dashboard)
 *
 * Rights-based access control: checks user.rights from login response.
 */
export default function ProtectedRoute({
  children,
  requireRight,
  requireAnyRight,
  fallback = '/dashboard',
}) {
  const { isAuthenticated, loading, hasRight, hasAnyRight } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center text-slate-500">
        Loading...
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  if (requireRight && !hasRight(requireRight)) {
    return <Navigate to={fallback} replace />
  }

  if (requireAnyRight) {
    const required = Array.isArray(requireAnyRight) ? requireAnyRight : [requireAnyRight]
    if (!hasAnyRight(...required)) {
      return <Navigate to={fallback} replace />
    }
  }

  return children
}
