import { LayoutDashboard, FlaskConical, Truck, ClipboardList, BarChart3, Package, TestTube, ShieldCheck, AlertTriangle, RotateCcw, Send, FileText, Filter, ClipboardCheck } from 'lucide-react'
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
  {
    label: 'Review Queue',
    path: '/review/qc-head',
    icon: ShieldCheck,
    right: Rights.ROLE_QC_HEAD_REVIEW,
  },
  {
    label: 'OOS Incidents',
    path: '/oos-incidents',
    icon: AlertTriangle,
    right: Rights.ROLE_OOS_VIEW,
  },
  {
    label: 'Trial Tests',
    path: '/trial-tests',
    icon: RotateCcw,
    right: Rights.ROLE_INWARD_VIEW,
  },
  {
    label: 'Subcontracts',
    path: '/subcontracts',
    icon: Send,
    right: Rights.ROLE_SUBCONTRACT_VIEW,
  },
  {
    label: 'Documents',
    path: '/documents',
    icon: FileText,
    right: Rights.ROLE_DOCUMENT_VIEW,
  },
  {
    label: 'Tracking',
    path: '/tracking',
    icon: Filter,
    right: Rights.ROLE_DASHBOARD_VIEW,
  },
  {
    label: 'Receipt Checklist',
    path: '/receipt-checklist',
    icon: ClipboardCheck,
    right: Rights.ROLE_RECEIPT_CHECKLIST_VIEW,
  },
]
