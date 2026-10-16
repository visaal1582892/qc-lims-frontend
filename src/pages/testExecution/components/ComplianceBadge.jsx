/**
 * ComplianceBadge — color-coded badge showing PASS/FAIL/PENDING status.
 * Uses Tinted Badge pattern from UI guidelines.
 */
import { CheckCircle, XCircle, Clock } from 'lucide-react'

const badgeStyles = {
  PASS: {
    classes: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    icon: CheckCircle,
  },
  FAIL: {
    classes: 'bg-rose-50 text-rose-700 ring-rose-200',
    icon: XCircle,
  },
  PENDING: {
    classes: 'bg-amber-50 text-amber-700 ring-amber-200',
    icon: Clock,
  },
}

export function ComplianceBadge({ flag }) {
  if (!flag) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full ring-1 bg-slate-50 text-slate-400 ring-slate-200">
        <Clock className="w-3 h-3" />
        PENDING
      </span>
    )
  }

  const config = badgeStyles[flag] || badgeStyles.PENDING
  const Icon = config.icon

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full ring-1 ${config.classes}`}>
      <Icon className="w-3 h-3" />
      {flag}
    </span>
  )
}
