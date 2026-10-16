import { useState, useCallback } from 'react'
import { Plus, FlaskConical } from 'lucide-react'
import { PageHeader } from '../../components/layout/PageHeader'
import { DataTable } from '../../components/table/DataTable'
import { TestParameterCreateModal } from './TestParameterCreateModal'
import { TestParameterActionMenu } from './components/TestParameterActionMenu'
import { TestParameterFilters } from './components/TestParameterFilters'
import { testParameterApi } from '../../api/testParameterApi'
import { useAuthRights } from '../../auth/useAuthRights'
import { Rights } from '../../constants/rights'

/**
 * Test Parameter list page — Tier 3 Page Container.
 *
 * Displays all test parameters in a data table with filtering,
 * create/edit modal, and delete confirmation.
 */
export function TestParameterListPage() {
  const { hasRight } = useAuthRights()

  // Data state
  const [data, setData] = useState([])
  const [loading, setDataLoading] = useState(false)
  const [error, setError] = useState(null)

  // Filter state
  const [filters, setFilters] = useState({ productId: '', search: '', standardReference: '' })

  // Modal state
  const [modalOpen, setModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState('create')
  const [editingRow, setEditingRow] = useState(null)

  // Toast state (simple)
  const [toast, setToast] = useState(null)

  const addToast = useCallback((t) => {
    setToast(t)
    setTimeout(() => setToast(null), 4000)
  }, [])

  // Fetch data
  const fetchData = useCallback(async () => {
    setDataLoading(true)
    setError(null)
    try {
      const params = {}
      if (filters.productId) params.productId = filters.productId
      if (filters.search) params.search = filters.search
      if (filters.standardReference) params.standardReference = filters.standardReference

      const response = await testParameterApi.getAll(Object.keys(params).length > 0 ? params : undefined)
      const items = response.data?.data ?? response.data ?? []
      setData(Array.isArray(items) ? items : [])
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to load test parameters'
      setError(msg)
      addToast({ message: msg, type: 'error' })
      setData([])
    } finally {
      setDataLoading(false)
    }
  }, [filters, addToast])

  // Initial load
  fetchData()

  // Filter handlers
  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  const handleFilterReset = () => {
    setFilters({ productId: '', search: '', standardReference: '' })
  }

  // CRUD callbacks
  const handleCreateSuccess = () => { fetchData() }
  const handleUpdateSuccess = () => { fetchData() }

  const handleEdit = (row) => {
    setEditingRow(row)
    setModalMode('update')
    setModalOpen(true)
  }

  const handleDelete = async (row) => {
    if (!window.confirm(`Are you sure you want to delete "${row.parameterName}"?`)) return
    try {
      await testParameterApi.delete(row.id)
      addToast({ message: 'Test parameter deleted successfully', type: 'success' })
      fetchData()
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to delete test parameter'
      addToast({ message: msg, type: 'error' })
    }
  }

  // Table columns
  const columns = [
    { key: 'id', label: 'ID', width: 60 },
    { key: 'productId', label: 'Product ID', width: 90 },
    {
      key: 'parameterName',
      label: 'Parameter Name',
      render: (val) => <span className="font-medium text-slate-800">{val}</span>,
    },
    {
      key: 'standardReference',
      label: 'Standard',
      width: 90,
      render: (val) => (
        <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
          {val || '-'}
        </span>
      ),
    },
    { key: 'minLimit', label: 'Min Limit', width: 90 },
    { key: 'maxLimit', label: 'Max Limit', width: 90 },
    {
      key: 'textSpecification',
      label: 'Text Spec',
      width: 140,
      render: (val) => <span className="truncate block max-w-[140px]" title={val}>{val || '-'}</span>,
    },
    {
      key: 'isCritical',
      label: 'Critical',
      width: 80,
      render: (val) => (
        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ${
          val
            ? 'bg-emerald-50 text-emerald-700 ring-emerald-200'
            : 'bg-slate-50 text-slate-600 ring-slate-200'
        }`}>
          {val ? 'Yes' : 'No'}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      width: 60,
      stickyRight: true,
      filter: false,
      render: (_val, row) => (
        <TestParameterActionMenu row={row} onEdit={handleEdit} onDelete={handleDelete} />
      ),
    },
  ]

  return (
    <div className="flex flex-col min-h-[calc(100vh-120px)]">
      {/* Page header */}
      <PageHeader
        title="Test Parameters"
        subtitle="Manage analytical test specifications and acceptance criteria"
        actions={
          hasRight(Rights.ROLE_TEST_PARAMETER_CREATE) ? (
            <button
              onClick={() => { setModalMode('create'); setEditingRow(null); setModalOpen(true) }}
              className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition shadow-sm"
            >
              <Plus className="h-4 w-4" />
              Add New
            </button>
          ) : null
        }
      />

      {/* Error display */}
      {error && (
        <div className="mb-4 rounded-lg bg-rose-50 border border-rose-200 px-4 py-3 text-sm text-rose-700">
          {error}
          <button onClick={fetchData} className="ml-2 underline font-medium">Retry</button>
        </div>
      )}

      {/* Filters */}
      <TestParameterFilters
        filters={filters}
        onFilterChange={handleFilterChange}
        onReset={handleFilterReset}
      />

      {/* Data table */}
      <DataTable columns={columns} data={data} loading={loading} />

      {/* Create/Edit Modal */}
      <TestParameterCreateModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        mode={modalMode}
        initialData={editingRow}
        onSuccess={modalMode === 'create' ? handleCreateSuccess : handleUpdateSuccess}
        onToast={addToast}
      />

      {/* Toast notification */}
      {toast && (
        <div className={`fixed bottom-5 right-5 z-[9999] w-[340px] rounded-2xl p-4 shadow-xl ring-1 backdrop-blur-md transition-all ${
          toast.type === 'success' ? 'bg-emerald-50/95 text-emerald-950 ring-emerald-200/70' :
          toast.type === 'error' ? 'bg-rose-50/95 text-rose-950 ring-rose-200/70' :
          'bg-white/95 text-slate-800 ring-slate-200/70'
        }`}>
          <div className="flex items-start gap-3">
            <p className="flex-1 text-sm font-medium">{toast.message}</p>
            <button onClick={() => setToast(null)} className="text-slate-400 hover:text-slate-600 shrink-0">
              <span className="text-lg leading-none">&times;</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
