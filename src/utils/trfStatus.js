export function normalizeTrfStatus(status) {
  if (!status) return 'PENDING_DETAILS'
  const s = String(status).trim().toUpperCase()
  if (s === 'PD' || s === 'PENDING_DETAILS') return 'PENDING_DETAILS'
  if (s === 'PA' || s === 'PENDING_APPROVAL') return 'PENDING_APPROVAL'
  if (s === 'A' || s === 'APPROVED' || s === 'U' || s === 'UPLOADED') return 'APPROVED'
  if (s === 'N' || s === 'NEEDS_REVISION') return 'NEEDS_REVISION'
  return s
}

