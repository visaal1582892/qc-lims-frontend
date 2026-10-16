/**
 * ReassignmentDialog — dialog for reassigning a test to a different analyst.
 * Follows UI spec Section 6.6 modal dialog pattern.
 */
import { useState } from 'react'
import { X } from 'lucide-react'

export function ReassignmentDialog({ open, execution, onSubmit, onClose }) {
  const [newAnalystId, setNewAnalystId] = useState('')
  const [reason, setReason] = useState('')
  const [error, setError] = useState('')

  if (!open) return null

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!newAnalystId) { setError('New analyst ID is required.'); return }
    if (!reason || !reason.trim()) { setError('Reason is required.'); return }
    onSubmit({
      newAnalystId: parseInt(newAnalystId, 10),
      reason: reason.trim(),
    })
    setNewAnalystId('')
    setReason('')
    setError('')
  }

  const handleDismiss = () => {
    setNewAnalystId('')
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
          <h2 className="text-lg font-semibold tracking-tight text-slate-900">Reassign Test</h2>
          <button
            onClick={handleDismiss}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
            aria-label="Close modal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="px-5 py-4">
          <p className="text-sm text-slate-500 mb-3">
            Current analyst: <strong>ID {execution?.allocatedToAnalystId}</strong> | AR: {execution?.arNumber}
          </p>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="space-y-1">
              <label className="block text-xs font-medium text-slate-600">
                New Analyst ID <span className="text-rose-500">*</span>
              </label>
              <input type="number" value={newAnalystId} onChange={(e) => setNewAnalystId(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 placeholder-slate-400 shadow-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100" />
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-medium text-slate-600">
                Reason <span className="text-rose-500">*</span>
              </label>
              <textarea value={reason} onChange={(e) => { setReason(e.target.value); setError('') }}
                rows={3}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 placeholder-slate-400 shadow-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
                placeholder="Enter reassignment reason..." />
            </div>
            {error && <p className="text-xs text-rose-600">{error}</p>}
          </form>
        </div>
        <div className="flex items-center justify-end gap-2 border-t border-slate-100 bg-slate-50/60 px-5 py-3.5">
          <button type="button" onClick={handleDismiss}
            className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-300/30 active:scale-[0.98] transition">
            Cancel
          </button>
          <button type="button" onClick={handleSubmit}
            className="inline-flex items-center justify-center rounded-lg bg-primary-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500/20 active:scale-[0.98] transition">
            Reassign
          </button>
        </div>
      </div>
    </div>
  )
}
