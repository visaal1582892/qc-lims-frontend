import { useState, useCallback, useEffect } from 'react'
import { Plus } from 'lucide-react'
import { PageHeader } from '../../components/layout/PageHeader'
import { DataTable } from '../../components/table/DataTable'
import { TrfCreateModal } from './TrfCreateModal'
import { TrfActionMenu } from './TrfActionMenu'
import { trfApi } from '../../api/trfApi'
import { useAuthRights } from '../../auth/useAuthRights'
import { Rights } from '../../constants/rights'

/**
 * e-TRF Management list page — Tier 3 Page Container.
 */
export function TrfListPage() {
  const { hasRight } = useAuthRights()

  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState('create')
  const [editingRow, setEditingRow] = useState(null)
  const [toast, setToast] = useState(null)
  const [statusFilter, setStatusFilter] = useState('')

  const addToast = useCallback((t) => {
    setToast(t)
    setTimeout(() => setToast(null), 4000)
  }, [])

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = statusFilter
        ? await trfApi.getByStatus(statusFilter)
        : await trfApi.getAll()
      setData(res.data?.data ?? [])
    } catch (err) {
      setError(err.message ?? 'Failed to load e-TRFs')
      addToast({ message: 'Failed to load e-TRFs', type: 'error' })
    } finally {
      setLoading(false)
    }
  }, [statusFilter, addToast])

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
      await trfApi.delete(id)
      setData((prev) => prev.filter((r) => r.id !== id))
      addToast({ message: 'e-TRF deleted', type: 'success' })
    } catch {
      addToast({ message: 'Failed to delete e-TRF', type: 'error' })
    }
  }

  const handleAccept = async (id) => {
    try {
      await trfApi.accept(id)
      fetchData()
      addToast({ message: 'e-TRF accepted', type: 'success' })
    } catch {
      addToast({ message: 'Failed to accept e-TRF', type: 'error' })
    }
  }

  const handleReject = async (id) => {
    try {
      await trfApi.reject(id)
      fetchData()
      addToast({ message: 'e-TRF rejected', type: 'success' })
    } catch {
      addToast({ message: 'Failed to reject e-TRF', type: 'error' })
    }
  }

  const columns = [
    { accessor: 'grnNumber', header: 'GRN No' },
    { accessor: 'companyName', header: 'Company' },
    { accessor: 'batchNumbers', header: 'Batches' },
    { accessor: 'materialType', header: 'Material Type' },
    { accessor: 'storageCondition', header: 'Storage' },
    { accessor: 'analysisType', header: 'Analysis Type' },
    { accessor: 'trfStatus', header: 'Status' },
    { accessor: 'submittedAt', header: 'Submitted At' },
  ]

  const actions = []
  if (hasRight(Rights.ROLE_TRF_CREATE)) {
    actions.push({ label: 'Create e-TRF', onClick: handleCreate, icon: Plus })
  }

  const statusOptions = [
    { value: '', label: 'All Statuses' },
    { value: 'Pending_Feasibility', label: 'Pending Feasibility' },
    { value: 'Accepted', label: 'Accepted' },
    { value: 'Rejected', label: 'Rejected' },
  ]

  return (
    <div>
      <PageHeader
        title="e-TRF Management"
        subtitle="Manage electronic Test Request Forms"
        actions={actions}
      />
      <div style={{ marginBottom: 16 }}>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #d1d5db' }}
        >
          {statusOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>
      {error && <p style={{ color: '#ef4444' }}>{error}</p>}
      <DataTable
        columns={columns}
        data={data}
        loading={loading}
        onEdit={hasRight(Rights.ROLE_TRF_UPDATE) ? handleEdit : undefined}
        onDelete={hasRight(Rights.ROLE_TRF_DELETE) ? handleDelete : undefined}
        onCustomAction={
          (row) => [
            ...(hasRight(Rights.ROLE_TRF_ACCEPT) && row.trfStatus === 'Pending_Feasibility'
              ? [{ label: 'Accept', onClick: () => handleAccept(row.id), color: '#22c55e' }] : []),
            ...(hasRight(Rights.ROLE_TRF_REJECT) && row.trfStatus === 'Pending_Feasibility'
              ? [{ label: 'Reject', onClick: () => handleReject(row.id), color: '#ef4444' }] : []),
          ]
        }
      />
      {toast && (
        <div style={{
          position: 'fixed', bottom: 16, right: 16, padding: '8px 16px',
          background: toast.type === 'error' ? '#ef4444' : '#22c55e',
          color: '#fff', borderRadius: 6,
        }}>
          {toast.message}
        </div>
      )}
      <TrfCreateModal
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
