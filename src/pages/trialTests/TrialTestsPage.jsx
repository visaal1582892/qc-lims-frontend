/**
 * TrialTestsPage — For Information / Trial Test management page.
 *
 * Displays ARs marked as For_Information, with actions to generate fresh ARs.
 *
 * SRS Module 9: Trial Test / For Information.
 */
import { useState, useCallback, useEffect } from 'react'
import { RotateCcw, RefreshCw, Search } from 'lucide-react'
import { PageHeader } from '../../components/layout/PageHeader'
import { DataTable } from '../../components/table/DataTable'
import { oosApi } from '../../api/oosApi'
import { inwardApi } from '../../api/inwardApi'

export function TrialTestsPage() {
  const [ars, setArs] = useState([])
  const [filteredArs, setFilteredArs] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [toast, setToast] = useState(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await inwardApi.getAll().catch(() => ({ data: [] }))
      const data = (res.data || []).map((item) => item.data ?? item) ?? []
      // Filter to only FOR_INFORMATION and related ARs
      const forInfoArs = data.filter((a) =>
        a.arStatus === 'FOR_INFORMATION' || a.linkedForInfoArNumber
      )
      setArs(forInfoArs)
      setFilteredArs(forInfoArs)
    } catch {
      // Handled by API client
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  useEffect(() => {
    let result = ars
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      result = result.filter(
        (a) =>
          (a.arNumber || '').toLowerCase().includes(q) ||
          (a.productName || '').toLowerCase().includes(q) ||
          (a.batchNo || '').toLowerCase().includes(q)
      )
    }
    setFilteredArs(result)
  }, [ars, searchQuery])

  const showToast = (message) => {
    setToast({ message, visible: true })
    setTimeout(() => setToast(null), 3000)
  }

  const handleMarkForInformation = async (arNumber) => {
    const reason = prompt(`Mark AR ${arNumber} as For_Information?\nEnter reason:`)
    if (!reason) return
    try {
      await oosApi.markForInformation(arNumber, reason)
      showToast(`AR ${arNumber} marked as For_Information`)
      fetchData()
    } catch (e) {
      showToast(`Failed: ${e.message || 'Unknown error'}`)
    }
  }

  const handleGenerateFreshAr = async (arNumber) => {
    if (!confirm(`Generate a fresh AR from ${arNumber}?`)) return
    try {
      await oosApi.generateFreshAr(arNumber)
      showToast(`Fresh AR generated from ${arNumber}`)
      fetchData()
    } catch (e) {
      showToast(`Failed: ${e.message || 'Unknown error'}`)
    }
  }

  const columns = [
    { key: 'arNumber', label: 'AR Number', sortable: true },
    { key: 'productName', label: 'Product', sortable: true },
    { key: 'batchNo', label: 'Batch No.' },
    {
      key: 'arStatus',
      label: 'Status',
      render: (val) => {
        const variant = val === 'FOR_INFORMATION' ? 'warning' : val === 'COMPLETED' ? 'success' : 'default'
        return <Badge variant={variant}>{val}</Badge>
      },
    },
    {
      key: 'linkedForInfoArNumber',
      label: 'Linked To',
      render: (val) => val || '—',
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_val, row) => (
        <ActionCell ar={row} onToast={showToast} onRefresh={fetchData} />
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Trial Tests"
        description="For Information ARs and fresh analysis management"
        icon={RotateCcw}
        action={
          <button onClick={fetchData} className="btn btn-sm btn-secondary" title="Refresh">
            <RefreshCw className="h-4 w-4" />
          </button>
        }
      />

      {/* Search */}
      <div className="card p-4 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by AR number, product, or batch..."
            className="input pl-9 w-full"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <span className="text-sm text-muted-foreground">
          {filteredArs.length} AR{filteredArs.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={filteredArs}
        loading={loading}
        emptyMessage="No For_Information or trial test ARs found"
      />

      {/* Toast */}
      {toast && (
        <div className="toast toast-success">
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  )
}

/* --- Sub-components --- */

function Badge({ variant, children }) {
  const colors = {
    warning: 'bg-amber-100 text-amber-800',
    success: 'bg-green-100 text-green-800',
    default: 'bg-gray-100 text-gray-800',
  }
  return (
    <span className={`badge ${colors[variant] || colors.default}`}>
      {children}
    </span>
  )
}

function ActionCell({ ar, onToast, onRefresh }) {
  const handleGenerate = async () => {
    if (!confirm(`Generate a fresh AR from ${ar.arNumber}?`)) return
    try {
      await oosApi.generateFreshAr(ar.arNumber)
      onToast(`Fresh AR generated from ${ar.arNumber}`)
      onRefresh()
    } catch (e) {
      onToast(`Failed: ${e.message || 'Unknown error'}`)
    }
  }

  return (
    <div className="flex gap-1">
      {ar.arStatus === 'FOR_INFORMATION' && (
        <button
          className="btn btn-xs btn-primary"
          onClick={handleGenerate}
        >
          Generate Fresh AR
        </button>
      )}
      {ar.linkedForInfoArNumber && (
        <span className="text-xs text-muted-foreground">
          Linked: {ar.linkedForInfoArNumber}
        </span>
      )}
    </div>
  )
}
