import { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useParams, useNavigate } from 'react-router-dom'
import {
  fetchViewTestDetailThunk,
  fetchViewFilesThunk,
  clearViewState,
} from '../store/slices/testExecutionSlice'
import {
  approveTestThunk,
  reworkTestThunk,
} from '../store/slices/assignedTestsSlice'
import Icon from '../components/Icon'
import TestExecutionHeader from '../components/TestExecutionHeader'
import TestingRequestOverview from '../components/TestingRequestOverview'
import MetricDisplayList from '../components/MetricDisplayList'
import ViewExecutionFilesSection from '../components/ViewExecutionFilesSection'
import TestHistoryModal from '../components/TestHistoryModal'
import ActionReasonModal from '../components/ActionReasonModal'
import { useToast } from '../components/Toast'
import { downloadFileFromProxy } from '../utils/fileDownload'
import useAuth from '../auth/useAuth'
import { Rights } from '../constants/rights'

export default function ViewTestExecutionPage() {
  const { detailId } = useParams()
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const toast = useToast()
  const { hasRight } = useAuth()

  const canReview = hasRight(Rights.ROLE_SYSTEM_ADMIN) || hasRight(Rights.ROLE_TEST_REVIEW)

  const { testDetails: detail, files, loading } = useSelector((state) => state.testExecution.view)
  const [historyModalOpen, setHistoryModalOpen] = useState(false)
  const [reworkModalOpen, setReworkModalOpen] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    if (detailId) {
      dispatch(fetchViewTestDetailThunk(detailId))
      dispatch(fetchViewFilesThunk(detailId))
    }
    return () => {
      dispatch(clearViewState())
    }
  }, [detailId, dispatch])

  const handleBack = () => {
    navigate('/assigned-tests')
  }

  const handleDownloadTrf = (trfUrl, fileName) => {
    downloadFileFromProxy(trfUrl, fileName, toast)
  }

  // Handle Approve Test
  const handleApprove = async () => {
    if (!detailId) return
    try {
      setActionLoading(true)
      await dispatch(approveTestThunk(detailId)).unwrap()
      toast.success('Test approved successfully')
      navigate('/assigned-tests')
    } catch (err) {
      toast.error(err || 'Failed to approve test')
    } finally {
      setActionLoading(false)
    }
  }

  // Handle Rework Test
  const handleConfirmRework = async (reason) => {
    if (!detailId) return
    try {
      setActionLoading(true)
      await dispatch(reworkTestThunk({ detailId, reason })).unwrap()
      toast.success('Rework requested. New attempt created.')
      setReworkModalOpen(false)
      navigate('/assigned-tests')
    } catch (err) {
      toast.error(err || 'Failed to request rework')
    } finally {
      setActionLoading(false)
    }
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
      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${color}`}>
        {status || '-'}
      </span>
    )
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center gap-2 text-slate-500">
        <Icon name="refreshCw" className="h-5 w-5 animate-spin text-brand-600" />
        <span className="text-sm font-medium">Loading test execution details...</span>
      </div>
    )
  }

  if (!detail) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 text-slate-500">
        <Icon name="alertCircle" className="h-10 w-10 text-slate-300" />
        <p className="text-sm font-semibold">Test details could not be found.</p>
        <button
          type="button"
          onClick={handleBack}
          className="rounded-lg bg-brand-600 px-4 py-2 text-xs font-semibold text-white shadow-xs cursor-pointer hover:bg-brand-700"
        >
          Return to Assigned Tests
        </button>
      </div>
    )
  }

  const isSubmitted = detail.status === 'SUBMITTED'


  return (
    <div className="flex flex-1 min-h-0 flex-col overflow-y-auto space-y-5 pb-8">
      {/* Shared Header Bar */}
      <TestExecutionHeader
        title="View Test Execution"
        attemptNumber={detail.attemptNumber}
        parameterName={detail.parameterName}
        arNumber={detail.arNumber}
        statusBadge={getStatusBadge(detail.status)}
        actions={null}
        onBack={handleBack}
        onOpenHistory={() => setHistoryModalOpen(true)}
      />

      {/* Shared Overview Card */}
      <TestingRequestOverview
        details={detail}
        onDownloadTrf={handleDownloadTrf}
      />

      {/* Specifications Display (Read-Only with Labels & Units & Submission Notes) */}
      <MetricDisplayList
        specifications={detail.specifications || []}
        submissionNotes={detail.submissionNotes}
      />

      {/* Attached Evidence Files (Scrollable with Original Names, View/Download, Remarks) */}
      <ViewExecutionFilesSection files={files || []} />

      {/* Bottom Review Action Bar if Submitted */}
      {isSubmitted && canReview && (
        <div className="flex items-center justify-between rounded-xl border border-slate-200/80 bg-white p-4 shadow-xs">
          <div className="text-xs text-slate-500">
            This test is in <span className="font-semibold text-purple-700">SUBMITTED</span> status awaiting reviewer approval or rework.
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              disabled={actionLoading}
              onClick={() => setReworkModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-amber-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-amber-700 transition disabled:opacity-50 cursor-pointer"
            >
              <Icon name="refreshCw" className="h-4 w-4" />
              Request Rework
            </button>
            <button
              type="button"
              disabled={actionLoading}
              onClick={handleApprove}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700 transition disabled:opacity-50 cursor-pointer"
            >
              <Icon name="checkCircle2" className="h-4 w-4" />
              Approve Test
            </button>
          </div>
        </div>
      )}

      {/* Test History Modal */}
      <TestHistoryModal
        isOpen={historyModalOpen}
        onClose={() => setHistoryModalOpen(false)}
        detailId={detailId}
      />

      {/* Rework Reason Modal */}
      <ActionReasonModal
        isOpen={reworkModalOpen}
        onClose={() => setReworkModalOpen(false)}
        onSubmit={handleConfirmRework}
        title="Request Test Rework"
        subtitle={`AR #${detail.arNumber || '-'} — ${detail.parameterName}`}
        description="Provide a clear reason and instructions for the analyst to repeat this test execution."
        placeholder="e.g. Inconsistent chromatogram peak, please re-test with fresh standard..."
        confirmText="Confirm Rework"
        confirmColor="amber"
        icon="refreshCw"
        loading={actionLoading}
        required={true}
      />
    </div>
  )
}
