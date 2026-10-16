import { CheckCircle, RotateCcw, User } from 'lucide-react'
import { formatDateTime } from '../../../utils/formatters'

/**
 * ReviewTimeline — Audit trail visualization for review history.
 *
 * Displays chronological review decisions as a vertical timeline.
 *
 * @param {Array} entries — Audit log entries: { logId, reviewStage, reviewerId, decision, reason, executedAt }
 */
export function ReviewTimeline({ entries = [] }) {
  if (!entries || entries.length === 0) {
    return (
      <div className="text-center py-8 text-slate-400">
        <p className="text-sm">No review history yet</p>
      </div>
    )
  }

  return (
    <div className="relative space-y-0">
      {entries.map((entry, idx) => {
        const isApprove = entry.decision === 'APPROVE'
        const isLast = idx === entries.length - 1

        return (
          <div key={entry.logId ?? idx} className="flex gap-3">
            {/* Timeline line */}
            <div className="flex flex-col items-center">
              <div className={`flex items-center justify-center h-8 w-8 rounded-full shrink-0 ring-2 ${
                isApprove
                  ? 'bg-emerald-100 ring-emerald-200 text-emerald-600'
                  : 'bg-orange-100 ring-orange-200 text-orange-600'
              }`}>
                {isApprove
                  ? <CheckCircle className="h-4 w-4" />
                  : <RotateCcw className="h-4 w-4" />
                }
              </div>
              {!isLast && (
                <div className="w-px flex-1 bg-slate-200 min-h-[1rem]" />
              )}
            </div>

            {/* Content */}
            <div className={`flex-1 pb-4 ${isLast ? '' : ''}`}>
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ring-1 ${
                  isApprove
                    ? 'bg-emerald-50 text-emerald-700 ring-emerald-200'
                    : 'bg-orange-50 text-orange-700 ring-orange-200'
                }`}>
                  {entry.decision}
                </span>
                <span className="text-xs font-medium text-slate-500">
                  {entry.reviewStage === 'QC_HEAD' ? 'QC Head' : 'QA Head'}
                </span>
              </div>
              <div className="flex items-center gap-1 mt-0.5 text-xs text-slate-400">
                <User className="h-3 w-3" />
                <span>Reviewer #{entry.reviewerId}</span>
                <span className="mx-1">•</span>
                <span>{formatDateTime(entry.executedAt)}</span>
              </div>
              {entry.reason && (
                <p className="mt-1.5 text-sm text-slate-600 bg-slate-50 rounded-lg px-3 py-2 border border-slate-100">
                  {entry.reason}
                </p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
