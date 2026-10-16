/**
 * Pure formatting utility functions.
 */

export function formatDate(isoString) {
  if (!isoString) return '-'
  return new Intl.DateTimeFormat('en-IN', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(isoString))
}

export function formatDateTime(isoString) {
  if (!isoString) return '-'
  return new Intl.DateTimeFormat('en-IN', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(isoString))
}

export function formatDecimal(value, decimals = 4) {
  if (value == null || value === '') return '-'
  return Number(value).toFixed(decimals)
}

export function formatCurrency(amount, currency = 'INR') {
  if (amount == null) return '-'
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
  }).format(amount)
}

/**
 * Returns a Tailwind class string for a status badge.
 * @param {string} status - Status value (e.g., 'Approved', 'Pending', 'Rejected')
 */
export function formatStatusBadge(status) {
  if (!status) return 'bg-slate-50 text-slate-600 ring-slate-200'

  const map = {
    approved: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    completed: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    released: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    pending: 'bg-amber-50 text-amber-700 ring-amber-200',
    allocated: 'bg-sky-50 text-sky-700 ring-sky-200',
    testing: 'bg-sky-50 text-sky-700 ring-sky-200',
    rejected: 'bg-rose-50 text-rose-700 ring-rose-200',
    cancelled: 'bg-rose-50 text-rose-700 ring-rose-200',
    hold: 'bg-orange-50 text-orange-700 ring-orange-200',
    under_review: 'bg-violet-50 text-violet-700 ring-violet-200',
    rework_requested: 'bg-orange-50 text-orange-700 ring-orange-200',
  }

  const key = status.toLowerCase().replace(/\s+/g, '_')
  return map[key] || 'bg-slate-50 text-slate-600 ring-slate-200'
}

/**
 * Returns a Tailwind class string for a status dot color.
 */
export function formatStatusDot(status) {
  if (!status) return 'bg-slate-400'

  const map = {
    approved: 'bg-emerald-500',
    completed: 'bg-emerald-500',
    released: 'bg-emerald-500',
    pending: 'bg-amber-500',
    allocated: 'bg-sky-500',
    testing: 'bg-sky-500',
    rejected: 'bg-rose-500',
    cancelled: 'bg-rose-500',
    hold: 'bg-orange-500',
    under_review: 'bg-violet-500',
    rework_requested: 'bg-orange-500',
  }

  const key = status.toLowerCase().replace(/\s+/g, '_')
  return map[key] || 'bg-slate-400'
}

/**
 * Returns a Tailwind class string for a storage condition badge.
 * Follows Tinted Badge pattern (UI spec).
 * @param {string} location - Storage condition value
 */
export function formatStorageConditionBadge(location) {
  if (!location) return 'bg-slate-50 text-slate-600 ring-slate-200'

  const map = {
    ambient: 'bg-amber-50 text-amber-700 ring-amber-200',
    refrigerator: 'bg-sky-50 text-sky-700 ring-sky-200',
    freezer: 'bg-indigo-50 text-indigo-700 ring-indigo-200',
    others: 'bg-slate-50 text-slate-600 ring-slate-200',
  }

  const key = location.toLowerCase().replace(/\s+/g, '_')
  return map[key] || 'bg-slate-50 text-slate-600 ring-slate-200'
}

/**
 * Returns temperature range text for a storage condition.
 */
export function getTemperatureRange(location) {
  if (!location) return ''
  const map = {
    ambient: 'Room temperature (20-25°C)',
    refrigerator: 'Refrigerated (2-8°C)',
    freezer: 'Frozen (-23 to -13°C)',
    others: 'Other',
  }
  const key = location.toLowerCase().replace(/\s+/g, '_')
  return map[key] || ''
}

/**
 * Returns a variance indicator object with classes and label.
 * @param {number} allocated - Allocated quantity
 * @param {number} consumed - Consumed quantity
 */
export function formatVarianceIndicator(allocated, consumed) {
  const variance = (allocated || 0) - (consumed || 0)
  if (variance <= 0) {
    return { classes: 'bg-emerald-50 text-emerald-700 ring-emerald-200', label: 'Fully consumed', variance }
  }
  if (variance <= 5) {
    return { classes: 'bg-amber-50 text-amber-700 ring-amber-200', label: `${variance} unconsumed`, variance }
  }
  return { classes: 'bg-rose-50 text-rose-700 ring-rose-200', label: `${variance} unconsumed`, variance }
}

/**
 * Returns a Tailwind class string for an AR lifecycle status badge.
 * @param {string} arStatus - AR lifecycle status (REGISTERED, IN_PROGRESS, ALL_TESTS_COMPLETE, COMPLETED, CANCELLED)
 */
export function formatArStatusBadge(arStatus) {
  if (!arStatus) return 'bg-slate-50 text-slate-600 ring-slate-200'

  const map = {
    registered: 'bg-slate-50 text-slate-600 ring-slate-200',
    in_progress: 'bg-sky-50 text-sky-700 ring-sky-200',
    all_tests_complete: 'bg-violet-50 text-violet-700 ring-violet-200',
    completed: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    cancelled: 'bg-rose-50 text-rose-700 ring-rose-200',
  }

  const key = arStatus.toLowerCase().replace(/\s+/g, '_')
  return map[key] || 'bg-slate-50 text-slate-600 ring-slate-200'
}
