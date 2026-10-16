/**
 * QC Inventory List Page — main inventory view with DataTable, KPI cards, filters.
 * Covers AC-16: Inventory list page with DataTable.
 */
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Package, AlertTriangle, TrendingDown, Plus } from 'lucide-react'
import { PageHeader } from '../../components/layout/PageHeader'
import { DataTable } from '../../components/table/DataTable'
import { Spinner } from '../../components/feedback/Spinner'
import { inventoryApi } from '../../api/inventoryApi'
import { StorageConditionBadge } from './components/StorageConditionBadge'
import { VarianceAlert } from './components/VarianceAlert'
import { formatDate } from '../../utils/formatters'
// M-2 fix: Add right-gated UI elements
import { useAuthRights } from '../../auth/useAuthRights'
import { Rights } from '../../constants/rights'

export function InventoryListPage() {
  const navigate = useNavigate()
  const { hasRight } = useAuthRights()
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await inventoryApi.getAll()
      setData(res.data.data || [])
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load inventory data')
    } finally {
      setLoading(false)
    }
  }

  // KPI calculations
  const totalItems = data.length
  const lowStock = data.filter(d => (d.currentBalance ?? d.totalQuantityReceived - (d.quantityConsumed || 0)) <= 2).length
  const unconsumedVariance = data.filter(d => ((d.quantityAllocated || 0) - (d.quantityConsumed || 0)) > 0).length

  const columns = [
    { key: 'inventoryId', label: 'ID', width: 60 },
    { key: 'arNumber', label: 'AR Number', width: 120 },
    { key: 'batchNo', label: 'Batch No', width: 140 },
    { key: 'totalQuantityReceived', label: 'Total Qty', width: 80, render: (v) => v ?? '-' },
    { key: 'quantityAllocated', label: 'Allocated', width: 80, render: (v) => v ?? 0 },
    { key: 'quantityConsumed', label: 'Consumed', width: 80, render: (v) => v ?? 0 },
    {
      key: 'currentBalance',
      label: 'Balance',
      width: 80,
      render: (v, row) => v ?? row.totalQuantityReceived - (row.quantityConsumed || 0),
    },
    {
      key: 'storageLocation',
      label: 'Storage',
      width: 130,
      render: (v) => <StorageConditionBadge location={v} />,
    },
    {
      key: 'variance',
      label: 'Variance',
      width: 110,
      render: (v, row) => (
        <VarianceAlert allocated={row.quantityAllocated || 0} consumed={row.quantityConsumed || 0} />
      ),
    },
    {
      key: 'createdAt',
      label: 'Received',
      width: 110,
      render: (v) => formatDate(v),
    },
    {
      key: 'actions',
      label: 'Actions',
      width: 80,
      stickyRight: true,
      filter: false,
      render: (_, row) => (
        <button
          onClick={() => navigate(`/inventory/${row.inventoryId}`)}
          className="text-xs font-medium text-primary-600 hover:text-primary-700 transition"
        >
          View
        </button>
      ),
    },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="QC Inventory"
        subtitle="Manage sample inventory, allocation, and consumption tracking"
        actions={
          hasRight(Rights.ROLE_INVENTORY_CREATE) && (
            <button
              // L-3 fix: Navigate to inward registration (inventory created via inward acceptance flow)
              // instead of non-existent /inventory/new route
              onClick={() => navigate('/inward')}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary-600 px-3.5 py-2 text-sm font-medium text-white hover:bg-primary-700 transition"
              title="Create inward registration (inventory is created upon acceptance)"
            >
              <Plus className="h-4 w-4" />
              New Inventory
            </button>
          )
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-primary-50 p-2.5">
              <Package className="h-5 w-5 text-primary-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{totalItems}</p>
              <p className="text-xs text-slate-500">Total Inventory Items</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-amber-50 p-2.5">
              <TrendingDown className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{lowStock}</p>
              <p className="text-xs text-slate-500">Low Stock (≤ 2 units)</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-rose-50 p-2.5">
              <AlertTriangle className="h-5 w-5 text-rose-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{unconsumedVariance}</p>
              <p className="text-xs text-slate-500">Unconsumed Variance</p>
            </div>
          </div>
        </div>
      </div>

      {/* Error display */}
      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      {/* Data Table */}
      <DataTable columns={columns} data={data.map(item => ({ ...item, actions: '' }))} />
    </div>
  )
}
