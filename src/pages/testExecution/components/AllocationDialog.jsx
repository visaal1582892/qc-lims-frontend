/**
 * AllocationDialog — dialog for allocating a test to an analyst.
 * Used from TestAllocationPage.
 * Follows UI spec Section 6.6 modal dialog + 6.5 form input patterns.
 */
import { useState } from 'react'
import { X } from 'lucide-react'

export function AllocationDialog({ open, pendingItems, onSubmit, onClose }) {
  const [form, setForm] = useState({
    arNumber: '',
    parameterId: '',
    allocatedToAnalystId: '',
    assignedByQcHeadId: '',
    allocatedUnits: 1,
  })
  const [error, setError] = useState('')

  if (!open) return null

  const validate = () => {
    if (!form.arNumber) return 'AR Number is required.'
    if (!form.parameterId) return 'Parameter ID is required.'
    if (!form.allocatedToAnalystId) return 'Analyst ID is required.'
    if (!form.assignedByQcHeadId) return 'QC Head ID is required.'
    if (form.allocatedUnits < 1) return 'Allocated units must be at least 1.'
    return ''
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const err = validate()
    if (err) { setError(err); return }
    onSubmit({
      arNumber: form.arNumber,
      parameterId: parseInt(form.parameterId, 10),
      allocatedToAnalystId: parseInt(form.allocatedToAnalystId, 10),
      assignedByQcHeadId: parseInt(form.assignedByQcHeadId, 10),
      allocatedUnits: parseInt(form.allocatedUnits, 10),
    })
    resetForm()
  }

  const resetForm = () => {
    setForm({ arNumber: '', parameterId: '', allocatedToAnalystId: '', assignedByQcHeadId: '', allocatedUnits: 1 })
    setError('')
  }

  const handleDismiss = () => { resetForm(); onClose() }

  const handleArSelect = (ar) => {
    setForm({ ...form, arNumber: ar })
    setError('')
  }

  const inputClass = 'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 placeholder-slate-400 shadow-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100'

  return (
    <div
      className="fixed inset-0 z-modal flex items-center justify-center p-4 bg-slate-900/45 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) handleDismiss() }}
    >
      <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200/60 overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 className="text-lg font-semibold tracking-tight text-slate-900">Allocate Test</h2>
          <button
            onClick={handleDismiss}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
            aria-label="Close modal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-3">
          <div className="space-y-1">
            <label className="block text-xs font-medium text-slate-600">
              AR Number <span className="text-rose-500">*</span>
            </label>
            {pendingItems.length > 0 ? (
              <select
                value={form.arNumber}
                onChange={(e) => handleArSelect(e.target.value)}
                className={inputClass}
              >
                <option value="">Select AR Number...</option>
                {pendingItems.map(item => (
                  <option key={item.arNumber} value={item.arNumber}>{item.arNumber}</option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={form.arNumber}
                onChange={(e) => handleArSelect(e.target.value)}
                className={inputClass}
                placeholder="Enter AR number"
              />
            )}
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-medium text-slate-600">
              Parameter ID <span className="text-rose-500">*</span>
            </label>
            <input type="number" value={form.parameterId} onChange={(e) => setForm({ ...form, parameterId: e.target.value })}
              className={inputClass} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block text-xs font-medium text-slate-600">
                Analyst ID <span className="text-rose-500">*</span>
              </label>
              <input type="number" value={form.allocatedToAnalystId} onChange={(e) => setForm({ ...form, allocatedToAnalystId: e.target.value })}
                className={inputClass} />
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-medium text-slate-600">
                QC Head ID <span className="text-rose-500">*</span>
              </label>
              <input type="number" value={form.assignedByQcHeadId} onChange={(e) => setForm({ ...form, assignedByQcHeadId: e.target.value })}
                className={inputClass} />
            </div>
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-medium text-slate-600">
              Allocated Units <span className="text-rose-500">*</span>
            </label>
            <input type="number" min="1" value={form.allocatedUnits} onChange={(e) => setForm({ ...form, allocatedUnits: e.target.value })}
              className={inputClass} />
            <p className="text-[11px] text-slate-400">Minimum 1 unit required.</p>
          </div>
          {error && <p className="text-xs text-rose-600">{error}</p>}
        </form>
        <div className="flex items-center justify-end gap-2 border-t border-slate-100 bg-slate-50/60 px-5 py-3.5">
          <button type="button" onClick={handleDismiss}
            className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-300/30 active:scale-[0.98] transition">
            Cancel
          </button>
          <button type="button" onClick={handleSubmit}
            className="inline-flex items-center justify-center rounded-lg bg-primary-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500/20 active:scale-[0.98] transition">
            Allocate
          </button>
        </div>
      </div>
    </div>
  )
}
