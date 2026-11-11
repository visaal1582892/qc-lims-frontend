import Icon from './Icon'
import { normalizeTrfStatus } from '../utils/trfStatus'

export default function TrfStatusBadge({ status, showEmptyDash = false }) {
  if (showEmptyDash && (!status || !String(status).trim())) {
    return <span className="text-slate-400 text-xs">-</span>
  }

  const s = normalizeTrfStatus(status)
  if (s === 'APPROVED') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 ring-1 ring-emerald-200">
        <Icon name="check" className="h-3 w-3 text-emerald-600" />
        APPROVED
      </span>
    )
  }
  if (s === 'PENDING_APPROVAL') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-700 ring-1 ring-indigo-200">
        <Icon name="clock" className="h-3 w-3 text-indigo-600" />
        PENDING APPROVAL
      </span>
    )
  }
  if (s === 'NEEDS_REVISION') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-800 ring-1 ring-amber-200">
        <Icon name="alertTriangle" className="h-3 w-3 text-amber-600" />
        NEEDS REVISION
      </span>
    )
  }
  return (
    <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600 ring-1 ring-slate-200">
      PENDING DETAILS
    </span>
  )
}

