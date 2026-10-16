import { useState } from 'react'
import { CheckCircle, RotateCcw, X } from 'lucide-react'
import { Modal } from '../../components/feedback/Modal'

/**
 * ReviewDecisionModal — Approve/Rework decision dialog.
 *
 * @param {boolean} open — Modal open state
 * @param {function} onClose — Called when modal closes without decision
 * @param {function} onDecision — Called with { decision, reason }
 * @param {string} title — Modal title (e.g., "QC Head Review")
 * @param {string} executionId — Display execution ID
 * @param {string} arNumber — Display AR number
 */
export function ReviewDecisionModal({ open, onClose, onDecision, title, executionId, arNumber }) {
  const [decision, setDecision] = useState(null)
  const [reason, setReason] = useState('')
  const [error, setError] = useState('')

  const handleConfirm = () => {
    if (!decision) {
      setError('Please select Approve or Rework.')
      return
    }
    if (decision === 'REWORK' && (!reason || reason.trim().isEmpty())) {
      setError('Rework reason is mandatory.')
      return
    }
    setError('')
    onDecision({ decision, reason: decision === 'APPROVE' ? null : reason.trim() })
    setDecision(null)
    setReason('')
  }

  const handleReset = () => {
    setDecision(null)
    setReason('')
    setError('')
    onClose()
  }

  return (
    <Modal open={open} onClose={handleReset} title={title} size="md">
      <div className="space-y-4">
        <div className="rounded-lg bg-slate-50 p-3 text-sm">
          <div className="flex gap-4">
            <div>
              <span className="text-slate-500">Execution ID:</span>
              <span className="ml-2 font-mono font-semibold text-slate-900">#{executionId}</span>
            </div>
            <div>
              <span className="text-slate-500">AR Number:</span>
              <span className="ml-2 font-mono font-semibold text-slate-900">{arNumber}</span>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Decision</label>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => { setDecision('APPROVE'); setError('') }}
              className={`flex-1 flex items-center justify-center gap-2 rounded-xl border-2 px-4 py-3 text-sm font-semibold transition-all ${
                decision === 'APPROVE'
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm'
                  : 'border-slate-200 text-slate-600 hover:border-emerald-300 hover:bg-emerald-50/50'
              }`}
            >
              <CheckCircle className="h-4 w-4" />
              Approve
            </button>
            <button
              type="button"
              onClick={() => { setDecision('REWORK'); setError('') }}
              className={`flex-1 flex items-center justify-center gap-2 rounded-xl border-2 px-4 py-3 text-sm font-semibold transition-all ${
                decision === 'REWORK'
                  ? 'border-orange-500 bg-orange-50 text-orange-700 shadow-sm'
                  : 'border-slate-200 text-slate-600 hover:border-orange-300 hover:bg-orange-50/50'
              }`}
            >
              <RotateCcw className="h-4 w-4" />
              Request Rework
            </button>
          </div>
        </div>

        {decision === 'REWORK' && (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Rework Reason <span className="text-rose-500">*</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => { setReason(e.target.value); setError('') }}
              placeholder="Explain why rework is needed..."
              rows={3}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 resize-none"
            />
          </div>
        )}

        {error && (
          <p className="text-sm text-rose-600 bg-rose-50 rounded-lg px-3 py-2">{error}</p>
        )}
      </div>

      <div className="flex justify-end gap-2 mt-4">
        <button
          type="button"
          onClick={handleReset}
          className="flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 transition"
        >
          <X className="h-4 w-4" />
          Cancel
        </button>
        <button
          type="button"
          onClick={handleConfirm}
          disabled={!decision}
          className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold text-white transition ${
            decision === 'APPROVE'
              ? 'bg-emerald-600 hover:bg-emerald-700'
              : decision === 'REWORK'
                ? 'bg-orange-600 hover:bg-orange-700'
                : 'bg-slate-300 cursor-not-allowed'
          }`}
        >
          {decision === 'APPROVE' ? 'Confirm Approval' : 'Request Rework'}
        </button>
      </div>
    </Modal>
  )
}
