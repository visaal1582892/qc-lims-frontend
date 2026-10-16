import { useState, useCallback, useEffect } from 'react'
import { Plus } from 'lucide-react'
import { PageHeader } from '../../components/layout/PageHeader'
import { DataTable } from '../../components/table/DataTable'
import { InwardCreateModal } from './InwardCreateModal'
import { inwardApi } from '../../api/inwardApi'
import { useAuthRights } from '../../auth/useAuthRights'
import { Rights } from '../../constants/rights'

/**
 * Inward Registration list page — Tier 3 Page Container.
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

  const addToast = useCallback((t) => {
    setToast(t)
    setTimeout(() => setToast(null), 4000)
  }, [])

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await inwardApi.getAll()
      setData(res.data?.data ?? [])
    } catch (err) {
      setError(err.message ?? 'Failed to load inward records')
      addToast({ message: 'Failed to load inward records', type: 'error' })
    } finally {
      setLoading(false)
    }
  }, [addToast])

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
      {error && <p style={{ color: '#ef4444' }}>{error}</p>}
      <DataTable
        columns={columns}
        data={data}
        loading={loading}
        onEdit={hasRight(Rights.ROLE_INWARD_UPDATE) ? handleEdit : undefined}
        onDelete={hasRight(Rights.ROLE_INWARD_DELETE) ? handleDelete : undefined}
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
