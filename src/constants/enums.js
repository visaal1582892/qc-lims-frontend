/**
 * Shared enum constants.
 */
export const ExecutionStatus = {
  ALLOCATED: 'Allocated',
  TESTING: 'Testing',
  HOLD: 'Hold',
  CANCELLED_NOT_PERFORMED: 'Cancelled_Not_Performed',
  UNDER_REVIEW: 'Under_Review',
  REWORK_REQUESTED: 'Rework_Requested',
  RELEASED: 'Released',
}

export const ValidityStatus = {
  VALID: 'Valid',
  INVALID: 'Invalid',
}

export const ComplianceFlag = {
  PASS: 'PASS',
  FAIL: 'FAIL',
  PENDING: 'PENDING',
}

export const ArStatus = {
  REGISTERED: 'REGISTERED',
  IN_PROGRESS: 'IN_PROGRESS',
  ALL_TESTS_COMPLETE: 'ALL_TESTS_COMPLETE',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
}

// OOS Management (Phase 6) — SRS Module 8
export const OosDisposition = {
  PENDING: 'Pending',
  RETEST_AUTHORIZED: 'Retest_Authorized',
  RETEST_PASSED: 'Retest_Passed',
  BATCH_REJECTED: 'Batch_Rejected',
}

export const OosStatus = {
  PENDING: 'Pending',
  INVESTIGATING: 'Investigating',
  RESOLVED: 'Resolved',
  ESCALATED: 'Escalated',
}
