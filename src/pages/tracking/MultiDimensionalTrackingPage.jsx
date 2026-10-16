import { useState, useEffect, useCallback } from 'react'
import { PageHeader } from '../../components/layout/PageHeader'
import { DataTable } from '../../components/table/DataTable'
import { Spinner } from '../../components/feedback/Spinner'
import { ProductivityTable } from '../dashboard/components/ProductivityTable'
import { dashboardApi } from '../../api/dashboardApi'
import { Search } from 'lucide-react'

/**
 * Multi-Dimensional Tracking page (SRS Module 12.2).
 *
 * Provides:
 * - Tabbed interface (Tracking, Manufacturer, Analyst, Parameter, Status)
 * - Multi-dimensional search with filters
 * - Paginated results table
 * - Manufacturer-wise, analyst productivity, parameter analytics views
 */
export function MultiDimensionalTrackingPage() {
  const [activeTab, setActiveTab] = useState('tracking')

  const tabs = [
    { key: 'tracking', label: 'Date/Batch Tracking' },
    { key: 'manufacturer', label: 'Manufacturer' },
    { key: 'analyst', label: 'Analyst Productivity' },
    { key: 'parameter', label: 'Parameter Analytics' },
    { key: 'status', label: 'Status Filter' },
  ]

  return (
    <div>
      <PageHeader
        title="Multi-Dimensional Tracking"
        subtitle="Search, filter, and analyze QC sample data across multiple dimensions"
      />

      {/* Tab Navigation */}
      <div className="flex gap-2 mb-6 border-b border-slate-200 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === tab.key
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'tracking' && <TrackingTab />}
      {activeTab === 'manufacturer' && <ManufacturerTab />}
      {activeTab === 'analyst' && <AnalystTab />}
      {activeTab === 'parameter' && <ParameterTab />}
      {activeTab === 'status' && <StatusTab />}
    </div>
  )
}

// --- Tracking Tab (date/batch) ---

function TrackingTab() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    batchNumber: '',
  })

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = {}
      if (filters.dateFrom) params.startDate = filters.dateFrom
      if (filters.dateTo) params.endDate = filters.dateTo
      if (filters.batchNumber) params.batchNo = filters.batchNumber

      const res = await dashboardApi.getDateBatchTracking(params)
      const response = res.data?.data ?? res.data
      setData(Array.isArray(response) ? response : [])
    } catch (err) {
      setError(err.message || 'Failed to load tracking data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  const handleReset = () => {
    setFilters({ dateFrom: '', dateTo: '', batchNumber: '' })
  }

  const columns = [
    { key: 'arNumber', label: 'AR Number', width: 120 },
    { key: 'batchNo', label: 'Batch No', width: 120 },
    { key: 'arStatus', label: 'AR Status', width: 120 },
    { key: 'trfStatus', label: 'TRF Status', width: 120 },
    { key: 'productName', label: 'Product', width: 160 },
    { key: 'manufacturerName', label: 'Manufacturer', width: 120 },
  ]

  return (
    <div>
      <div className="flex flex-wrap gap-3 mb-4 p-4 rounded-xl bg-slate-50 ring-1 ring-slate-200">
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
        <div className="flex items-end gap-2">
          <button
            onClick={fetchData}
            className="flex items-center gap-1.5 rounded-md bg-primary-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-primary-600 transition-colors"
          >
            <Search className="h-3 w-3" />
            Search
          </button>
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 rounded-md border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
          >
            Reset
          </button>
        </div>
      </div>

      {data.length > 0 && (
        <p className="text-xs text-slate-500 mb-2">
          Found {data.length} matching samples
        </p>
      )}

      {error && (
        <div className="rounded-lg bg-red-50 p-4 mb-4 ring-1 ring-red-200">
          <p className="text-sm font-medium text-red-600">{error}</p>
        </div>
      )}

      <DataTable columns={columns} data={data} loading={loading} />
    </div>
  )
}

// --- Manufacturer Tab ---

