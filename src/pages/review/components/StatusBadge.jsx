/**
 * StatusBadge — Color-coded review status pill.
 *
 * @param {string} status — Review status string (PENDING_QC, PENDING_QA, QC_CLEARED, REWORK_REQUESTED)
 */
export function StatusBadge({ status }) {
  if (!status) return '-'

  const key = status.toLowerCase().replace(/\s+/g, '_')

  const map = {
    pending_qc: { bg: 'bg-violet-50 text-violet-700 ring-violet-200', dot: 'bg-violet-500 animate-pulse' },
    pending_qa: { bg: 'bg-blue-50 text-blue-700 ring-blue-200', dot: 'bg-blue-500 animate-pulse' },
    qc_cleared: { bg: 'bg-emerald-50 text-emerald-700 ring-emerald-200', dot: 'bg-emerald-500' },
    rework_requested: { bg: 'bg-orange-50 text-orange-700 ring-orange-200', dot: 'bg-orange-500' },
  }

  const { bg, dot } = map[key] || { bg: 'bg-slate-50 text-slate-600 ring-slate-200', dot: 'bg-slate-400' }

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ring-1 ${bg}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
      {status.replace(/_/g, ' ')}
    </span>
  )
}
