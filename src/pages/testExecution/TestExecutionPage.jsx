/**
 * TestExecutionPage — Analyst/QC Head page showing active test executions with status controls.
 *
 * Displays all test executions with inline status transition controls,
 * result entry, hold/cancel reason modals, and reassignment dialog.
 *
 * SRS Module 6.2: Execution lifecycle states management.
 */
import { useState, useCallback, useEffect, useMemo } from 'react'
import { RefreshCw, Filter } from 'lucide-react'
import { PageHeader } from '../../components/layout/PageHeader'
import { DataTable } from '../../components/table/DataTable'
import { testExecutionApi } from '../../api/testExecutionApi'
import { HoldCancelReasonModal } from './components/HoldCancelReasonModal'
import { ResultEntryForm } from './components/ResultEntryForm'
import { ReassignmentDialog } from './components/ReassignmentDialog'
import { buildExecutionColumns } from './components/executionColumns'
import { ExecutionStatus } from '../../constants/enums'

// Status filter options
const statusFilters = [
  { label: 'All', value: '' },
  { label: 'Allocated', value: ExecutionStatus.ALLOCATED },
  { label: 'Testing', value: ExecutionStatus.TESTING },
  { label: 'Hold', value: ExecutionStatus.HOLD },
  { label: 'Under Review', value: ExecutionStatus.UNDER_REVIEW },
  { label: 'Rework', value: ExecutionStatus.REWORK_REQUESTED },
  { label: 'Released', value: ExecutionStatus.RELEASED },
  { label: 'Cancelled', value: ExecutionStatus.CANCELLED_NOT_PERFORMED },
]

