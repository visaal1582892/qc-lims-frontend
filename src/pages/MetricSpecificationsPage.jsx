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

export default function MetricSpecificationsPage() {
  const { hasRight } = useAuth()
  const PAGE_SIZE = 20

  const [items, setItems]                = useState([])
  const [total, setTotal]                = useState(0)
  const [totalPages, setTotalPages]      = useState(0)
  const [loading, setLoading]            = useState(true)
  const [page, setPage]                  = useState(0)
  const [refreshSeed, setRefreshSeed]    = useState(0)
  const [showUpload, setShowUpload]      = useState(false)

  // Column filters
  const [fId, setFId]                     = useState('')
  const [fConfigId, setConfigId]          = useState('')
  const [fProductId, setProductId]        = useState('')
  const [fMetricName, setMetricName]      = useState('')
  const [fUnit, setUnit]                  = useState('')
  const [fStatus, setFStatus]             = useState('all')

  const dId         = useDebounce(fId,         400)
  const dConfigId   = useDebounce(fConfigId,   400)
  const dProductId  = useDebounce(fProductId,  400)
  const dMetricName = useDebounce(fMetricName, 400)
  const dUnit       = useDebounce(fUnit,       400)

  useEffect(() => { setPage(0) }, [dId, dConfigId, dProductId, dMetricName, dUnit, fStatus]) // eslint-disable-line react-hooks/exhaustive-deps

  const fetchItems = useCallback(async () => {
    setLoading(true)
    try {
      const res = await mastersApi.getMetricSpecifications({
        page,
        size: PAGE_SIZE,
        sort: 'updatedAt,desc',
        id: dId || undefined,
        configId: dConfigId || undefined,
        productId: dProductId || undefined,
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
      console.error('Failed to load metric specifications:', err)
    } finally {
      setLoading(false)
    }
  }, [page, dId, dConfigId, dProductId, dMetricName, dUnit, fStatus, refreshSeed])

  useEffect(() => { fetchItems() }, [fetchItems])

  const handleUpload = async (file) => {
    const res = await mastersApi.uploadMetricSpecifications(file)
    return res.data
  }

  const handleDownloadTemplate = async () => {
    try {
      const res = await mastersApi.downloadMetricSpecificationTemplate()
      const url = window.URL.createObjectURL(res.data)
      const a = document.createElement('a')
      a.href = url; a.download = 'metric_specifications_template.xlsx'
      document.body.appendChild(a); a.click(); document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Template download failed:', err)
    }
  }

  const canUpload = hasRight(Rights.ROLE_METRIC_SPECIFICATION_UPLOAD) || hasRight(Rights.ROLE_MASTER_DATA_CREATE)

  return (
    <div className="mx-auto flex h-full min-h-0 w-full flex-1 flex-col gap-3">
      <BackToMaster className="shrink-0" />

      <header className="shrink-0 flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg
                           bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100">
            <Icon name="slidersHorizontal" className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <h1 className="truncate text-lg font-semibold text-slate-900">Metric Specifications</h1>
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

      <MasterPageLayout>
        <div className="hidden flex-1 min-h-0 overflow-auto sm:block">
          <table className="w-full min-w-full text-sm">
            <MasterTableHeader>
              <MasterHeaderRow>
                <th className="w-20 px-3 py-2.5">ID</th>
                <th className="w-24 px-3 py-2.5">Config ID</th>
                <th className="px-3 py-2.5">Product ID</th>
                <th className="px-3 py-2.5">Parameter</th>
                <th className="px-3 py-2.5">Metric Name</th>
                <th className="px-3 py-2.5">Unit</th>
                <th className="w-28 px-3 py-2.5 text-right">Lower Bound</th>
                <th className="w-28 px-3 py-2.5 text-right">Upper Bound</th>
                <th className="w-24 px-3 py-2.5">Status</th>
              </MasterHeaderRow>
              <MasterFilterRow>
                <th className="px-3 py-2">
                  <FilterInput value={fId} onChange={setFId} placeholder="Filter ID…" />
                </th>
                <th className="px-3 py-2">
                  <FilterInput value={fConfigId} onChange={setConfigId} placeholder="Filter Config…" />
                </th>
                <th className="px-3 py-2">
                  <FilterInput value={fProductId} onChange={setProductId} placeholder="Filter Product…" icon="search" />
                </th>
                <th />
                <th className="px-3 py-2">
                  <FilterInput value={fMetricName} onChange={setMetricName} placeholder="Search metric…" icon="search" />
                </th>
                <th className="px-3 py-2">
                  <FilterInput value={fUnit} onChange={setUnit} placeholder="Search unit…" icon="search" />
                </th>
                <th />
                <th />
                <th className="px-3 py-2">
                  <FilterSelect value={fStatus} onChange={setFStatus}
                    options={[['all','All'],['active','Active'],['inactive','Inactive']]} />
                </th>
              </MasterFilterRow>
            </MasterTableHeader>
            <tbody className="divide-y divide-slate-100 bg-white">
              {loading ? (
                <TableStatusRow colSpan={9}>Loading…</TableStatusRow>
              ) : items.length === 0 ? (
                <TableStatusRow colSpan={9}>No matching records.</TableStatusRow>
              ) : (
                items.map((item) => (
                  <MetricSpecRow key={item.id} item={item} />
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile */}
        <div className="block flex-1 min-h-0 overflow-y-auto sm:hidden">
          <div className="space-y-2 p-3">
            <FilterInput value={fProductId} onChange={setProductId} placeholder="Search Product ID…" icon="search" />
            <div className="grid grid-cols-2 gap-2">
              <FilterInput value={fMetricName} onChange={setMetricName} placeholder="Search metric…" icon="search" />
              <FilterInput value={fUnit} onChange={setUnit} placeholder="Search unit…" icon="search" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <FilterInput value={fId} onChange={setFId} placeholder="Filter ID…" />
              <FilterSelect value={fStatus} onChange={setFStatus}
                options={[['all','All'],['active','Active'],['inactive','Inactive']]} />
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
                    <span className="font-mono text-xs text-slate-500">#{item.id} (Cfg: {item.inventoryConfiguration?.id})</span>
                    <span className="font-medium text-slate-800">{item.inventoryConfiguration?.productId || '-'}</span>
                    <span className="text-xs text-slate-600">{item.inventoryConfiguration?.testParameter?.name || '-'}</span>
                  </div>
                  <div className="mt-1.5 flex flex-wrap items-center gap-2">
                    <StatusPill active={isItemActive(item)} />
                    <span className="text-xs font-medium text-slate-700">
                      {item.metric?.metricName || item.metricUnit?.name || '-'}
                    </span>
                    <span className="rounded bg-indigo-50 px-1.5 py-0.5 text-xs font-semibold text-indigo-700">
                      {item.metric?.unit || item.metricUnit?.subName || '-'}
                    </span>
                    <span className="text-xs text-slate-600 font-mono">
                      [{item.lowerBound != null ? item.lowerBound : '-∞'} , {item.upperBound != null ? item.upperBound : '+∞'}]
                    </span>
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

      <BulkUploadModal
        open={showUpload}
        onClose={() => setShowUpload(false)}
        onUpload={handleUpload}
        onSuccess={() => setRefreshSeed((s) => s + 1)}
        title="Upload Metric Specifications"
        description="Download the template, fill in metric specifications, and upload."
        fileName="metric_specifications_errors.xlsx"
      />
    </div>
  )
}

/* ---------------- helpers ---------------- */

function isItemActive(item) {
  return item.status === 'ACTIVE' || item.status === 'A'
}

function MetricSpecRow({ item }) {
  const active = isItemActive(item)
  const metricName = item.metric?.metricName || item.metricUnit?.name || '-'
  const unit = item.metric?.unit || item.metricUnit?.subName || '-'

  return (
    <tr className={`transition hover:bg-slate-50/60 ${!active ? 'bg-slate-50/50 opacity-75' : ''}`}>
      <td className="px-3 py-2.5 font-mono text-xs text-slate-600">{item.id}</td>
      <td className="px-3 py-2.5 font-mono text-xs text-slate-700">
        {item.inventoryConfiguration?.id != null ? item.inventoryConfiguration.id : '-'}
      </td>
      <td className={`px-3 py-2.5 font-medium text-slate-800 ${!active ? 'line-through text-slate-400' : ''}`}>
        {item.inventoryConfiguration?.productId || '-'}
      </td>
      <td className={`px-3 py-2.5 text-slate-600 ${!active ? 'line-through text-slate-400' : ''}`}>
        {item.inventoryConfiguration?.testParameter?.name || '-'}
      </td>
      <td className="px-3 py-2.5 text-slate-800 font-medium">
        {metricName}
      </td>
      <td className="px-3 py-2.5">
        <span className="inline-flex rounded bg-indigo-50 px-2 py-0.5 text-xs font-semibold text-indigo-700">
          {unit}
        </span>
      </td>
      <td className="px-3 py-2.5 text-right font-mono text-xs text-slate-700">
        {item.lowerBound != null ? Number(item.lowerBound).toFixed(2) : '-'}
      </td>
      <td className="px-3 py-2.5 text-right font-mono text-xs text-slate-700">
        {item.upperBound != null ? Number(item.upperBound).toFixed(2) : '-'}
      </td>
      <td className="px-3 py-2.5"><StatusPill active={active} /></td>
    </tr>
  )
}
