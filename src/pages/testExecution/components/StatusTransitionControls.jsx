/**
 * StatusTransitionControls — renders allowed transition buttons based on current execution status.
 *
 * Follows the state transition matrix:
 *   Allocated -> Start Testing, Hold, Cancel
 *   Testing   -> Hold, Submit Result, Cancel
 *   Hold      -> Resume Testing, Cancel
 *   Cancelled_Not_Performed -> (none — terminal)
 *   Under_Review -> Approve/Release, Request Rework
 *   Rework_Requested -> Resume Testing
 *   Released -> (none — terminal)
 *
 * Uses semantic button styles from UI spec Section 6.1.
 */
import { Play, PauseCircle, RotateCcw, Ban, Send, CheckCircle, AlertTriangle } from 'lucide-react'

const transitions = {
  Allocated: [
    { label: 'Start Testing', action: 'start', icon: Play, variant: 'primary' },
    { label: 'Hold', action: 'hold', icon: PauseCircle, variant: 'warning' },
    { label: 'Cancel', action: 'cancel', icon: Ban, variant: 'destructive' },
  ],
  Testing: [
    { label: 'Hold', action: 'hold', icon: PauseCircle, variant: 'warning' },
    { label: 'Submit Result', action: 'submit', icon: Send, variant: 'success' },
    { label: 'Cancel', action: 'cancel', icon: Ban, variant: 'destructive' },
  ],
  Hold: [
    { label: 'Resume', action: 'start', icon: Play, variant: 'primary' },
    { label: 'Cancel', action: 'cancel', icon: Ban, variant: 'destructive' },
  ],
  Under_Review: [
    { label: 'Approve', action: 'approve', icon: CheckCircle, variant: 'success' },
    { label: 'Rework', action: 'rework', icon: AlertTriangle, variant: 'warning' },
  ],
  Rework_Requested: [
    { label: 'Resume Testing', action: 'resume', icon: RotateCcw, variant: 'primary' },
  ],
}

const variantStyles = {
  primary: 'bg-primary-600 hover:bg-primary-700 text-white',
  success: 'bg-emerald-600 hover:bg-emerald-700 text-white',
  warning: 'bg-amber-600 hover:bg-amber-700 text-white',
  destructive: 'border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100',
}

export function StatusTransitionControls({ execution, onAction }) {
  const allowed = transitions[execution?.executionStatus] || []

  if (allowed.length === 0) {
    return (
      <span className="text-xs text-slate-400 italic">
        {execution?.executionStatus === 'Released' ? 'Test released — no further actions' :
         execution?.executionStatus === 'Cancelled_Not_Performed' ? 'Test cancelled — no further actions' :
         'No transitions available'}
      </span>
    )
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {allowed.map((t) => {
        const Icon = t.icon
        return (
          <button
            key={t.action}
            onClick={() => onAction(t.action, execution)}
            className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-semibold shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 active:scale-[0.98] transition ${variantStyles[t.variant]}`}
            title={t.label}
          >
            <Icon className="h-3.5 w-3.5" />
            {t.label}
          </button>
        )
      })}
    </div>
  )
}
