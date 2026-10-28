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

export default function InventoryConfigPage() {
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
  const [fId, setFId]             = useState('')
  const [fProductId, setProductId]  = useState('')
  const [fParameter, setParameter]    = useState('')
  const [fTestMethodId, setTestMethodId] = useState('')
  const [fResultType, setResultType]     = useState('all')
  const [fStatus, setFStatus]     = useState('all')

  const dId         = useDebounce(fId,         400)
  const dProductId  = useDebounce(fProductId,  400)
  const dParameter  = useDebounce(fParameter,  400)
  const dTestMethod = useDebounce(fTestMethodId, 400)

  useEffect(() => { setPage(0) }, [dId, dProductId, dParameter, dTestMethod, fResultType, fStatus]) // eslint-disable-line react-hooks/exhaustive-deps

  const fetchItems = useCallback(async () => {
    setLoading(true)
    try {
      const res = await mastersApi.getInventoryConfig({
        page,
        size: PAGE_SIZE,
        sort: 'updatedAt,desc',
        id: dId || undefined,
        productId: dProductId || undefined,
        parameterName: dParameter || undefined,
        testMethodId: dTestMethod || undefined,
        resultType: fResultType !== 'all' ? fResultType : undefined,
        status: fStatus !== 'all' ? fStatus : undefined,
        includeInactive: fStatus === 'all' ? true : undefined,
      })
      if (res.data) {
        setItems(res.data.content || [])
        setTotalPages(res.data.totalPages ?? res.data.page?.totalPages ?? 0)
        setTotal(res.data.totalElements ?? res.data.page?.totalElements ?? 0)
      }
    } catch (err) {
      console.error('Failed to load inventory configurations:', err)
    } finally {
      setLoading(false)
    }
  }, [page, dId, dProductId, dParameter, dTestMethod, fResultType, fStatus, refreshSeed])

  useEffect(() => { fetchItems() }, [fetchItems])

  const handleUpload = async (file) => {
    const res = await mastersApi.uploadInventoryConfig(file)
    return res.data
  }

  const handleDownloadTemplate = async () => {
    try {
      const res = await mastersApi.downloadInventoryConfigTemplate()
      const url = window.URL.createObjectURL(res.data)
      const a = document.createElement('a')
      a.href = url; a.download = 'inventory_config_template.xlsx'
      document.body.appendChild(a); a.click(); document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Template download failed:', err)
    }
  }

  const canUpload = hasRight(Rights.ROLE_INVENTORY_CONFIG_UPLOAD) || hasRight(Rights.ROLE_MASTER_DATA_CREATE)

  return (
    <div className="mx-auto flex h-full min-h-0 w-full flex-1 flex-col gap-3">
      <BackToMaster className="shrink-0" />

      <header className="shrink-0 flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg
                           bg-amber-50 text-amber-600 ring-1 ring-amber-100">
            <Icon name="package2" className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <h1 className="truncate text-lg font-semibold text-slate-900">QC Inventory Configuration</h1>
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
                <th className="px-3 py-2.5">Product ID</th>
                <th className="px-3 py-2.5">Test Parameter</th>
                <th className="px-3 py-2.5">Test Method</th>
                <th className="w-20 px-3 py-2.5 text-center">Critical</th>
                <th className="w-24 px-3 py-2.5 text-center">Count</th>
                <th className="w-28 px-3 py-2.5">Result Type</th>
                <th className="px-3 py-2.5">Specification</th>
                <th className="w-24 px-3 py-2.5">Status</th>
              </MasterHeaderRow>
              <MasterFilterRow>
                <th className="px-3 py-2">
                  <FilterInput value={fId} onChange={setFId} placeholder="Filter ID…" />
                </th>
                <th className="px-3 py-2">
                  <FilterInput value={fProductId} onChange={setProductId} placeholder="Filter Product ID…" icon="search" />
                </th>
                <th className="px-3 py-2">
                  <FilterInput value={fParameter} onChange={setParameter} placeholder="Search parameter…" icon="search" />
                </th>
                <th className="px-3 py-2">
                  <FilterInput value={fTestMethodId} onChange={setTestMethodId} placeholder="Filter Method…" icon="search" />
                </th>
                <th />
                <th />
                <th className="px-3 py-2">
                  <FilterSelect value={fResultType} onChange={setResultType}
                    options={[['all','All'],['METRICS','METRICS'],['TEXT','TEXT']]} />
                </th>
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
                  <InventoryRow key={item.id} item={item} />
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
                    <span className="font-mono text-xs text-slate-500">{item.productId}</span>
                    <span className={`font-medium text-slate-800 ${!isItemActive(item) ? 'line-through text-slate-400' : ''}`}>{item.testParameter?.name || '-'}</span>
                    <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px] font-mono text-slate-600">{item.testMethodId}</span>
                  </div>
                  <div className="mt-1.5 flex flex-wrap items-center gap-2">
                    <StatusPill active={isItemActive(item)} />
                    <span className={`inline-flex rounded px-1.5 py-0.5 text-xs font-semibold ${item.isCritical === 'Y' ? 'bg-red-50 text-red-600' : 'bg-slate-50 text-slate-500'}`}>
                      {item.isCritical === 'Y' ? 'Critical' : 'Non-Critical'}
                    </span>
                    <span className="text-xs text-slate-500">Count: {item.countNeeded}</span>
                    <span className="rounded bg-blue-50 px-1.5 py-0.5 text-xs text-blue-700 font-medium">{item.resultType}</span>
                  </div>
                  {item.specificationText && (
                    <p className="mt-1 text-xs text-slate-600 italic truncate max-w-xs">{item.specificationText}</p>
                  )}
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
        title="Upload Inventory Configuration"
        description="Download the template, fill in inventory configurations, and upload."
        fileName="inventory_config_errors.xlsx"
      />
    </div>
  )
}