function ManufacturerTab() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [manufacturerId, setManufacturerId] = useState('')

  const fetchData = useCallback(async () => {
    if (!manufacturerId) {
      setData([])
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await dashboardApi.getManufacturerWise(parseInt(manufacturerId, 10))
      const response = res.data?.data ?? res.data
      setData(Array.isArray(response) ? response : [])
    } catch (err) {
      setError(err.message || 'Failed to load manufacturer data')
    } finally {
      setLoading(false)
    }
  }, [manufacturerId])

  const columns = [
    { key: 'arNumber', label: 'AR Number', width: 120 },
    { key: 'batchNo', label: 'Batch No', width: 120 },
    { key: 'arStatus', label: 'AR Status', width: 120 },
    { key: 'trfStatus', label: 'TRF Status', width: 120 },
    { key: 'productName', label: 'Product', width: 160 },
    { key: 'manufacturerName', label: 'Manufacturer', width: 120 },
  ]

  return (
    <div>
      <div className="flex gap-3 mb-4 p-4 rounded-xl bg-slate-50 ring-1 ring-slate-200">
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-semibold uppercase text-slate-500">Manufacturer ID</label>
          <input
            type="number"
            placeholder="Enter ID..."
            value={manufacturerId}
            onChange={(e) => setManufacturerId(e.target.value)}
            className="rounded-md border border-slate-200 px-2 py-1 text-xs outline-none focus:border-primary-500 w-32"
          />
        </div>
        <button
          onClick={fetchData}
          className="flex items-center gap-1.5 rounded-md bg-primary-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-primary-600 transition-colors self-end"
        >
          <Search className="h-3 w-3" />
          Search
        </button>
      </div>

      {data.length > 0 && (
        <p className="text-xs text-slate-500 mb-2">
          Found {data.length} samples for this manufacturer
        </p>
      )}

      {error && (
        <div className="rounded-lg bg-red-50 p-4 mb-4 ring-1 ring-red-200">
          <p className="text-sm font-medium text-red-600">{error}</p>
        </div>
      )}

      <DataTable columns={columns} data={data} loading={loading} />
    </div>
  )
}

// --- Analyst Tab ---

function AnalystTab() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [analystId, setAnalystId] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const fetchData = useCallback(async () => {
    if (!analystId) {
      setData([])
      return
    }
    setLoading(true)
    setError(null)
    try {
      const params = {}
      if (dateFrom) params.startDate = dateFrom
      if (dateTo) params.endDate = dateTo

      const res = await dashboardApi.getAnalystProductivity(parseInt(analystId, 10), params)
      const response = res.data?.data ?? res.data
      setData([response])
    } catch (err) {
      setError(err.message || 'Failed to load analyst data')
    } finally {
      setLoading(false)
    }
  }, [analystId, dateFrom, dateTo])

  return (
    <div>
      <div className="flex flex-wrap gap-3 mb-4 p-4 rounded-xl bg-slate-50 ring-1 ring-slate-200">
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-semibold uppercase text-slate-500">Analyst ID</label>
          <input
            type="number"
            placeholder="Enter ID..."
            value={analystId}
            onChange={(e) => setAnalystId(e.target.value)}
            className="rounded-md border border-slate-200 px-2 py-1 text-xs outline-none focus:border-primary-500 w-32"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-semibold uppercase text-slate-500">From</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="rounded-md border border-slate-200 px-2 py-1 text-xs outline-none focus:border-primary-500 w-32"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-semibold uppercase text-slate-500">To</label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="rounded-md border border-slate-200 px-2 py-1 text-xs outline-none focus:border-primary-500 w-32"
          />
        </div>
        <button
          onClick={fetchData}
          className="flex items-center gap-1.5 rounded-md bg-primary-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-primary-600 transition-colors self-end"
        >
          <Search className="h-3 w-3" />
          Search
        </button>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 p-4 mb-4 ring-1 ring-red-200">
          <p className="text-sm font-medium text-red-600">{error}</p>
        </div>
      )}

      <ProductivityTable data={data} loading={loading} />
    </div>
  )
}

// --- Parameter Tab ---

