import { LayoutDashboard, FlaskConical } from 'lucide-react'
import { Rights } from './rights'

/**
 * Navigation configuration.
 * Each entry defines a sidebar menu item with icon, path, and required right.
 *
 * Phase 1: Added Test Parameters nav entry gated by ROLE_TEST_PARAMETER_READ (RC-3).
 */
export const navConfig = [
  {
    label: 'Dashboard',
    path: '/dashboard',
    icon: LayoutDashboard,
    right: null, // No right gating in Phase 0
  },
  {
    label: 'Test Parameters',
    path: '/test-parameters',
    icon: FlaskConical,
    right: Rights.ROLE_TEST_PARAMETER_READ,
  },
]
