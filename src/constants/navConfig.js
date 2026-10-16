import { LayoutDashboard, FlaskConical, Truck, ClipboardList, BarChart3, Package, TestTube } from 'lucide-react'
import { Rights } from './rights'

/**
 * Navigation configuration.
 * Each entry defines a sidebar menu item with icon, path, and required right.
 *
 * Phase 2: Added Inward, e-TRF nav entries gated by respective rights.
 */
export const navConfig = [
  {
    label: 'Dashboard',
    path: '/dashboard',
    icon: LayoutDashboard,
    right: null,
  },
  {
    label: 'Test Parameters',
    path: '/test-parameters',
    icon: FlaskConical,
    right: Rights.ROLE_TEST_PARAMETER_READ,
  },
  {
    label: 'Inward',
    path: '/inward',
    icon: Truck,
    right: Rights.ROLE_INWARD_VIEW,
  },
  {
    label: 'e-TRF',
    path: '/trf',
    icon: ClipboardList,
    right: Rights.ROLE_TRF_VIEW,
  },
  {
    label: 'Analytics',
    path: '/analytics',
    icon: BarChart3,
    right: Rights.ROLE_ANALYTICS_VIEW,
  },
  {
    label: 'QC Inventory',
    path: '/inventory',
    icon: Package,
    right: Rights.ROLE_INVENTORY_READ,
  },
  {
    label: 'Test Allocation',
    path: '/test-allocation',
    icon: TestTube,
    right: Rights.ROLE_TEST_ALLOCATE,
  },
  {
    label: 'Test Execution',
    path: '/test-execution',
    icon: TestTube,
    right: Rights.ROLE_TEST_VIEW,
  },
]
