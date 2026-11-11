import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { fetchTestHistoryThunk } from '../store/slices/testExecutionSlice'
import Icon from './Icon'

export default function TestHistoryModal({ isOpen, onClose, detailId }) {
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const { historyData: history, loading } = useSelector((state) => state.testExecution.history)

  useEffect(() => {
    if (isOpen && detailId) {
      dispatch(fetchTestHistoryThunk(detailId))
    }
  }, [isOpen, detailId, dispatch])

  const handleViewAttempt = (attemptDetailId) => {
    onClose()
    navigate(`/assigned-tests/${attemptDetailId}/view`)
  }

  const getStatusBadge = (status) => {
    const map = {
      ASSIGNED: 'bg-blue-50 text-blue-700 ring-blue-600/20',
      TESTING: 'bg-amber-50 text-amber-700 ring-amber-600/20',
      SUBMITTED: 'bg-purple-50 text-purple-700 ring-purple-600/20',
      HOLD: 'bg-orange-50 text-orange-700 ring-orange-600/20',
      CANCELLED: 'bg-slate-50 text-slate-700 ring-slate-600/20',
      OUTSOURCED: 'bg-indigo-50 text-indigo-700 ring-indigo-600/20',
      INVALID: 'bg-rose-50 text-rose-700 ring-rose-600/20',
      APPROVED: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
      REJECTED: 'bg-rose-100 text-rose-800 ring-rose-700/30',
      TRANSFERRED: 'bg-violet-50 text-violet-700 ring-violet-600/20',
    }
    const color = map[status] || 'bg-slate-50 text-slate-700 ring-slate-600/20'
    return (
      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${color}`}>
        {status}
      </span>
    )
  }

  const getOpBadge = (op) => {
    const map = {
      ASSIGN: 'bg-blue-100 text-blue-800',
      START: 'bg-teal-100 text-teal-800',
      SUBMIT: 'bg-purple-100 text-purple-800',
      HOLD: 'bg-orange-100 text-orange-800',
      UNHOLD: 'bg-teal-100 text-teal-800',
      OUTSOURCE: 'bg-indigo-100 text-indigo-800',
      CANCEL: 'bg-slate-200 text-slate-800',
      APPROVE: 'bg-emerald-100 text-emerald-800',
      REJECT: 'bg-rose-100 text-rose-800',
      REWORK: 'bg-amber-100 text-amber-800',
      RETEST: 'bg-rose-100 text-rose-800',
      TRANSFER: 'bg-violet-100 text-violet-800',
    }
    const color = map[op] || 'bg-slate-100 text-slate-800'
    return (
      <span className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-bold ${color}`}>
        {op}
      </span>
    )
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="flex max-h-[85vh] w-full max-w-3xl flex-col rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-blue-600 ring-1 ring-blue-200/80">
              <Icon name="clock" className="h-4 w-4" />
            </span>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Test Execution History {history?.parameterName ? `— ${history.parameterName}` : ''}
              </h3>
              <p className="text-xs text-slate-500">
                Testing attempts and operational lifecycle events
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
          >
            <Icon name="x" className="h-5 w-5" />
          </button>
        </div>

        {/* Content body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading ? (
            <div className="flex h-40 items-center justify-center gap-2 text-slate-500">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600" />
              <span className="text-sm">Loading test history...</span>
            </div>
          ) : !history?.attempts || history.attempts.length === 0 ? (
            <div className="flex h-40 flex-col items-center justify-center gap-2 text-slate-400">
              <Icon name="inbox" className="h-8 w-8 text-slate-300" />
              <span className="text-xs">No prior attempts found for this test</span>
            </div>
          ) : (
            history.attempts.map((attempt) => {
              const isUnsubmitted = attempt.status === 'ASSIGNED' || attempt.status === 'TESTING' || (detailId && attempt.detailId === Number(detailId) && !['SUBMITTED', 'APPROVED', 'REJECTED', 'HOLD', 'CANCELLED', 'OUTSOURCED', 'INVALID', 'TRANSFERRED'].includes(attempt.status))

              return (
                <div
                  key={attempt.detailId}
                  className="rounded-xl border border-slate-200/80 bg-white shadow-sm overflow-hidden"
                >
                  {/* Attempt Header */}
                  <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50/70 px-4 py-3 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                      {isUnsubmitted ? (
                        <span
                          className="inline-flex items-center rounded-md bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600 ring-1 ring-slate-200 cursor-default"
                          title="Current unsubmitted attempt"
                        >
                          Attempt {attempt.attemptNumber} (Current)
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleViewAttempt(attempt.detailId)}
                          className="inline-flex items-center rounded-md bg-brand-600 px-2.5 py-1 text-xs font-bold text-white shadow-xs hover:bg-brand-700 active:scale-95 transition-all cursor-pointer"
                          title="Click to view this attempt"
                        >
                          Attempt {attempt.attemptNumber}
                        </button>
                      )}
                      {getStatusBadge(attempt.status)}
                      {attempt.incidentId && (
                        <span className="inline-flex items-center gap-1 rounded bg-rose-50 px-2 py-0.5 text-[11px] font-semibold text-rose-700 ring-1 ring-rose-200">
                          <Icon name="alertTriangle" className="h-3 w-3" />
                          Incident #{attempt.incidentId}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <span>
                        Analyst: <strong className="text-slate-700">{attempt.userFullName || attempt.userId}</strong>
                      </span>
                      {attempt.createdAt && (
                        <span>{new Date(attempt.createdAt).toLocaleString()}</span>
                      )}
                    </div>
                  </div>

                <div className="p-4 space-y-4">
                  {/* Submitted Metric Values if any */}
                  {attempt.metricValues && attempt.metricValues.length > 0 && (
                    <div>
                      <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                        Submitted Metric Results
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                        {attempt.metricValues.map((mv, idx) => (
                          <div
                            key={idx}
                            className={`rounded-lg p-2.5 border text-xs ${
                              mv.isOutOfBound
                                ? 'bg-rose-50/80 border-rose-200 text-rose-900'
                                : 'bg-slate-50 border-slate-200/80 text-slate-800'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-semibold">{mv.metricName}</span>
                              {mv.isOutOfBound && (
                                <span className="text-[10px] font-bold text-rose-600 uppercase tracking-wider">
                                  Out of Spec
                                </span>
                              )}
                            </div>
                            <div className="mt-1 flex items-baseline gap-1 text-sm font-bold">
                              <span>{mv.metricValue}</span>
                              {mv.unit && <span className="text-xs font-normal text-slate-500">{mv.unit}</span>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Operation Logs Timeline */}
                  {attempt.logs && attempt.logs.length > 0 && (
                    <div>
                      <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                        Lifecycle Operations
                      </h4>
                      <div className="space-y-1.5">
                        {attempt.logs.map((logItem, lIdx) => (
                          <div
                            key={lIdx}
                            className="flex items-start justify-between gap-3 rounded-lg bg-slate-50/50 p-2 text-xs border border-slate-100"
                          >
                            <div className="flex items-center gap-2">
                              {getOpBadge(logItem.operationType)}
                              <span className="text-slate-700 font-medium">
                                {logItem.remarks || <span className="italic text-slate-400">No remarks</span>}
                              </span>
                            </div>
                            <div className="flex items-center gap-3 text-[11px] text-slate-400 shrink-0">
                              <span>By: {logItem.doneBy}</span>
                              <span>{new Date(logItem.doneAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              )
            })
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-100 px-6 py-3 flex justify-end bg-slate-50/50 rounded-b-2xl">
          <button
            onClick={onClose}
            className="rounded-lg border border-slate-200 bg-white px-4 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