/* ---------------- helpers ---------------- */

function isItemActive(item) {
  return item.status === 'ACTIVE' || item.status === 'A'
}

function InventoryRow({ item }) {
  const active = isItemActive(item)
  return (
    <tr className={`transition hover:bg-slate-50/60 ${!active ? 'bg-slate-50/50 opacity-75' : ''}`}>
      <td className="px-3 py-2.5 font-mono text-xs text-slate-600">{item.id}</td>
      <td className={`px-3 py-2.5 font-medium text-slate-800 ${!active ? 'line-through text-slate-400' : ''}`}>{item.productId}</td>
      <td className={`px-3 py-2.5 text-slate-600 ${!active ? 'line-through text-slate-400' : ''}`}>{item.testParameter?.name || '-'}</td>
      <td className="px-3 py-2.5 font-mono text-xs text-slate-700">{item.testMethodId || '-'}</td>
      <td className="px-3 py-2.5 text-center">
        <span className={`inline-flex rounded px-1.5 py-0.5 text-xs font-semibold ${item.isCritical === 'Y' ? 'bg-red-50 text-red-600' : 'bg-slate-100 text-slate-500'}`}>
          {item.isCritical === 'Y' ? 'Y' : 'N'}
        </span>
      </td>
      <td className="px-3 py-2.5 text-center text-slate-600">{item.countNeeded}</td>
      <td className="px-3 py-2.5">
        <span className={`inline-flex rounded px-2 py-0.5 text-xs font-medium ${item.resultType === 'METRICS' ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-700'}`}>
          {item.resultType || 'TEXT'}
        </span>
      </td>
      <td className="px-3 py-2.5 text-xs text-slate-600 max-w-xs truncate" title={item.specificationText || ''}>
        {item.specificationText || '-'}
      </td>
      <td className="px-3 py-2.5"><StatusPill active={active} /></td>
    </tr>
  )
}
