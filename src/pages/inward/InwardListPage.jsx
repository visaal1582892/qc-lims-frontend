import { useState, useCallback, useEffect } from 'react'
import { Plus, Filter, CheckCircle, XCircle } from 'lucide-react'
import { PageHeader } from '../../components/layout/PageHeader'
import { DataTable } from '../../components/table/DataTable'
import { Modal } from '../../components/feedback/Modal'
import { InwardCreateModal } from './InwardCreateModal'
import { inwardApi } from '../../api/inwardApi'
import { useAuthRights } from '../../auth/useAuthRights'
import { Rights } from '../../constants/rights'
import { ArStatus } from '../../constants/enums'

/**
 * Inward Registration list page — Tier 3 Page Container.
 * M-4: Includes status filter dropdown.
 */
export function InwardListPage() {
  const { hasRight } = useAuthRights()

  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState('create')
  const [editingRow, setEditingRow] = useState(null)
  const [toast, setToast] = useState(null)
  const [statusFilter, setStatusFilter] = useState('')
  const [filterOpen, setFilterOpen] = useState(false)

  // Phase 5: AR lifecycle modal state
  const [lifecycleModalOpen, setLifecycleModalOpen] = useState(false)
  const [lifecycleMode, setLifecycleMode] = useState(null) // 'close' | 'cancel'
  const [lifecycleTarget, setLifecycleTarget] = useState(null)
  const [lifecycleReason, setLifecycleReason] = useState('')

  const arStatusOptions = Object.values(ArStatus)

  const addToast = useCallback((t) => {
    setToast(t)
    setTimeout(() => setToast(null), 4000)
  }, [])

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await inwardApi.getAll()
      const allData = res.data?.data ?? []
      // Client-side filter for status
      if (statusFilter) {
        setData(allData.filter((r) => r.arStatus === statusFilter))
      } else {
        setData(allData)
      }
    } catch (err) {
      setError(err.message ?? 'Failed to load inward records')
      addToast({ message: 'Failed to load inward records', type: 'error' })
    } finally {
      setLoading(false)
    }
  }, [addToast, statusFilter])

  useEffect(() => { fetchData() }, [fetchData])

  const handleCreate = () => {
    setModalMode('create')
    setEditingRow(null)
    setModalOpen(true)
  }

  const handleEdit = (row) => {
    setModalMode('update')
    setEditingRow(row)
    setModalOpen(true)
  }

  const handleDelete = async (id) => {
    try {
      await inwardApi.delete(id)
      setData((prev) => prev.filter((r) => r.id !== id))
      addToast({ message: 'Inward record deleted', type: 'success' })
    } catch {
      addToast({ message: 'Failed to delete inward record', type: 'error' })
    }
  }

  // --- Phase 5: AR lifecycle handlers ---

  const handleOpenLifecycle = (mode, row) => {
    setLifecycleMode(mode)
    setLifecycleTarget(row)
    setLifecycleReason('')
    setLifecycleModalOpen(true)
  }

  const handleLifecycleConfirm = async () => {
    if (!lifecycleReason.trim()) {
      addToast({ message: 'Reason is required', type: 'error' })
      return
    }
    try {
      if (lifecycleMode === 'close') {
        await inwardApi.closeAr(lifecycleTarget.id, { reason: lifecycleReason })
      } else if (lifecycleMode === 'cancel') {
        await inwardApi.cancelAr(lifecycleTarget.id, { reason: lifecycleReason })
      }
      addToast({
        message: `AR ${lifecycleMode === 'close' ? 'closed' : 'cancelled'} successfully`,
        type: 'success',
      })
      setLifecycleModalOpen(false)
      fetchData()
    } catch (err) {
      addToast({ message: err.message ?? 'Operation failed', type: 'error' })
    }
  }

  // Phase 5: Row-level lifecycle action buttons
  const rowActions = (row) => {
    const actions = []
    if (hasRight(Rights.ROLE_AR_CLOSE) && row.arStatus === ArStatus.ALL_TESTS_COMPLETE) {
      actions.push({
        label: 'Close AR',
        onClick: () => handleOpenLifecycle('close', row),
        icon: CheckCircle,
        variant: 'success',
      })
    }
    if (hasRight(Rights.ROLE_AR_CANCEL) && (row.arStatus === ArStatus.REGISTERED || row.arStatus === ArStatus.IN_PROGRESS)) {
      actions.push({
        label: 'Cancel AR',
        onClick: () => handleOpenLifecycle('cancel', row),
        icon: XCircle,
        variant: 'danger',
      })
    }
    return actions
  }

  // DataTable columns — uses key/label API per DataTable component contract
  const columns = [
    { key: 'arNumber', label: 'AR Number' },
    { key: 'batchNo', label: 'Batch No' },
    { key: 'productId', label: 'Product ID' },
    { key: 'receivedQuantityPacks', label: 'Packs' },
    { key: 'totalReceivedUnits', label: 'Total Units' },
    { key: 'storageLocation', label: 'Storage' },
    { key: 'arStatus', label: 'AR Status' },
    {
      key: 'testCompletionRate',
      label: 'Completion %',
      render: (val) => (val != null ? `${val}%` : '\u2014'),
    },
    { key: 'receiptDate', label: 'Receipt Date' },
    {
      key: '_actions',
      label: 'Actions',
      stickyRight: true,
      filter: false,
      render: (_val, row) => {
        const actionsList = rowActions(row)
        if (actionsList.length === 0) return '\u2014'
        return (
          <div className="flex items-center gap-1.5 justify-end">
            {actionsList.map((action) => {
              const Icon = action.icon
              const bgMap = {
                success: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200',
                danger: 'bg-rose-50 text-rose-700 hover:bg-rose-100 border-rose-200',
              }
              const bg = bgMap[action.variant] || 'bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200'
              return (
                <button
                  key={action.label}
                  type="button"
                  onClick={action.onClick}
                  className={`inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium rounded-md border transition ${bg}`}
                >
                  <Icon className="w-3 h-3" />
                  {action.label}
                </button>
              )
            })}
          </div>
        )
      },
    },
  ]

  const actions = []
  if (hasRight(Rights.ROLE_INWARD_CREATE)) {
    actions.push({ label: 'Create Inward', onClick: handleCreate, icon: Plus })
  }

  return (
    <div>
      <PageHeader
        title="Inward Registration"
        subtitle="Manage sample inward registrations and AR numbers"
        actions={actions}
      />
      {/* M-4: Status filter bar */}
      <div className="flex items-center gap-2 mb-3">
        <button
          type="button"
          onClick={() => setFilterOpen(!filterOpen)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition"
        >
          <Filter className="w-3.5 h-3.5" />
          {statusFilter || 'Filter by Status'}
        </button>
        {filterOpen && (
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setFilterOpen(false) }}
              className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 bg-white shadow-sm"
            >
              <option value="">All Statuses</option>
              {arStatusOptions.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        )}
        {statusFilter && (
          <button
            type="button"
            onClick={() => setStatusFilter('')}
            className="text-xs text-slate-500 hover:text-slate-700 underline"
          >
            Clear filter
          </button>
        )}
      </div>
      {error && <p className="text-sm text-rose-500">{error}</p>}
      <DataTable
        columns={columns}
        data={data}
        loading={loading}
        onEdit={hasRight(Rights.ROLE_INWARD_UPDATE) ? handleEdit : undefined}
        onDelete={hasRight(Rights.ROLE_INWARD_DELETE) ? handleDelete : undefined}
      />
      {toast && (
        <div className="fixed bottom-4 right-4 px-4 py-2 rounded-lg text-sm font-medium text-white"
          style={{ background: toast.type === 'error' ? '#ef4444' : '#22c55e' }}>
          {toast.message}
        </div>
      )}
      <InwardCreateModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        mode={modalMode}
        initialData={editingRow}
        onSuccess={fetchData}
        onToast={addToast}
      />

      {/* Phase 5: AR Lifecycle confirmation modal */}
      <Modal
        open={lifecycleModalOpen}
        onClose={() => setLifecycleModalOpen(false)}
        title={lifecycleMode === 'close' ? 'Close AR' : 'Cancel AR'}
        actions={[
          { label: 'Cancel', onClick: () => setLifecycleModalOpen(false) },
          {
            label: lifecycleMode === 'close' ? 'Close AR' : 'Cancel AR',
            onClick: handleLifecycleConfirm,
            variant: lifecycleMode === 'close' ? 'success' : 'danger',
          },
        ]}
      >
        <p className="text-sm text-slate-600 mb-3">
          {lifecycleMode === 'close'
            ? 'Are you sure you want to close this AR? All tests must be in a terminal state.'
            : 'Are you sure you want to cancel this AR? This action cannot be undone.'}
        </p>
        <label className="block text-sm font-medium text-slate-700 mb-1">Reason (required)</label>
        <textarea
          value={lifecycleReason}
          onChange={(e) => setLifecycleReason(e.target.value)}
          rows={3}
          className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Enter reason for this action..."
        />
      </Modal>
    </div>
  )
}
