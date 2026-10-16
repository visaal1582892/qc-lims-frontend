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
