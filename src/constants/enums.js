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
