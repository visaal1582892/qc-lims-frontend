import { useState, useEffect } from 'react'
import Icon from './Icon'

export default function ActionReasonModal({
  isOpen,
  onClose,
  onSubmit,
  title,
  subtitle,
  description,
  placeholder = 'Enter reason or notes...',
  confirmText = 'Confirm',
  confirmColor = 'brand',
  icon = 'edit',
  loading = false,
  required = true,
  maxLength = 500,
  showUnitsUsed = false,
  initialUnitsUsed = 1,
}) {
  const [reason, setReason] = useState('')
  const [unitsUsed, setUnitsUsed] = useState(initialUnitsUsed || 1)

  useEffect(() => {
    if (isOpen) {
      setReason('')
      setUnitsUsed(initialUnitsUsed || 1)
    }
  }, [isOpen, initialUnitsUsed])

  if (!isOpen) return null

  const handleSubmit = (e) => {
    e.preventDefault()
    if (required && !(reason?.trim())) return
    if (showUnitsUsed && (!unitsUsed || Number(unitsUsed) <= 0)) return
    if (showUnitsUsed) {
      onSubmit({ notes: reason?.trim() || '', testsUsed: Number(unitsUsed) })
    } else {
      onSubmit(reason?.trim() || '')
    }
  }

  const colorStyles = {
    brand: 'bg-brand-600 hover:bg-brand-700 text-white',
    amber: 'bg-amber-600 hover:bg-amber-700 text-white',
    rose: 'bg-rose-600 hover:bg-rose-700 text-white',
    teal: 'bg-teal-600 hover:bg-teal-700 text-white',
    violet: 'bg-violet-600 hover:bg-violet-700 text-white',
    indigo: 'bg-indigo-600 hover:bg-indigo-700 text-white',
  }

  const iconBgStyles = {
    brand: 'bg-brand-100 text-brand-700',
    amber: 'bg-amber-100 text-amber-700',
    rose: 'bg-rose-100 text-rose-700',
    teal: 'bg-teal-100 text-teal-700',
    violet: 'bg-violet-100 text-violet-700',
    indigo: 'bg-indigo-100 text-indigo-700',
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl ring-1 ring-slate-900/10">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <span className={`flex h-7 w-7 items-center justify-center rounded-lg ${iconBgStyles[confirmColor] || iconBgStyles.brand}`}>
              <Icon name={icon} className="h-4 w-4" />
            </span>
            <div>
              <h3 className="text-sm font-bold text-slate-900">{title}</h3>
              {subtitle && <p className="text-[11px] text-slate-500">{subtitle}</p>}
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="text-slate-400 hover:text-slate-600 rounded-lg p-1"
          >
            <Icon name="x" className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {description && (
            <div className="rounded-lg bg-slate-50 p-3 text-xs text-slate-700 border border-slate-200/60">
              {description}
            </div>
          )}

          {showUnitsUsed && (
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Units / Samples Consumed for this Test <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                step="1"
                required
                value={unitsUsed}
                onChange={(e) => setUnitsUsed(e.target.value)}
                placeholder="Number of units used..."
                className="w-full rounded-lg border border-slate-300 p-2.5 text-xs text-slate-900 shadow-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
              />
              <span className="block text-[10.5px] text-slate-500 mt-0.5">
                Physical sample units deducted from QC testing inventory ledger.
              </span>
            </div>
          )}

          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
              Remarks / Notes {required && <span className="text-rose-500">*</span>}
            </label>
            <textarea
              rows={3}
              value={reason || ''}
              onChange={(e) => setReason(e.target.value)}
              placeholder={placeholder}
              maxLength={maxLength}
              required={required}
              className="w-full rounded-lg border border-slate-300 p-2.5 text-xs text-slate-900 shadow-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
            />
            <span className="block text-right text-[10px] text-slate-400 mt-0.5">
              {reason?.length || 0}/{maxLength}
            </span>
          </div>

          <div className="mt-6 flex justify-end gap-2 border-t border-slate-100 pt-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || (required && !(reason?.trim()))}
              className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-xs font-semibold shadow-sm transition disabled:opacity-50 ${colorStyles[confirmColor] || colorStyles.brand}`}
            >
              {loading && <Icon name="refreshCw" className="h-3.5 w-3.5 animate-spin" />}
              {confirmText}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
