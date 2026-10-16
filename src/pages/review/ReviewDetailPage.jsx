import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { testExecutionApi } from '../../api/testExecutionApi'
import { reviewWorkflowApi } from '../../api/reviewWorkflowApi'
import { ReviewDecisionModal } from './components/ReviewDecisionModal'
import { ReviewTimeline } from './components/ReviewTimeline'
import { StatusBadge } from './components/StatusBadge'
import { ExecutionStatusBadge } from '../testExecution/components/ExecutionStatusBadge'
import { ComplianceBadge } from '../testExecution/components/ComplianceBadge'
import { formatDateTime, formatDecimal } from '../../utils/formatters'
import { ToastContainer } from '../../components/feedback/Toast'
import { ShieldCheck, ArrowLeft } from 'lucide-react'

/**
 * ReviewDetailPage — Execution detail with review history and decision capability.
 */
export function ReviewDetailPage() {
  const { executionId } = useParams()
  const navigate = useNavigate()
  const [execution, setExecution] = useState(null)
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [toasts, setToasts] = useState([])

  const addToast = useCallback((message, type = 'info') => {
    const id = Date.now()
    setToasts((prev) => [...prev, { id, message, type }])
  }, [])

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const loadDetail = useCallback(async () => {
    try {
      setLoading(true)
      const [execRes, historyRes] = await Promise.all([
        testExecutionApi.getExecutionById(executionId),
        reviewWorkflowApi.getReviewHistory(executionId),
      ])
      setExecution(execRes.data.data)
      setHistory(historyRes.data.data || [])
    } catch {
      addToast('Failed to load review details', 'error')
    } finally {
      setLoading(false)
    }
  }, [executionId, addToast])

  const loadedRef = useRef(false)

  useEffect(() => {
    if (!loadedRef.current) {
      loadedRef.current = true
      loadDetail()
    }
  }, [loadDetail])

  const handleDecision = async ({ decision, reason }) => {
    try {
      const api = execution.reviewStatus === 'PENDING_QC'
        ? reviewWorkflowApi.qcHeadReview
        : reviewWorkflowApi.qaHeadReview
      await api(executionId, { decision, reason })
      addToast(
        decision === 'APPROVE'
          ? `Approved execution #${executionId}`
          : `Rework requested`,
        decision === 'APPROVE' ? 'success' : 'info',
      )
      setModalOpen(false)
      loadDetail()
    } catch (err) {
      addToast(err.response?.data?.message || 'Review failed', 'error')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-600 border-t-transparent mx-auto" />
          <p className="mt-3 text-sm text-slate-500">Loading review details...</p>
        </div>
      </div>
    )
  }

  if (!execution) {
    return (
      <div className="text-center py-16">
        <p className="text-slate-500">Execution not found</p>
        <button
          onClick={() => navigate('/review/qc-head')}
          className="mt-4 text-sm text-primary-600 hover:underline"
        >
          ← Back to QC Review Queue
        </button>
      </div>
    )
  }

  const canReview = execution.reviewStatus === 'PENDING_QC' || execution.reviewStatus === 'PENDING_QA'
  const reviewTitle = execution.reviewStatus === 'PENDING_QC' ? 'QC Head Review' : 'QA Head Review'

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="rounded-lg border border-slate-200 p-1.5 text-slate-500 hover:bg-slate-50 transition"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              Review Detail — #{execution.executionId}
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              AR Number: <span className="font-mono">{execution.arNumber}</span>
            </p>
          </div>
        </div>
        {canReview && (
          <button
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700 transition"
          >
            <ShieldCheck className="h-4 w-4" />
            Make Decision
          </button>
        )}
      </div>

      {/* Execution details */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-800 mb-3">Execution Details</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <div>
            <span className="text-slate-500">Parameter</span>
            <p className="font-medium text-slate-900">{execution.parameterName || '-'}</p>
          </div>
          <div>
            <span className="text-slate-500">Status</span>
            <div className="mt-0.5"><ExecutionStatusBadge status={execution.executionStatus} /></div>
          </div>
          <div>
            <span className="text-slate-500">Review Status</span>
            <div className="mt-0.5"><StatusBadge status={execution.reviewStatus} /></div>
          </div>
          <div>
            <span className="text-slate-500">Result</span>
            <p className="font-medium font-mono text-slate-900">
              {formatDecimal(execution.resultNumericValue)}
            </p>
          </div>
          <div>
            <span className="text-slate-500">Compliance</span>
            <div className="mt-0.5"><ComplianceBadge flag={execution.complianceFlag} /></div>
          </div>
          <div>
            <span className="text-slate-500">Analyst</span>
            <p className="font-medium text-slate-900">#{execution.allocatedToAnalystId}</p>
          </div>
          <div>
            <span className="text-slate-500">Submitted</span>
            <p className="font-medium text-slate-900">{formatDateTime(execution.submittedAt)}</p>
          </div>
          <div>
            <span className="text-slate-500">QC Reviewed</span>
            <p className="font-medium text-slate-900">{formatDateTime(execution.qcHeadReviewedAt)}</p>
          </div>
        </div>
        {execution.reworkReason && (
          <div className="mt-3 rounded-lg bg-orange-50 border border-orange-200 p-3">
            <span className="text-xs font-semibold text-orange-700 uppercase tracking-wide">Rework Reason</span>
            <p className="mt-1 text-sm text-orange-800">{execution.reworkReason}</p>
          </div>
        )}
      </div>

      {/* Review History */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-800 mb-4">Review History</h2>
        <ReviewTimeline entries={history} />
      </div>

      {canReview && (
        <ReviewDecisionModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          onDecision={handleDecision}
          title={reviewTitle}
          executionId={execution.executionId}
          arNumber={execution.arNumber}
        />
      )}

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  )
}
