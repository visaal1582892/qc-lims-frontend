/**
 * ExecutionStatusBadge — status pill component for test execution status.
 * Renders Tinted Badge pattern per UI spec Section 6.4.
 */

export function ExecutionStatusBadge({ status }) {
  if (!status) return '-'

  const key = status.toLowerCase().replace(/\s+/g, '_')

  const bgMap = {
    allocated: 'bg-sky-50 text-sky-700 ring-sky-200',
    testing: 'bg-sky-50 text-sky-700 ring-sky-200',
    hold: 'bg-orange-50 text-orange-700 ring-orange-200',
    cancelled_not_performed: 'bg-rose-50 text-rose-700 ring-rose-200',
    under_review: 'bg-violet-50 text-violet-700 ring-violet-200',
    rework_requested: 'bg-orange-50 text-orange-700 ring-orange-200',
    released: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  }

  const dotMap = {
    testing: 'bg-sky-500 animate-pulse',
    hold: 'bg-orange-500',
    cancelled_not_performed: 'bg-rose-500',
    under_review: 'bg-violet-500',
    rework_requested: 'bg-orange-500',
    released: 'bg-emerald-500',
    allocated: 'bg-sky-500',
  }

  const classes = bgMap[key] || 'bg-slate-50 text-slate-600 ring-slate-200'
  const dotClass = dotMap[key] || 'bg-slate-400'

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ring-1 ${classes}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${dotClass}`} />
      {status}
    </span>
  )
}
