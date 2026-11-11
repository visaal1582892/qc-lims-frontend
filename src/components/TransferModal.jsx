import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  fetchEligibleUsersThunk,
  transferTestThunk,
  setSelectedUserId,
  setTransferReason,
  resetTransferModal,
} from '../store/slices/testExecutionSlice'
import { fetchAssignedTests } from '../store/slices/assignedTestsSlice'
import { useToast } from './Toast'
import Icon from './Icon'
import CustomSelect from './CustomSelect'

export default function TransferModal({ isOpen, onClose, onSuccess, item }) {
  const dispatch = useDispatch()
  const toast = useToast()

  const {
    eligibleUsers,
    loadingUsers,
    selectedUserId,
    reason,
    submitting,
  } = useSelector((state) => state.testExecution.transfer)

  useEffect(() => {
    if (isOpen && item?.paramId) {
      dispatch(fetchEligibleUsersThunk({ paramId: item.paramId, excludeUserId: item.userId }))
    } else if (!isOpen) {
      dispatch(resetTransferModal())
    }
  }, [isOpen, item, dispatch])

  const handleSubmit = async () => {
    if (!selectedUserId || !(reason?.trim()) || !item?.detailId) return

    try {
      await dispatch(
        transferTestThunk({
          detailId: item.detailId,
          targetUserId: selectedUserId,
          reason: reason.trim(),
        })
      ).unwrap()

      toast.success('Test transferred successfully')
      dispatch(fetchAssignedTests())
      if (onSuccess) onSuccess()
    } catch (err) {
      toast.error(err || 'Failed to transfer test')
    }
  }

  if (!isOpen || !item) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl ring-1 ring-slate-900/10">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-100 text-violet-700">
              <Icon name="arrowRightLeft" className="h-4 w-4" />
            </span>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Transfer Test</h3>
              <p className="text-[11px] text-slate-500">
                {item.arNumber || 'AR Pending'} — {item.parameterName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={submitting}
            className="text-slate-400 hover:text-slate-600 rounded-lg p-1"
          >
            <Icon name="x" className="h-4 w-4" />
          </button>
        </div>

        {/* Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault()
            handleSubmit()
          }}
          className="mt-4 space-y-4"
        >
          {/* Informational Box */}
          <div className="rounded-lg bg-slate-50 p-3 text-xs text-slate-700 border border-slate-200/60">
            Transfer this test from <span className="font-semibold text-slate-900">{item.userFullName || item.userId}</span> to another qualified analyst.
          </div>

          {/* User Selection */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
              Transfer to <span className="text-rose-500">*</span>
            </label>
            {loadingUsers ? (
              <div className="flex h-9 items-center gap-2 text-xs text-slate-500">
                <Icon name="refreshCw" className="h-3.5 w-3.5 animate-spin" />
                Loading eligible analysts...
              </div>
            ) : (
              <CustomSelect
                value={selectedUserId || ''}
                onChange={(val) => dispatch(setSelectedUserId(val))}
                placeholder="Select an analyst..."
                options={eligibleUsers.map((u) => ({
                  value: u.userId,
                  label: u.userFullName,
                  subLabel: u.userId,
                }))}
                required
              />
            )}
            {!loadingUsers && eligibleUsers.length === 0 && (
              <p className="mt-1 text-[11px] text-amber-600">No other analysts are qualified for this parameter.</p>
            )}
          </div>

          {/* Reason (Null-Safe Guardrail 1) */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
              Reason for Transfer <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              value={reason || ''}
              onChange={(e) => dispatch(setTransferReason(e.target.value))}
              placeholder="e.g., workload rebalancing, analyst unavailable..."
              maxLength={500}
              required
              className="w-full rounded-lg border border-slate-300 p-2.5 text-xs text-slate-900 shadow-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 resize-none"
            />
            <span className="block text-right text-[10px] text-slate-400 mt-0.5">
              {reason?.length || 0}/500
            </span>
          </div>

          {/* Footer Buttons */}
          <div className="mt-6 flex justify-end gap-2 border-t border-slate-100 pt-3">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !selectedUserId || !(reason?.trim())}
              className="inline-flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-xs font-semibold shadow-sm transition bg-violet-600 hover:bg-violet-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting && <Icon name="refreshCw" className="h-3.5 w-3.5 animate-spin" />}
              Transfer Test
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
