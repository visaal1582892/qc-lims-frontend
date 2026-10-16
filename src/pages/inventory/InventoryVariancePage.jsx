/**
 * Inventory Variance Reconciliation Page — summary view of unconsumed samples.
 * Covers AC-29: Variance reconciliation summary view.
 */
import { useState, useEffect } from 'react'
import { AlertTriangle, Package, TrendingUp } from 'lucide-react'
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

export function InventoryVariancePage() {
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
      const res = await inventoryApi.getVarianceReport()
      setData(res.data.data || [])
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load variance report')
    } finally {
      setLoading(false)
    }
  }

  // KPI calculations
  const totalVariance = data.reduce((sum, d) => sum + ((d.quantityAllocated || 0) - (d.quantityConsumed || 0)), 0)
  const largeVariance = data.filter(d => ((d.quantityAllocated || 0) - (d.quantityConsumed || 0)) > 5).length

  const columns = [
    { key: 'inventoryId', label: 'ID', width: 60 },
    { key: 'arNumber', label: 'AR Number', width: 120 },
    { key: 'batchNo', label: 'Batch No', width: 140 },
    { key: 'totalQuantityReceived', label: 'Total Qty', width: 80 },
    { key: 'quantityAllocated', label: 'Allocated', width: 80 },
    { key: 'quantityConsumed', label: 'Consumed', width: 80 },
    {
      key: 'variance',
      label: 'Variance',
      width: 120,
      render: (v, row) => (
        <VarianceAlert allocated={row.quantityAllocated || 0} consumed={row.quantityConsumed || 0} />
      ),
    },
    {
      key: 'storageLocation',
      label: 'Storage',
      width: 130,
      render: (v) => <StorageConditionBadge location={v} />,
    },
    {
      key: 'createdAt',
      label: 'Received',
      width: 110,
      render: (v) => formatDate(v),
    },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner />
      </div>
    )
  }

  // M-2: Gate entire page content behind variance right
  if (!hasRight(Rights.ROLE_INVENTORY_VARIANCE)) {
    return (
      <div className="text-center py-10 text-slate-500">
        <p>You do not have permission to view variance reports.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Variance Reconciliation"
        subtitle="Track unconsumed sample variance for audit compliance"
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-amber-50 p-2.5">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{totalVariance}</p>
              <p className="text-xs text-slate-500">Total Unconsumed Units</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-primary-50 p-2.5">
              <Package className="h-5 w-5 text-primary-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{data.length}</p>
              <p className="text-xs text-slate-500">Items with Variance</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-rose-50 p-2.5">
              <TrendingUp className="h-5 w-5 text-rose-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{largeVariance}</p>
              <p className="text-xs text-slate-500">Large Variance (&gt; 5 units)</p>
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
      <DataTable columns={columns} data={data} />
    </div>
  )
}
