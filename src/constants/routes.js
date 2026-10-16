/**
 * Route path constants.
 */
export const Routes = {
  HOME: '/',
  DASHBOARD: '/dashboard',
  LOGIN: '/login',
  TEST_PARAMETERS: '/test-parameters',
  INWARD: '/inward',
  TRF: '/trf',
  ANALYTICS: '/analytics',
  INVENTORY: '/inventory',
  INVENTORY_DETAIL: '/inventory/:id',
  // H-3 fix: INVENTORY_STORAGE constant removed — storage allocation is handled
  // via modal (StorageAllocationView) from InventoryDetailPage, not as a standalone route.
  INVENTORY_VARIANCE: '/inventory/variance',

  // Test Allocation & Execution State Machine (Phase 4) — SRS Module 6
  TEST_ALLOCATION: '/test-allocation',
  TEST_EXECUTION: '/test-execution',

  // Review Workflow (Phase 5) — SRS Module 7
  QC_REVIEW_QUEUE: '/review/qc-head',
  QA_REVIEW_QUEUE: '/review/qa-head',
  REVIEW_DETAIL: '/review/:executionId',
  REWORK_QUEUE: '/review/rework',

  // OOS Management (Phase 6) — SRS Module 8
  OOS_INCIDENTS: '/oos-incidents',
  OOS_INCIDENT_DETAIL: '/oos-incidents/:id',
  TRIAL_TESTS: '/trial-tests',
}
