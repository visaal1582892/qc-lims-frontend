import { useState, useCallback, useEffect } from 'react'
import { Plus, Filter } from 'lucide-react'
import { PageHeader } from '../../components/layout/PageHeader'
import { DataTable } from '../../components/table/DataTable'
import { InwardCreateModal } from './InwardCreateModal'
import { inwardApi } from '../../api/inwardApi'
import { useAuthRights } from '../../auth/useAuthRights'
import { Rights } from '../../constants/rights'

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

  const arStatusOptions = ['Active', 'For_Information', 'Closed', 'Rejected']

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

  const columns = [
    { accessor: 'arNumber', header: 'AR Number' },
    { accessor: 'batchNo', header: 'Batch No' },
    { accessor: 'productId', header: 'Product ID' },
    { accessor: 'receivedQuantityPacks', header: 'Packs' },
    { accessor: 'totalReceivedUnits', header: 'Total Units' },
    { accessor: 'storageLocation', header: 'Storage' },
    { accessor: 'arStatus', header: 'Status' },
    { accessor: 'receiptDate', header: 'Receipt Date' },
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
    </div>
  )
}
