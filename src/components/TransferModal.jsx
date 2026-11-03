import { useState, useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { assignedTestsApi } from '../api/assignedTests'
import { transferTestThunk } from '../store/slices/assignedTestsSlice'
import { useToast } from './Toast'
import Icon from './Icon'

export default function TransferModal({ isOpen, onClose, onSuccess, item }) {
  const dispatch = useDispatch()
  const toast = useToast()

  const [users, setUsers] = useState([])
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState('')
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (isOpen && item) {
      loadEligibleUsers()
    }
  }, [isOpen, item])

  const loadEligibleUsers = async () => {
    if (!item?.paramId) return
    setLoadingUsers(true)
    try {
      const res = await assignedTestsApi.getEligibleUsers(item.paramId, item.userId)
      setUsers(res.data || [])
    } catch {
      toast.error('Failed to load eligible users')
      setUsers([])
    } finally {
      setLoadingUsers(false)
    }
  }

  const handleSubmit = async () => {
    if (!selectedUserId || !reason.trim()) return

    setSubmitting(true)
    try {
      await dispatch(transferTestThunk({
        detailId: item.detailId,
        targetUserId: selectedUserId,
        reason: reason.trim(),
      })).unwrap()

      toast.success('Test transferred successfully')
      setSelectedUserId('')
      setReason('')
      onSuccess()
    } catch (err) {
      toast.error(err || 'Failed to transfer test')
    } finally {
      setSubmitting(false)
    }
  }

  if (!isOpen || !item) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-[110] w-full max-w-lg rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center gap-3 px-6 pt-6 pb-4 border-b border-slate-100">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
            <Icon name="arrowRightLeft" className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-bold text-slate-900">Transfer Test</h2>
            <p className="text-sm text-slate-500">
              {item.arNumber} — {item.parameterName}
            </p>
          </div>
          <button onClick={onClose} className="h-8 w-8 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition">
            <Icon name="x" className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          <p className="text-sm text-slate-600">
            Transfer this test from <strong>{item.userFullName || item.userId}</strong> to another qualified analyst.
          </p>

          {/* User Selection */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Transfer to <span className="text-rose-500">*</span>
            </label>
            {loadingUsers ? (
              <div className="flex h-10 items-center gap-2 text-sm text-slate-500">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600" />
                Loading eligible analysts...
              </div>
            ) : (
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="w-full h-10 rounded-lg border border-slate-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                required
              >
                <option value="">Select an analyst...</option>
                {users.map((u) => (
                  <option key={u.userId} value={u.userId}>
                    {u.userFullName} ({u.userId})
                  </option>
                ))}
              </select>
            )}
            {!loadingUsers && users.length === 0 && (
              <p className="mt-1 text-xs text-amber-600">No other analysts are qualified for this parameter.</p>
            )}
          </div>

          {/* Reason */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Reason for Transfer <span className="text-rose-500">*</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g., workload rebalancing, analyst unavailable..."
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent resize-none"
              rows={3}
              required
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-6 py-4 border-t border-slate-100 bg-slate-50/50 rounded-b-2xl">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white rounded-lg ring-1 ring-slate-300 hover:bg-slate-50 transition disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || !selectedUserId || !reason.trim()}
            className="px-4 py-2 text-sm font-medium text-white bg-violet-600 rounded-lg hover:bg-violet-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {submitting && (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            )}
            Transfer Test
          </button>
        </div>
      </div>
    </div>
  )
}
