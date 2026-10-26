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
} from '../components/MasterPageLayout'
import useDebounce from '../hooks/useDebounce'

export default function TestParametersPage() {
  const { hasRight } = useAuth()
  const [items, setItems]                = useState([])
  const [total, setTotal]                = useState(0)
  const [totalPages, setTotalPages]      = useState(0)
  const [loading, setLoading]            = useState(true)
  const [page, setPage]                  = useState(0)
  const [pageSize, setPageSize]          = useState(20)
  const [refreshSeed, setRefreshSeed]    = useState(0)
  const [showUpload, setShowUpload]      = useState(false)

  // Column filters
  const [fId, setFId]             = useState('')
  const [fName, setFName]         = useState('')
  const [fResultType, setResultType] = useState('all')
  const [fStatus, setFStatus]     = useState('all')

  const dId   = useDebounce(fId,   400)
  const dName = useDebounce(fName, 400)

  useEffect(() => { setPage(0) }, [dId, dName, fResultType, fStatus, pageSize]) // eslint-disable-line react-hooks/exhaustive-deps

  const fetchItems = useCallback(async () => {
    setLoading(true)
    try {
      const res = await mastersApi.getTestParameters({
        page,
        size: pageSize,
        sort: 'name,asc',
        id: dId || undefined,
        name: dName || undefined,
        resultType: fResultType !== 'all' ? fResultType.toUpperCase() : undefined,
        includeInactive: fStatus === 'all' ? undefined : fStatus === 'inactive',
      })
      if (res.data?.content) {
        setItems(res.data.content)
        setTotalPages(res.data.totalPages || 0)
        setTotal(res.data.totalElements || 0)
      }
    } catch (err) {
      console.error('Failed to load test parameters:', err)
    } finally {
      setLoading(false)
    }
  }, [page, dId, dName, fResultType, fStatus, refreshSeed, pageSize])

  useEffect(() => { fetchItems() }, [fetchItems])

  const handleUpload = async (file) => {
    const res = await mastersApi.uploadTestParameters(file)
    return res.data
  }

  const handleDownloadTemplate = async () => {
    try {
      const res = await mastersApi.downloadTestParameterTemplate()
      const url = window.URL.createObjectURL(res.data)
      const a = document.createElement('a')
      a.href = url; a.download = 'test_parameter_template.xlsx'
      document.body.appendChild(a); a.click(); document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Template download failed:', err)
    }
  }

  const canUpload = hasRight(Rights.ROLE_TEST_PARAMETER_UPLOAD) || hasRight(Rights.ROLE_MASTER_DATA_CREATE)

  return (
    <div className="mx-auto flex min-h-0 w-full flex-1 flex-col gap-5">
      <BackToMaster />

      <header className="shrink-0 flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg
                           bg-blue-50 text-blue-600 ring-1 ring-blue-100">
            <Icon name="flaskConical" className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <h1 className="truncate text-lg font-semibold text-slate-900">Test Parameters</h1>
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
            <thead className="sticky top-0 z-10 bg-slate-50">
              <tr className="bg-slate-50/70 text-left text-xs font-semibold uppercase
                              tracking-wider text-slate-500">
                <th className="w-24 px-4 py-2.5">ID</th>
                <th className="px-4 py-2.5">Name</th>
                <th className="w-32 px-4 py-2.5">Result Type</th>
                <th className="px-4 py-2.5">Metric Unit</th>
                <th className="w-28 px-4 py-2.5">Status</th>
              </tr>
              <tr className="border-y border-slate-100 bg-slate-50/40">
                <th className="px-4 py-2">
                  <FilterInput value={fId} onChange={setFId} placeholder="Filter ID…" />
                </th>
                <th className="px-4 py-2">
                  <FilterInput value={fName} onChange={setFName} placeholder="Search name…" icon="search" />
                </th>
                <th className="px-4 py-2">
                  <FilterSelect value={fResultType} onChange={setResultType}
                    options={[['all','All'],['metrics','Metrics'],['pass_fail','Pass/Fail']]} />
                </th>
                <th />
                <th className="px-4 py-2">
                  <FilterSelect value={fStatus} onChange={setFStatus}
                    options={[['all','All'],['active','Active'],['inactive','Inactive']]} />
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {loading ? (
                <TableStatusRow colSpan={5}>Loading…</TableStatusRow>
              ) : items.length === 0 ? (
                <TableStatusRow colSpan={5}>No matching records.</TableStatusRow>
              ) : (
                items.map((item) => (
                  <TestParameterRow key={item.id} item={item} />
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile */}
        <div className="block flex-1 min-h-0 overflow-y-auto sm:hidden">
          <div className="space-y-2 p-3">
            <FilterInput value={fName} onChange={setFName} placeholder="Search name…" icon="search" />
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
                    <span className="font-mono text-xs text-slate-500">{item.id}</span>
                    <span className={`font-medium text-slate-800 ${!isItemActive(item) ? 'line-through text-slate-400' : ''}`}>{item.name}</span>
                  </div>
                  <div className="mt-1.5 flex items-center gap-2">
                    <StatusPill active={isItemActive(item)} />
                    <ResultTypeBadge type={item.resultType} />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination — pinned at bottom */}
        <div className="shrink-0 border-t border-slate-100 px-4 py-1">
          <Pagination page={page} totalPages={totalPages} totalElements={total}
            pageSize={pageSize} onPageChange={setPage} onPageSizeChange={setPageSize} />
        </div>
      </MasterPageLayout>

      <BulkUploadModal
        open={showUpload}
        onClose={() => setShowUpload(false)}
        onUpload={handleUpload}
        onSuccess={() => setRefreshSeed((s) => s + 1)}
        title="Upload Test Parameters"
        description="Download the template, fill in test parameters, and upload."
        fileName="test_parameter_errors.xlsx"
      />
    </div>
  )
}

/* ---------------- helpers ---------------- */

function isItemActive(item) {
  return item.status === 'ACTIVE' || item.status === 'A'
}

function TestParameterRow({ item }) {
  const active = isItemActive(item)
  return (
    <tr className={`transition hover:bg-slate-50/60 ${!active ? 'bg-slate-50/50 opacity-75' : ''}`}>
      <td className="px-4 py-2.5 font-mono text-xs text-slate-600">{item.id}</td>
      <td className={`px-4 py-2.5 font-medium text-slate-800 ${!active ? 'line-through text-slate-400' : ''}`}>{item.name}</td>
      <td className="px-4 py-2.5"><ResultTypeBadge type={item.resultType} /></td>
      <td className={`px-4 py-2.5 text-slate-600 ${!active ? 'line-through text-slate-400' : ''}`}>
        {item.metricUnit?.name || '-'}
      </td>
      <td className="px-4 py-2.5"><StatusPill active={active} /></td>
    </tr>
  )
}

function ResultTypeBadge({ type }) {
  const isMetrics = type === 'METRICS'
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium
      ${isMetrics ? 'bg-blue-50 text-blue-700' : 'bg-violet-50 text-violet-700'}`}>
      {isMetrics ? 'Metrics' : 'Pass/Fail'}
    </span>
  )
}
