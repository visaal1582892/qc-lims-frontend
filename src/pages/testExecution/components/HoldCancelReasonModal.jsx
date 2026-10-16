/**
 * HoldCancelReasonModal — modal dialog for entering mandatory reason on Hold/Cancel transitions.
 */
import { useState } from 'react'
import { X } from 'lucide-react'

export function HoldCancelReasonModal({ open, title, onSubmit, onClose }) {
  const [reason, setReason] = useState('')
  const [error, setError] = useState('')

  if (!open) return null

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!reason || !reason.trim()) {
      setError('Reason is required.')
      return
    }
    onSubmit(reason.trim())
    setReason('')
    setError('')
  }

  const handleDismiss = () => {
    setReason('')
    setError('')
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-modal flex items-center justify-center p-4 bg-slate-900/45 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) handleDismiss() }}
    >
      <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200/60 overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 className="text-lg font-semibold tracking-tight text-slate-900">{title}</h2>
          <button
            onClick={handleDismiss}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
            aria-label="Close modal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="px-5 py-4">
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Reason <span className="text-rose-500">*</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => { setReason(e.target.value); setError('') }}
              rows={4}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 placeholder-slate-400 shadow-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
              placeholder="Enter reason for hold or cancellation..."
            />
            {error && <p className="mt-1 text-xs text-rose-600">{error}</p>}
          </div>
          <div className="flex items-center justify-end gap-2 border-t border-slate-100 bg-slate-50/60 px-5 py-3.5">
            <button type="button" onClick={handleDismiss}
              className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-300/30 active:scale-[0.98] transition">
              Cancel
            </button>
            <button type="submit"
              className="inline-flex items-center justify-center rounded-lg bg-primary-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500/20 active:scale-[0.98] transition">
              Confirm
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
