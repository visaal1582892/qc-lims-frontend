/**
 * Variance alert component — inline alert for rows with unconsumed variance.
 * Amber for small variance, rose for large variance.
 */
import { AlertTriangle, CheckCircle } from 'lucide-react'

export function VarianceAlert({ allocated, consumed }) {
  const variance = (allocated || 0) - (consumed || 0)

  if (variance <= 0) {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600">
        <CheckCircle className="h-3 w-3" />
        Fully consumed
      </span>
    )
  }

  const isLarge = variance > 5

  return (
    <span className={`inline-flex items-center gap-1 text-[11px] ${isLarge ? 'text-rose-600' : 'text-amber-600'}`}>
      <AlertTriangle className="h-3 w-3" />
      {variance} unit{variance > 1 ? 's' : ''} unconsumed
    </span>
  )
}
