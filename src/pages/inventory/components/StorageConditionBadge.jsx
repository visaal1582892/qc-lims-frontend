/**
 * Storage condition badge component.
 * Follows Tinted Badge pattern (UI spec).
 * Renders color-coded badge with temperature range tooltip.
 */
import { getTemperatureRange } from '../../../utils/formatters'
import { Thermometer } from 'lucide-react'

export function StorageConditionBadge({ location }) {
  if (!location) {
    return <span className="text-slate-400 text-xs">—</span>
  }

  const colors = {
    ambient: 'bg-amber-50 text-amber-700 ring-amber-200',
    refrigerator: 'bg-sky-50 text-sky-700 ring-sky-200',
    freezer: 'bg-indigo-50 text-indigo-700 ring-indigo-200',
    others: 'bg-slate-50 text-slate-600 ring-slate-200',
  }

  const key = location.toLowerCase().replace(/\s+/g, '_')
  const classes = colors[key] || 'bg-slate-50 text-slate-600 ring-slate-200'
  const temp = getTemperatureRange(location)

  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-medium ring-1 ring-inset ${classes}`}>
      <Thermometer className="h-3 w-3" />
      {location}
      {temp && <span className="text-[10px] opacity-70">({temp})</span>}
    </span>
  )
}
