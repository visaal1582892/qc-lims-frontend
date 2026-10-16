import { useState, useEffect, useCallback } from 'react'
import { PageHeader } from '../components/layout/PageHeader'
import { DataTable } from '../components/table/DataTable'
import { Spinner } from '../components/feedback/Spinner'
import { analyticsApi } from '../api/analyticsApi'
import { Search, Calendar, Download } from 'lucide-react'

/**
 * Analytics page — multi-dimensional search & parameter summary (SRS Module 12.2).
 *
 * Two tabs:
 * 1. Multi-Dimensional Search — filterable, paginated sample table
 * 2. Parameter Summary — aggregated pass/fail/pending by parameter
 */
export function AnalyticsPage() {
  const [activeTab, setActiveTab] = useState('search')

  return (
    <div>
      <PageHeader
        title="Analytics"
        subtitle="Multi-Dimensional QC Analytics & Reporting"
      />

      {/* Tab Navigation */}
      <div className="flex gap-2 mb-6 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('search')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'search'
              ? 'border-primary-500 text-primary-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Multi-Dimensional Search
        </button>
        <button
          onClick={() => setActiveTab('summary')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'summary'
              ? 'border-primary-500 text-primary-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Parameter Summary
        </button>
      </div>

      {activeTab === 'search' && <SearchTab />}
      {activeTab === 'summary' && <SummaryTab />}
    </div>
  )
}

// --- Search Tab ---

function SearchTab() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const [page, setPage] = useState(0)
  const [size] = useState(20)

  // Filter state
  const [filters, setFilters] = useState({
    manufacturerId: '',
    batchNumber: '',
    dateFrom: '',
    dateTo: '',
    executionStatus: '',
  })

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = { page, size }
      if (filters.manufacturerId) params.manufacturerId = filters.manufacturerId
      if (filters.batchNumber) params.batchNumber = filters.batchNumber
      if (filters.dateFrom) params.dateFrom = filters.dateFrom
      if (filters.dateTo) params.dateTo = filters.dateTo
      if (filters.executionStatus) params.executionStatus = filters.executionStatus

      const res = await analyticsApi.searchSamples(params)
      const response = res.data?.data ?? res.data
      setData(response.content || [])
      setTotalPages(response.totalPages || 0)
      setTotalElements(response.totalElements || 0)
    } catch (err) {
      setError(err.message || 'Failed to load analytics data')
    } finally {
      setLoading(false)
    }
  }, [page, size, filters])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
    setPage(0)
  }

  const columns = [
    { key: 'arNumber', label: 'AR Number', width: 120 },
    { key: 'batchNo', label: 'Batch No', width: 120 },
    { key: 'arStatus', label: 'AR Status', width: 120 },
    { key: 'executionStatus', label: 'Exec Status', width: 120 },
    { key: 'parameterName', label: 'Parameter', width: 160 },
    { key: 'complianceFlag', label: 'Compliance', width: 100 },
    { key: 'analystId', label: 'Analyst', width: 80 },
    {
      key: 'receiptDate',
      label: 'Receipt Date',
      width: 120,
      render: (val) => val ? new Date(val).toLocaleDateString() : '-',
    },
    {
      key: 'submittedAt',
      label: 'Submitted',
      width: 120,
      render: (val) => val ? new Date(val).toLocaleDateString() : '-',
    },
  ]

  return (
    <div>
      {/* Filter Bar */}
      <div className="flex flex-wrap gap-3 mb-4 p-4 rounded-xl bg-slate-50 ring-1 ring-slate-200">
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-semibold uppercase text-slate-500">Manufacturer</label>
          <input
            type="number"
            placeholder="ID"
            value={filters.manufacturerId}
            onChange={(e) => handleFilterChange('manufacturerId', e.target.value)}
            className="rounded-md border border-slate-200 px-2 py-1 text-xs outline-none focus:border-primary-500 w-24"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-semibold uppercase text-slate-500">Batch No</label>
          <input
            type="text"
            placeholder="Filter..."
            value={filters.batchNumber}
            onChange={(e) => handleFilterChange('batchNumber', e.target.value)}
            className="rounded-md border border-slate-200 px-2 py-1 text-xs outline-none focus:border-primary-500 w-32"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-semibold uppercase text-slate-500">From</label>
          <input
            type="date"
            value={filters.dateFrom}
            onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
            className="rounded-md border border-slate-200 px-2 py-1 text-xs outline-none focus:border-primary-500 w-32"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-semibold uppercase text-slate-500">To</label>
          <input
            type="date"
            value={filters.dateTo}
            onChange={(e) => handleFilterChange('dateTo', e.target.value)}
            className="rounded-md border border-slate-200 px-2 py-1 text-xs outline-none focus:border-primary-500 w-32"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-semibold uppercase text-slate-500">Exec Status</label>
          <select
            value={filters.executionStatus}
            onChange={(e) => handleFilterChange('executionStatus', e.target.value)}
            className="rounded-md border border-slate-200 px-2 py-1 text-xs outline-none focus:border-primary-500 w-36"
          >
            <option value="">All</option>
            <option value="Allocated">Allocated</option>
            <option value="Testing">Testing</option>
            <option value="Hold">Hold</option>
            <option value="Under_Review">Under Review</option>
            <option value="Released">Released</option>
            <option value="Rework_Requested">Rework Requested</option>
            <option value="Cancelled_Not_Performed">Cancelled</option>
          </select>
        </div>
        <div className="flex items-end">
          <button
            onClick={fetchData}
            className="flex items-center gap-1.5 rounded-md bg-primary-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-primary-600 transition-colors"
          >
            <Search className="h-3 w-3" />
            Search
          </button>
        </div>
      </div>

      {/* Results count */}
      {totalElements > 0 && (
        <p className="text-xs text-slate-500 mb-2">
          Showing {data.length} of {totalElements} results
        </p>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-lg bg-red-50 p-4 mb-4 ring-1 ring-red-200">
          <p className="text-sm font-medium text-red-600">{error}</p>
        </div>
      )}

      {/* Data Table */}
      <DataTable columns={columns} data={data} loading={loading} />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 px-2">
          <p className="text-xs text-slate-500">
            Page {page + 1} of {totalPages}
          </p>
          <div className="flex gap-2">
            <button
              disabled={page === 0}
              onClick={() => setPage((p) => p - 1)}
              className="rounded-md border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              disabled={page >= totalPages - 1}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-md border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// --- Summary Tab ---

function SummaryTab() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    analyticsApi.summaryByParameter()
      .then((res) => {
        const response = res.data?.data ?? res.data
        setData(Array.isArray(response) ? response : [])
        setLoading(false)
      })
      .catch((err) => {
        setError(err.message || 'Failed to load summary')
        setLoading(false)
      })
  }, [])

  const columns = [
    { key: 'parameterName', label: 'Parameter', width: 200 },
    { key: 'totalTests', label: 'Total Tests', width: 100 },
    { key: 'passed', label: 'Passed', width: 80 },
    { key: 'failed', label: 'Failed', width: 80 },
    { key: 'pending', label: 'Pending', width: 80 },
  ]

  if (error) {
    return (
      <div className="rounded-lg bg-red-50 p-4 ring-1 ring-red-200">
        <p className="text-sm font-medium text-red-600">{error}</p>
      </div>
    )
  }

  return (
    <div>
      <DataTable columns={columns} data={data} loading={loading} />
    </div>
  )
}