export function TestExecutionPage() {
  const [executions, setExecutions] = useState([])
  const [filteredExecutions, setFilteredExecutions] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')

  // Modal states
  const [holdCancelOpen, setHoldCancelOpen] = useState(false)
  const [holdCancelTarget, setHoldCancelTarget] = useState(null)
  const [holdCancelType, setHoldCancelType] = useState('hold')
  const [resultOpen, setResultOpen] = useState(false)
  const [resultTarget, setResultTarget] = useState(null)
  const [reassignOpen, setReassignOpen] = useState(false)
  const [reassignTarget, setReassignTarget] = useState(null)
  const [reworkReasonOpen, setReworkReasonOpen] = useState(false)
  const [reworkTarget, setReworkTarget] = useState(null)
  const [toast, setToast] = useState(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await testExecutionApi.getAll().catch(() => ({ data: [] }))
      const data = res.data?.data ?? []
      setExecutions(data)
      setFilteredExecutions(data)
    } catch {
      // Handled by API client
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  useEffect(() => {
    if (!statusFilter) {
      setFilteredExecutions(executions)
    } else {
      setFilteredExecutions(executions.filter(e => e.executionStatus === statusFilter))
    }
  }, [statusFilter, executions])

  const showToast = (message, type = 'info') => {
    setToast({ id: Date.now(), message, type })
    setTimeout(() => setToast(null), 4000)
  }

  // --- Action handlers ---

  const executeTransition = async (execution, fn) => {
    try {
      await fn()
      fetchData()
    } catch (err) {
      const msg = err.response?.data?.message || 'Transition failed.'
      showToast(msg, 'error')
    }
  }

  const handleAction = useCallback((action, execution) => {
    switch (action) {
      case 'start':
      case 'resumeFromHold':
        executeTransition(execution, async () => {
          await testExecutionApi.start(execution.executionId)
          showToast('Testing started.', 'success')
        })
        break
      case 'hold':
        setHoldCancelType('hold')
        setHoldCancelTarget(execution)
        setHoldCancelOpen(true)
        break
      case 'cancel':
        setHoldCancelType('cancel')
        setHoldCancelTarget(execution)
        setHoldCancelOpen(true)
        break
      case 'submit':
        setResultTarget(execution)
        setResultOpen(true)
        break
      case 'approve':
        executeTransition(execution, async () => {
          await testExecutionApi.approve(execution.executionId)
          showToast('Test approved and released.', 'success')
        })
        break
      case 'rework':
        setReworkTarget(execution)
        setReworkReasonOpen(true)
        break
      case 'resume':
      case 'resumeFromHold':
        executeTransition(execution, async () => {
          await testExecutionApi.resume(execution.executionId)
          showToast('Testing resumed from rework.', 'success')
        })
        break
      case 'reassign':
        setReassignTarget(execution)
        setReassignOpen(true)
        break
      default:
        break
    }
  }, [showToast])

  const handleHoldCancelSubmit = async (reason) => {
    const exec = holdCancelTarget
    const apiFn = holdCancelType === 'hold'
      ? () => testExecutionApi.hold(exec.executionId, { newStatus: ExecutionStatus.HOLD, reason })
      : () => testExecutionApi.cancel(exec.executionId, { newStatus: ExecutionStatus.CANCELLED_NOT_PERFORMED, reason })
    try {
      await apiFn()
      showToast(holdCancelType === 'hold' ? 'Test put on hold.' : 'Test cancelled.', 'success')
      setHoldCancelOpen(false)
      setHoldCancelTarget(null)
      fetchData()
    } catch (err) {
      showToast(err.response?.data?.message || `${holdCancelType} failed.`, 'error')
    }
  }

  const handleResultSubmit = async (data) => {
    try {
      await testExecutionApi.submitResult(resultTarget.executionId, data)
      showToast('Result submitted.', 'success')
      setResultOpen(false)
      setResultTarget(null)
      fetchData()
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to submit result.', 'error')
    }
  }

  const handleReworkSubmit = async (reason) => {
    try {
      await testExecutionApi.rework(reworkTarget.executionId, {
        newStatus: ExecutionStatus.REWORK_REQUESTED,
        reason,
      })
      showToast('Rework requested.', 'success')
      setReworkReasonOpen(false)
      setReworkTarget(null)
      fetchData()
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to request rework.', 'error')
    }
  }

  const handleReassignSubmit = async (data) => {
    try {
      await testExecutionApi.reassign(reassignTarget.executionId, data)
      showToast('Test reassigned.', 'success')
      setReassignOpen(false)
      setReassignTarget(null)
      fetchData()
    } catch (err) {
      showToast(err.response?.data?.message || 'Reassignment failed.', 'error')
    }
  }

  // Derived
  const columns = useMemo(() => buildExecutionColumns(handleAction), [handleAction])

  const countByStatus = (status) =>
    !status ? executions.length : executions.filter(e => e.executionStatus === status).length

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Test Execution"
        subtitle="Monitor and manage test execution lifecycle — start, hold, submit results, and approve."
        actions={
          <button
            onClick={fetchData}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-300/30 active:scale-[0.98] transition"
            title="Refresh"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </button>
        }
      />

      {/* Status filter pills */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="h-4 w-4 text-slate-400 shrink-0" />
        {statusFilters.map(f => (
          <button
            key={f.value || 'all'}
            onClick={() => setStatusFilter(f.value)}
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ring-1 transition-all ${
              statusFilter === f.value
                ? 'bg-primary-600 text-white ring-primary-600'
                : 'bg-white text-slate-600 ring-slate-200 hover:bg-slate-50'
            }`}
          >
            {f.label}
            <span className={`ml-0.5 ${statusFilter === f.value ? 'text-primary-200' : 'text-slate-400'}`}>
              {countByStatus(f.value)}
            </span>
          </button>
        ))}
      </div>

      {/* Data table */}
      <div className="flex-1">
        <DataTable columns={columns} data={filteredExecutions} loading={loading} />
      </div>

      {/* Hold/Cancel reason modal */}
      <HoldCancelReasonModal
        open={holdCancelOpen}
        title={holdCancelType === 'hold' ? `Put Test on Hold (${holdCancelTarget?.arNumber})` : `Cancel Test (${holdCancelTarget?.arNumber})`}
        onSubmit={handleHoldCancelSubmit}
        onClose={() => { setHoldCancelOpen(false); setHoldCancelTarget(null) }}
      />

      {/* Rework reason modal */}
      <HoldCancelReasonModal
        open={reworkReasonOpen}
        title={`Request Rework (${reworkTarget?.arNumber})`}
        onSubmit={handleReworkSubmit}
        onClose={() => { setReworkReasonOpen(false); setReworkTarget(null) }}
      />

      {/* Result entry modal */}
      {resultOpen && resultTarget && (
        <div
          className="fixed inset-0 z-modal flex items-center justify-center p-4 bg-slate-900/45 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) { setResultOpen(false); setResultTarget(null) }}}
        >
          <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200/60 overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <h2 className="text-lg font-semibold tracking-tight text-slate-900">
                Submit Result ({resultTarget.arNumber})
              </h2>
              <button
                onClick={() => { setResultOpen(false); setResultTarget(null) }}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
                aria-label="Close modal"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="px-5 py-4">
              <ResultEntryForm
                execution={resultTarget}
                onSubmit={handleResultSubmit}
                onCancel={() => { setResultOpen(false); setResultTarget(null) }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Reassignment dialog */}
      <ReassignmentDialog
        open={reassignOpen}
        execution={reassignTarget}
        onSubmit={handleReassignSubmit}
        onClose={() => { setReassignOpen(false); setReassignTarget(null) }}
      />

      {/* Toast */}
      <Toast notification={toast} onClose={() => setToast(null)} />
    </div>
  )
}

// Inline toast component (simple, not shared across the app)
function Toast({ notification, onClose }) {
  if (!notification) return null
  const colorMap = {
    success: 'bg-emerald-50/95 text-emerald-950 ring-emerald-200/70',
    error: 'bg-rose-50/95 text-rose-950 ring-rose-200/70',
    info: 'bg-white/95 text-slate-800 ring-slate-200/70',
  }
  return (
    <div className="fixed bottom-5 right-5 z-[9999] pointer-events-none">
      <div className={`pointer-events-auto w-[340px] rounded-2xl p-4 shadow-xl ring-1 backdrop-blur-md transition-all ${colorMap[notification.type] || colorMap.info}`}>
        <div className="flex items-start gap-3">
          <p className="flex-1 text-sm font-medium">{notification.message}</p>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 shrink-0">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
