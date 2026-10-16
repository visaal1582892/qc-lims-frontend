import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { reviewWorkflowApi } from '../../api/reviewWorkflowApi'
import { DataTable } from '../../components/table/DataTable'
import { ReviewDecisionModal } from './components/ReviewDecisionModal'
import { StatusBadge } from './components/StatusBadge'
import { ExecutionStatusBadge } from '../testExecution/components/ExecutionStatusBadge'
import { ComplianceBadge } from '../testExecution/components/ComplianceBadge'
import { formatDateTime, formatDecimal } from '../../utils/formatters'
import { ToastContainer, Toast } from '../../components/feedback/Toast'
import { ShieldCheck, AlertTriangle } from 'lucide-react'

/**
 * QC Review Queue Page — QC Head's pending reviews.
 */
export function QcReviewQueuePage() {
  const navigate = useNavigate()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState(null)
  const [toasts, setToasts] = useState([])

  const addToast = useCallback((message, type = 'info') => {
    const id = Date.now()
    setToasts((prev) => [...prev, { id, message, type }])
  }, [])

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const loadQueue = useCallback(async () => {
    try {
      setLoading(true)
      const res = await reviewWorkflowApi.getQcReviewQueue()
      setItems(res.data.data || [])
    } catch (err) {
      addToast('Failed to load QC review queue', 'error')
    } finally {
      setLoading(false)
    }
  }, [addToast])

  useEffect(() => { loadQueue() }, [loadQueue])

  const handleOpenReview = (item) => {
    setSelectedItem(item)
    setModalOpen(true)
  }

  const handleDecision = async ({ decision, reason }) => {
    try {
      await reviewWorkflowApi.qcHeadReview(selectedItem.executionId, {
        decision,
        reason,
      })
      addToast(
        decision === 'APPROVE'
          ? `Approved execution #${selectedItem.executionId}`
          : `Rework requested for execution #${selectedItem.executionId}`,
        decision === 'APPROVE' ? 'success' : 'info',
      )
      setModalOpen(false)
      setSelectedItem(null)
      loadQueue()
    } catch (err) {
      addToast(err.response?.data?.message || 'Review failed', 'error')
    }
  }

  const columns = [
    { key: 'executionId', label: 'Exec ID', width: 80 },
    { key: 'arNumber', label: 'AR Number', width: 120 },
    { key: 'parameterName', label: 'Parameter', width: 140 },
    {
      key: 'executionStatus',
      label: 'Status',
      width: 120,
      render: (val) => <ExecutionStatusBadge status={val} />,
    },
    {
      key: 'reviewStatus',
      label: 'Review',
      width: 110,
      render: (val) => <StatusBadge status={val} />,
    },
    {
      key: 'resultNumericValue',
      label: 'Result',
      width: 90,
      render: (val) => formatDecimal(val),
    },
    {
      key: 'complianceFlag',
      label: 'Compliance',
      width: 100,
      render: (val) => <ComplianceBadge flag={val} />,
    },
    { key: 'allocatedToAnalystId', label: 'Analyst', width: 70, render: (v) => `#${v}` },
    {
      key: 'submittedAt',
      label: 'Submitted',
      width: 150,
      render: (val) => formatDateTime(val),
    },
    {
      key: 'actions',
      label: '',
      width: 120,
      stickyRight: true,
      filter: false,
      render: (_, row) => (
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={() => handleOpenReview(row)}
            className="inline-flex items-center gap-1 rounded-lg bg-primary-600 px-2.5 py-1.5 text-[10px] font-semibold text-white hover:bg-primary-700 transition"
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            Review
          </button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">QC Review Queue</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {items.length} item{items.length !== 1 ? 's' : ''} awaiting QC Head review
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadQueue}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition"
          >
            Refresh
          </button>
          <button
            onClick={() => navigate('/review/qa-head')}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition"
          >
            View QA Queue
          </button>
        </div>
      </div>

      <DataTable columns={columns} data={items} loading={loading} />

      {selectedItem && (
        <ReviewDecisionModal
          open={modalOpen}
          onClose={() => { setModalOpen(false); setSelectedItem(null) }}
          onDecision={handleDecision}
          title="QC Head Review"
          executionId={selectedItem.executionId}
          arNumber={selectedItem.arNumber}
        />
      )}

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  )
}
