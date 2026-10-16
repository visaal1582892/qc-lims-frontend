import { LayoutDashboard } from 'lucide-react'

/**
 * Navigation configuration.
 * Each entry defines a sidebar menu item with icon, path, and required right.
 *
 * Phase 0: Dashboard placeholder only. Feature nav items added by phase.
 */
export const navConfig = [
  {
    label: 'Dashboard',
    path: '/dashboard',
    icon: LayoutDashboard,
    right: null, // No right gating in Phase 0
  },
]
