/**
 * TestAllocationPage — QC Head page for allocating tests to analysts.
 *
 * Shows pending inward samples (without active test executions) and all
 * current test allocations. Provides allocation dialog for new assignments.
 *
 * SRS Module 6.1: QC Head selects pending inward samples, confirms parameters,
 * assigns to analyst, specifies allocated sample units.
 */
import { useState, useCallback, useEffect } from 'react'
import { Plus, RefreshCw } from 'lucide-react'
import { PageHeader } from '../../components/layout/PageHeader'
import { DataTable } from '../../components/table/DataTable'
import { testExecutionApi } from '../../api/testExecutionApi'
import { AllocationDialog } from './components/AllocationDialog'
import { StatusTransitionControls } from './components/StatusTransitionControls'
import { ComplianceBadge } from './components/ComplianceBadge'
import { formatDateTime, formatDate } from '../../utils/formatters'
import { ExecutionStatus } from '../../constants/enums'

export function TestAllocationPage() {
  const [executions, setExecutions] = useState([])
  const [pendingItems, setPendingItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [toast, setToast] = useState(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [allRes, pendingRes] = await Promise.all([
        testExecutionApi.getAll().catch(() => ({ data: { data: [] } })),
        testExecutionApi.getPending().catch(() => ({ data: { data: [] } })),
      ])
      setExecutions(allRes.data?.data ?? [])
      setPendingItems(pendingRes.data?.data ?? [])
    } catch {
      // Errors handled by API client interceptor
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const showToast = (message, type = 'info') => {
    setToast({ id: Date.now(), message, type })
    setTimeout(() => setToast(null), 4000)
  }

  const handleAllocate = async (data) => {
    try {
      await testExecutionApi.allocate(data)
      showToast('Test allocated successfully.', 'success')
      setDialogOpen(false)
      fetchData()
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to allocate test.'
      showToast(msg, 'error')
    }
  }

  const handleAction = async (action, execution) => {
    if (action === 'start' || action === 'resumeFromHold') {
      try {
        await testExecutionApi.start(execution.executionId)
        showToast('Testing started.', 'success')
        fetchData()
      } catch (err) {
        showToast(err.response?.data?.message || 'Failed to start testing.', 'error')
      }
    }
  }

  const columns = [
    { key: 'arNumber', label: 'AR Number', width: '140px' },
    { key: 'parameterName', label: 'Parameter', width: '180px' },
    {
      key: 'allocatedToAnalystId',
      label: 'Analyst',
      width: '90px',
      render: (val) => val ? `ID ${val}` : '-',
    },
    {
      key: 'executionStatus',
      label: 'Status',
      width: '130px',
      render: (val) => {
        if (!val) return '-'
        const statusKey = val.toLowerCase().replace(/\s+/g, '_')
        const bgMap = {
          allocated: 'bg-sky-50 text-sky-700 ring-sky-200',
          testing: 'bg-sky-50 text-sky-700 ring-sky-200',
          hold: 'bg-orange-50 text-orange-700 ring-orange-200',
          cancelled_not_performed: 'bg-rose-50 text-rose-700 ring-rose-200',
          under_review: 'bg-violet-50 text-violet-700 ring-violet-200',
          rework_requested: 'bg-orange-50 text-orange-700 ring-orange-200',
          released: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
        }
        const classes = bgMap[statusKey] || 'bg-slate-50 text-slate-600 ring-slate-200'
        return (
          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ring-1 ${classes}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${statusKey === 'testing' ? 'bg-sky-500 animate-pulse' : 'bg-current'}`} />
            {val}
          </span>
        )
      },
    },
    {
      key: 'complianceFlag',
      label: 'Compliance',
      width: '100px',
      render: (val) => <ComplianceBadge flag={val} />,
    },
    {
      key: 'allocatedUnits',
      label: 'Units',
      width: '70px',
      render: (val, row) => val != null ? `${row.consumedUnits ?? 0}/${val}` : '-',
    },
    { key: 'createdAt', label: 'Created', width: '130px', render: (val) => formatDate(val) },
    {
      key: 'actions',
      label: 'Actions',
      width: '200px',
      stickyRight: true,
      render: (_, row) => <StatusTransitionControls execution={row} onAction={handleAction} />,
    },
  ]

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Test Allocation"
        subtitle="Allocate tests to analysts and manage sample preparation assignments."
        actions={
          <>
            <button
              onClick={fetchData}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-300/30 active:scale-[0.98] transition"
              title="Refresh"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Refresh
            </button>
            <button
              onClick={() => setDialogOpen(true)}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500/20 active:scale-[0.98] transition"
            >
              <Plus className="h-4 w-4" />
              Allocate Test
            </button>
          </>
        }
      />

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Pending Allocation', value: pendingItems?.length ?? 0, color: 'from-amber-500 to-amber-700' },
          { label: 'Total Allocated', value: executions?.length ?? 0, color: 'from-primary-500 to-primary-700' },
          { label: 'In Testing', value: executions?.filter(e => e.executionStatus === ExecutionStatus.TESTING).length ?? 0, color: 'from-sky-500 to-sky-700' },
          { label: 'Released', value: executions?.filter(e => e.executionStatus === ExecutionStatus.RELEASED).length ?? 0, color: 'from-emerald-500 to-emerald-700' },
        ].map(card => (
          <div key={card.label} className="group flex flex-col overflow-hidden rounded-2xl bg-white px-4 py-3.5 shadow-sm ring-1 ring-slate-900/5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:ring-slate-900/8">
            <div className="flex items-start justify-between">
              <div className={`inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br ${card.color} text-white shadow-sm`}>
                <span className="text-lg font-bold">{card.value}</span>
              </div>
            </div>
            <div className="mt-2">
              <div className="text-3xl font-bold tracking-tight text-slate-900 leading-none">{card.value}</div>
              <div className="mt-1 text-xs font-medium text-slate-400">{card.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Data table */}
      <div className="flex-1">
        <DataTable columns={columns} data={executions} loading={loading} />
      </div>

      {/* Allocation dialog */}
      <AllocationDialog
        open={dialogOpen}
        pendingItems={pendingItems}
        onSubmit={handleAllocate}
        onClose={() => setDialogOpen(false)}
      />

      {/* Toast notification */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-[9999] pointer-events-none">
          <div className={`pointer-events-auto w-[340px] rounded-2xl p-4 shadow-xl ring-1 backdrop-blur-md transition-all ${
            toast.type === 'success' ? 'bg-emerald-50/95 text-emerald-950 ring-emerald-200/70' :
            toast.type === 'error' ? 'bg-rose-50/95 text-rose-950 ring-rose-200/70' :
            'bg-white/95 text-slate-800 ring-slate-200/70'
          }`}>
            <div className="flex items-start gap-3">
              <p className="flex-1 text-sm font-medium">{toast.message}</p>
              <button onClick={() => setToast(null)} className="text-slate-400 hover:text-slate-600 shrink-0">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
