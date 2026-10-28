import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '../auth/useAuth'
import { mastersApi } from '../api/masters'
import { Rights } from '../constants/rights'
import BulkUploadModal from '../components/masters/BulkUploadModal'
import Icon from '../components/Icon'
import Pagination from '../components/Pagination'
import BackToMaster from '../components/admin/BackToMaster'
import MasterPageLayout, {
  FilterInput, FilterSelect, StatusPill, TableStatusRow,
  MasterTableHeader, MasterHeaderRow, MasterFilterRow,
} from '../components/MasterPageLayout'
import useDebounce from '../hooks/useDebounce'

export default function MetricsPage() {
  const { hasRight } = useAuth()
  const PAGE_SIZE = 20

  const [items, setItems] = useState([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [refreshSeed, setRefreshSeed] = useState(0)
  const [showUpload, setShowUpload] = useState(false)

  // Column filters
  const [fId, setFId] = useState('')
  const [fMetricName, setFMetricName] = useState('')
  const [fUnit, setFUnit] = useState('')
  const [fStatus, setFStatus] = useState('all')

  const dId = useDebounce(fId, 400)
  const dMetricName = useDebounce(fMetricName, 400)
  const dUnit = useDebounce(fUnit, 400)

  // Reset to page 0 when debounced filters or status change
  useEffect(() => { setPage(0) }, [dId, dMetricName, dUnit, fStatus]) // eslint-disable-line react-hooks/exhaustive-deps

  const fetchItems = useCallback(async () => {
    setLoading(true)
    try {
      const res = await mastersApi.getMetrics({
        page,
        size: PAGE_SIZE,
        sort: 'updatedAt,desc',
        id: dId || undefined,
        metricName: dMetricName || undefined,
        unit: dUnit || undefined,
        status: fStatus !== 'all' ? fStatus : undefined,
        includeInactive: fStatus === 'all' ? true : undefined,
      })
      if (res.data) {
        setItems(res.data.content || [])
        setTotalPages(res.data.totalPages ?? res.data.page?.totalPages ?? 0)
        setTotal(res.data.totalElements ?? res.data.page?.totalElements ?? 0)
      }
    } catch (err) {
      console.error('Failed to load metrics:', err)
    } finally {
      setLoading(false)
    }
  }, [page, dId, dMetricName, dUnit, fStatus, refreshSeed])

  useEffect(() => { fetchItems() }, [fetchItems])

  const handleUpload = async (file) => {
    const res = await mastersApi.uploadMetrics(file)
    return res.data
  }

  const handleDownloadTemplate = async () => {
    try {
      const res = await mastersApi.downloadMetricTemplate()
      const url = window.URL.createObjectURL(res.data)
      const a = document.createElement('a')
      a.href = url
      a.download = 'metrics_template.xlsx'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Template download failed:', err)
    }
  }

  const canUpload = hasRight(Rights.ROLE_METRIC_UPLOAD) || hasRight(Rights.ROLE_MASTER_DATA_CREATE)

  return (
    <div className="mx-auto flex h-full min-h-0 w-full flex-1 flex-col gap-3">
      <BackToMaster className="shrink-0" />

      {/* Header */}
      <header className="shrink-0 flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg
                           bg-brand-50 text-brand-600 ring-1 ring-brand-100">
            <Icon name="scale" className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <h1 className="truncate text-lg font-semibold text-slate-900">Metrics</h1>
            <p className="text-xs text-slate-500">{total} record{total === 1 ? '' : 's'} total</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {canUpload && (
            <>
              <button
                onClick={handleDownloadTemplate}
                className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3.5 py-2
                           text-sm font-semibold text-slate-700 shadow-sm transition
                           hover:bg-slate-50 active:scale-[0.98]"
              >
                <Icon name="download" className="h-4 w-4" />
                Download Template
              </button>
              <button
                onClick={() => setShowUpload(true)}
                className="inline-flex items-center gap-1.5 rounded-md bg-brand-600 px-3.5 py-2
                           text-sm font-semibold text-white shadow-sm transition
                           hover:bg-brand-700 active:scale-[0.98]"
              >
                <Icon name="upload" className="h-4 w-4" />
                Upload Excel
              </button>
            </>
          )}
        </div>
      </header>

      {/* Table card — fills remaining vertical space */}
      <MasterPageLayout>
        <div className="hidden flex-1 min-h-0 overflow-auto sm:block">
          <table className="w-full min-w-full text-sm">
            <MasterTableHeader>
              <MasterHeaderRow>
                <th className="w-24 px-4 py-2.5">ID</th>
                <th className="px-4 py-2.5">Metric Name</th>
                <th className="px-4 py-2.5">Unit</th>
                <th className="w-28 px-4 py-2.5">Status</th>
              </MasterHeaderRow>
              <MasterFilterRow>
                <th className="px-4 py-2">
                  <FilterInput value={fId} onChange={setFId} placeholder="Filter ID…" />
                </th>
                <th className="px-4 py-2">
                  <FilterInput value={fMetricName} onChange={setFMetricName} placeholder="Search metric name…" icon="search" />
                </th>
                <th className="px-4 py-2">
                  <FilterInput value={fUnit} onChange={setFUnit} placeholder="Search unit…" icon="search" />
                </th>
                <th className="px-4 py-2">
                  <FilterSelect value={fStatus} onChange={setFStatus}
                    options={[['all', 'All'], ['active', 'Active'], ['inactive', 'Inactive']]} />
                </th>
              </MasterFilterRow>
            </MasterTableHeader>
            <tbody className="divide-y divide-slate-100 bg-white">
              {loading ? (
                <TableStatusRow colSpan={4}>Loading…</TableStatusRow>
              ) : items.length === 0 ? (
                <TableStatusRow colSpan={4}>No matching records.</TableStatusRow>
              ) : (
                items.map((item) => (
                  <MetricRow key={item.id} item={item} />
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile */}
        <div className="block flex-1 min-h-0 overflow-y-auto sm:hidden">
          <div className="space-y-2 p-3">
            <FilterInput value={fMetricName} onChange={setFMetricName} placeholder="Search metric name…" icon="search" />
            <div className="grid grid-cols-2 gap-2">
              <FilterInput value={fId} onChange={setFId} placeholder="Filter ID…" />
              <FilterSelect value={fStatus} onChange={setFStatus}
                options={[['all', 'All'], ['active', 'Active'], ['inactive', 'Inactive']]} />
            </div>
          </div>
          {loading ? (
            <div className="px-4 py-12 text-center text-sm text-slate-500">Loading…</div>
          ) : items.length === 0 ? (
            <div className="px-4 py-12 text-center text-sm text-slate-500">No matching records.</div>
          ) : (
            items.map((item) => (
              <div key={item.id} className="flex items-start justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs text-slate-500">#{item.id}</span>
                    <span className="font-medium text-slate-800">{item.metricName || item.name}</span>
                  </div>
                  {(item.unit || item.subName) && (
                    <div className="text-xs text-slate-500">{item.unit || item.subName}</div>
                  )}
                  <div className="mt-1.5">
                    <StatusPill active={isItemActive(item)} />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination — pinned at bottom */}
        <div className="shrink-0 border-t border-slate-100 bg-white px-4 py-1">
          <Pagination page={page} totalPages={totalPages} totalElements={total}
            pageSize={PAGE_SIZE} onPageChange={setPage} loading={loading} />
        </div>
      </MasterPageLayout>

      {/* Upload Modal */}
      <BulkUploadModal
        open={showUpload}
        onClose={() => setShowUpload(false)}
        onUpload={handleUpload}
        onSuccess={() => setRefreshSeed((s) => s + 1)}
        title="Upload Metrics"
        description="Download the template, fill in metrics, and upload."
        fileName="metrics_errors.xlsx"
      />
    </div>
  )
}

/* ---------------- helpers ---------------- */

function isItemActive(item) {
  return item.status === 'ACTIVE' || item.status === 'A'
}

function MetricRow({ item }) {
  const active = isItemActive(item)
  return (
    <tr className={`transition hover:bg-slate-50/60 ${!active ? 'bg-slate-50/50 opacity-75' : ''}`}>
      <td className="px-4 py-2.5 font-mono text-xs text-slate-600">{item.id}</td>
      <td className={`px-4 py-2.5 font-medium text-slate-800 ${!active ? 'line-through text-slate-400' : ''}`}>
        {item.metricName || item.name}
      </td>
      <td className={`px-4 py-2.5 text-slate-600 ${!active ? 'line-through text-slate-400' : ''}`}>
        {item.unit || item.subName || '-'}
      </td>
      <td className="px-4 py-2.5"><StatusPill active={active} /></td>
    </tr>
  )
}
