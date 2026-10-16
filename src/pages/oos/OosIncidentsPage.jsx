/**
 * OosIncidentsPage — OOS Incident list and management page.
 *
 * Displays OOS incidents with status/disposition filters, authorize retest,
 * complete retest, and reject batch actions.
 *
 * SRS Module 8: OOS Management.
 */
import { useState, useCallback, useEffect } from 'react'
import { AlertTriangle, RefreshCw, Search } from 'lucide-react'
import { PageHeader } from '../../components/layout/PageHeader'
import { DataTable } from '../../components/table/DataTable'
import { oosApi } from '../../api/oosApi'

// Status and disposition filter options
const statusFilters = [
  { label: 'All', value: '' },
  { label: 'Pending', value: 'Pending' },
  { label: 'Investigating', value: 'Investigating' },
  { label: 'Resolved', value: 'Resolved' },
  { label: 'Escalated', value: 'Escalated' },
]

const dispositionFilters = [
  { label: 'All', value: '' },
  { label: 'Pending', value: 'Pending' },
  { label: 'Retest_Authorized', value: 'Retest_Authorized' },
  { label: 'Retest_Passed', value: 'Retest_Passed' },
  { label: 'Batch_Rejected', value: 'Batch_Rejected' },
]

// Status badge colors
const statusColor = (status) => {
  switch (status) {
    case 'Pending': return 'warning'
    case 'Investigating': return 'info'
    case 'Resolved': return 'success'
    case 'Escalated': return 'danger'
    default: return 'default'
  }
}

const dispositionColor = (d) => {
  switch (d) {
    case 'Pending': return 'warning'
    case 'Retest_Authorized': return 'info'
    case 'Retest_Passed': return 'success'
    case 'Batch_Rejected': return 'danger'
    default: return 'default'
  }
}

export function OosIncidentsPage() {
  const [incidents, setIncidents] = useState([])
  const [filteredIncidents, setFilteredIncidents] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [dispositionFilter, setDispositionFilter] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [toast, setToast] = useState(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await oosApi.listOosIncidents().catch(() => ({ data: [] }))
      const pageData = res.data?.data ?? {}
      const data = pageData.content ?? pageData.items ?? pageData ?? []
      setIncidents(data)
      setFilteredIncidents(data)
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
    let result = incidents
    if (statusFilter) {
      result = result.filter((i) => i.oosStatus === statusFilter)
    }
    if (dispositionFilter) {
      result = result.filter((i) => i.finalDisposition === dispositionFilter)
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      result = result.filter(
        (i) =>
          (i.incidentNumber || '').toLowerCase().includes(q) ||
          (i.arNumber || '').toLowerCase().includes(q) ||
          (i.productName || '').toLowerCase().includes(q)
      )
    }
    setFilteredIncidents(result)
  }, [incidents, statusFilter, dispositionFilter, searchQuery])

  const showToast = (message) => {
    setToast({ message, visible: true })
    setTimeout(() => setToast(null), 3000)
  }

  const columns = [
    { key: 'incidentNumber', label: 'Incident No.', sortable: true },
    { key: 'arNumber', label: 'AR Number', sortable: true },
    { key: 'productName', label: 'Product', sortable: true },
    { key: 'batchNo', label: 'Batch No.' },
    { key: 'testCode', label: 'Test Code' },
    {
      key: 'oosStatus',
      label: 'Status',
      render: (val) => <Badge variant={statusColor(val)}>{val}</Badge>,
    },
    {
      key: 'finalDisposition',
      label: 'Disposition',
      render: (val) => <Badge variant={dispositionColor(val)}>{val}</Badge>,
    },
    { key: 'retestAttemptCount', label: 'Retest #', sortable: true },
    {
      key: 'actions',
      label: 'Actions',
      render: (_val, row) => (
        <ActionCell incident={row} onRefresh={fetchData} onToast={showToast} />
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="OOS Incidents"
        description="Out-of-specification incident management and resolution"
        icon={AlertTriangle}
        action={
          <button onClick={fetchData} className="btn btn-sm btn-secondary" title="Refresh">
            <RefreshCw className="h-4 w-4" />
          </button>
        }
      />

      {/* Filters */}
      <div className="card p-4 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by incident, AR number, or product..."
            className="input pl-9 w-full"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <select className="select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          {statusFilters.map((f) => (
            <option key={f.value} value={f.value}>{f.label}</option>
          ))}
        </select>
        <select className="select" value={dispositionFilter} onChange={(e) => setDispositionFilter(e.target.value)}>
          {dispositionFilters.map((f) => (
            <option key={f.value} value={f.value}>{f.label}</option>
          ))}
        </select>
        <span className="text-sm text-muted-foreground">
          {filteredIncidents.length} incident{filteredIncidents.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={filteredIncidents}
        loading={loading}
        emptyMessage="No OOS incidents found"
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
    info: 'bg-blue-100 text-blue-800',
    success: 'bg-green-100 text-green-800',
    danger: 'bg-red-100 text-red-800',
    default: 'bg-gray-100 text-gray-800',
  }
  return (
    <span className={`badge ${colors[variant] || colors.default}`}>
      {children}
    </span>
  )
}

function ActionCell({ incident, onRefresh, onToast }) {
  const authorizeRetest = async () => {
    if (!confirm(`Authorize retest for ${incident.incidentNumber}?`)) return
    try {
      await oosApi.authorizeRetest(incident.id, { investigationSummary: 'Retest authorized' })
      onToast(`Retest authorized for ${incident.incidentNumber}`)
      onRefresh()
    } catch (e) {
      onToast(`Failed: ${e.message || 'Unknown error'}`)
    }
  }

  const completeRetest = async () => {
    const result = prompt('Enter revised result value:')
    if (!result) return
    try {
      await oosApi.completeRetest(incident.id, { revisedResult: result })
      onToast(`Retest completed for ${incident.incidentNumber}`)
      onRefresh()
    } catch (e) {
      onToast(`Failed: ${e.message || 'Unknown error'}`)
    }
  }

  const rejectBatch = async () => {
    if (!confirm(`Reject batch for ${incident.incidentNumber}? This is irreversible.`)) return
    try {
      await oosApi.rejectBatch(incident.id, { investigationSummary: 'Batch rejected after investigation' })
      onToast(`Batch rejected for ${incident.incidentNumber}`)
      onRefresh()
    } catch (e) {
      onToast(`Failed: ${e.message || 'Unknown error'}`)
    }
  }

  return (
    <div className="flex gap-1">
      {incident.finalDisposition === 'Pending' && (
        <button className="btn btn-xs btn-primary" onClick={authorizeRetest}>Authorize Retest</button>
      )}
      {incident.finalDisposition === 'Retest_Authorized' && (
        <>
          <button className="btn btn-xs btn-success" onClick={completeRetest}>Complete</button>
          <button className="btn btn-xs btn-error" onClick={rejectBatch}>Reject Batch</button>
        </>
      )}
      {incident.finalDisposition && ['Retest_Passed', 'Batch_Rejected'].includes(incident.finalDisposition) && (
        <span className="text-xs text-muted-foreground">Resolved</span>
      )}
    </div>
  )
}