function ParameterTab() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [parameterId, setParameterId] = useState('')

  const fetchData = useCallback(async () => {
    if (!parameterId) {
      setData(null)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await dashboardApi.getParameterAnalytics(parseInt(parameterId, 10))
      setData(res.data?.data ?? res.data)
    } catch (err) {
      setError(err.message || 'Failed to load parameter analytics')
    } finally {
      setLoading(false)
    }
  }, [parameterId])

  return (
    <div>
      <div className="flex gap-3 mb-4 p-4 rounded-xl bg-slate-50 ring-1 ring-slate-200">
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-semibold uppercase text-slate-500">Parameter ID</label>
          <input
            type="number"
            placeholder="Enter ID..."
            value={parameterId}
            onChange={(e) => setParameterId(e.target.value)}
            className="rounded-md border border-slate-200 px-2 py-1 text-xs outline-none focus:border-primary-500 w-32"
          />
        </div>
        <button
          onClick={fetchData}
          className="flex items-center gap-1.5 rounded-md bg-primary-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-primary-600 transition-colors self-end"
        >
          <Search className="h-3 w-3" />
          Search
        </button>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 p-4 mb-4 ring-1 ring-red-200">
          <p className="text-sm font-medium text-red-600">{error}</p>
        </div>
      )}

      {loading && !data ? (
        <div className="flex items-center justify-center py-8">
          <Spinner />
        </div>
      ) : data ? (
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-900/5">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">
            Parameter Analytics: {data.parameterName || 'Unknown'}
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { label: 'Total Tests', value: data.totalTests, color: 'text-slate-900' },
              { label: 'Passed', value: data.passed, color: 'text-emerald-600' },
              { label: 'Failed', value: data.failed, color: 'text-red-600' },
              { label: 'Pending', value: data.pending, color: 'text-amber-600' },
              { label: 'On Hold', value: data.hold, color: 'text-orange-600' },
            ].map((item) => (
              <div key={item.label} className="rounded-xl bg-slate-50 p-3 text-center ring-1 ring-slate-200">
                <div className={`text-2xl font-bold ${item.color}`}>{item.value ?? 0}</div>
                <div className="text-[10px] font-medium text-slate-400 mt-1">{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-900/5">
          <p className="text-xs text-slate-400 text-center">Enter a Parameter ID to view analytics</p>
        </div>
      )}
    </div>
  )
}

// --- Status Tab ---

function StatusTab() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [status, setStatus] = useState('')

  const arStatuses = [
    { value: 'REGISTERED', label: 'Registered' },
    { value: 'IN_PROGRESS', label: 'In Progress' },
    { value: 'ALL_TESTS_COMPLETE', label: 'All Tests Complete' },
    { value: 'COMPLETED', label: 'Completed' },
    { value: 'CANCELLED', label: 'Cancelled' },
    { value: 'FOR_INFORMATION', label: 'For Information' },
    { value: 'REJECTED', label: 'Rejected' },
  ]

  const fetchData = useCallback(async () => {
    if (!status) {
      setData([])
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await dashboardApi.getStatusFiltering(status)
      setData(Array.isArray(res.data?.data ?? res.data) ? (res.data?.data ?? res.data) : [])
    } catch (err) {
      setError(err.message || 'Failed to load status data')
    } finally {
      setLoading(false)
    }
  }, [status])

  const columns = [
    { key: 'statusName', label: 'Status', width: 160 },
    { key: 'count', label: 'Count', width: 100, render: (v) => (
      <span className="font-semibold text-slate-900">{v}</span>
    )},
  ]

  return (
    <div>
      <div className="flex gap-3 mb-4 p-4 rounded-xl bg-slate-50 ring-1 ring-slate-200">
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-semibold uppercase text-slate-500">AR Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="rounded-md border border-slate-200 px-2 py-1 text-xs outline-none focus:border-primary-500 w-40"
          >
            <option value="">Select status...</option>
            {arStatuses.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>
        <button
          onClick={fetchData}
          className="flex items-center gap-1.5 rounded-md bg-primary-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-primary-600 transition-colors self-end"
        >
          <Search className="h-3 w-3" />
          Search
        </button>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 p-4 mb-4 ring-1 ring-red-200">
          <p className="text-sm font-medium text-red-600">{error}</p>
        </div>
      )}

      <DataTable columns={columns} data={data} loading={loading} />
    </div>
  )
}
