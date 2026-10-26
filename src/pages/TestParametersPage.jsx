import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '../auth/useAuth'
import { mastersApi } from '../api/masters'
import { Rights } from '../constants/rights'
import BulkUploadModal from '../components/masters/BulkUploadModal'
import Icon from '../components/Icon'
import Pagination from '../components/Pagination'
import BackToMaster from '../components/admin/BackToMaster'
import { TableStatusRow } from '../components/dataTable'
import useDebounce from '../hooks/useDebounce'

const PAGE_SIZE = 20

export default function TestParametersPage() {
  const { hasRight } = useAuth()
  const [items, setItems]                = useState([])
  const [total, setTotal]                = useState(0)
  const [totalPages, setTotalPages]      = useState(0)
  const [loading, setLoading]            = useState(true)
  const [page, setPage]                  = useState(0)
  const [refreshSeed, setRefreshSeed]    = useState(0)
  const [showUpload, setShowUpload]      = useState(false)

  // Column filters
  const [fId, setFId]             = useState('')
  const [fName, setFName]         = useState('')
  const [fResultType, setResultType] = useState('all')
  const [fStatus, setFStatus]     = useState('all')

  const dId   = useDebounce(fId,   400)
  const dName = useDebounce(fName, 400)

  useEffect(() => { setPage(0) }, [dId, dName, fResultType, fStatus]) // eslint-disable-line react-hooks/exhaustive-deps

  const fetchItems = useCallback(async () => {
    setLoading(true)
    try {
      const res = await mastersApi.getTestParameters({
        page,
        size: PAGE_SIZE,
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
  }, [page, dId, dName, fResultType, fStatus, refreshSeed])

  useEffect(() => { fetchItems() }, [fetchItems])

  const handleUpload = async (file) => {
    const res = await mastersApi.uploadTestParameters(file)
    setRefreshSeed((s) => s + 1)
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
    <div className="mx-auto max-w-7xl space-y-5">
      <BackToMaster />
      <header className="flex flex-wrap items-center justify-between gap-3">
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
        {canUpload && (
          <button
            onClick={() => setShowUpload(true)}
            className="inline-flex items-center gap-1.5 rounded-md bg-brand-600 px-3.5 py-2
                       text-sm font-semibold text-white shadow-sm transition
                       hover:bg-brand-700 active:scale-[0.98]"
          >
            <Icon name="upload" className="h-4 w-4" />
            Upload Excel
          </button>
        )}
      </header>

      <section className="rounded-lg bg-white shadow-sm ring-1 ring-slate-200/70">
        <div className="hidden w-full overflow-x-auto sm:block">
          <table className="w-full min-w-full text-sm">
            <thead className="bg-slate-50">
              <tr className="bg-slate-50/70 text-left text-xs font-semibold uppercase
                              tracking-wider text-slate-500">
                <th className="w-36 px-4 py-2.5">ID</th>
                <th className="px-4 py-2.5">Name</th>
                <th className="w-36 px-4 py-2.5">Result Type</th>
                <th className="px-4 py-2.5">Metric Unit</th>
                <th className="w-36 px-4 py-2.5">Status</th>
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
          <div className="border-t border-slate-100 px-4 py-1">
            <Pagination page={page} totalPages={totalPages} totalElements={total}
              pageSize={PAGE_SIZE} onPageChange={setPage} />
          </div>
        </div>

        {/* Mobile */}
        <div className="block divide-y divide-slate-100 sm:hidden">
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
          <div className="px-4 py-1">
            <Pagination page={page} totalPages={totalPages} totalElements={total}
              pageSize={PAGE_SIZE} onPageChange={setPage} />
          </div>
        </div>
      </section>

      <BulkUploadModal
        open={showUpload}
        onClose={() => setShowUpload(false)}
        onDownloadTemplate={handleDownloadTemplate}
        onUpload={handleUpload}
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

function FilterInput({ value, onChange, placeholder, icon }) {
  return (
    <div className="relative">
      {icon && (
        <Icon name={icon}
              className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      )}
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full rounded-md border border-slate-200 bg-white py-1.5
                    text-xs text-slate-700 shadow-sm placeholder:text-slate-400
                    focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100
                    ${icon ? 'pl-8 pr-2.5' : 'px-2.5'}`}
      />
    </div>
  )
}

function FilterSelect({ value, onChange, options }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-md border border-slate-200 bg-white py-1.5 pl-2.5 pr-7
                 text-xs text-slate-700 shadow-sm appearance-none cursor-pointer
                 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100
                 bg-[url('data:image/svg+xml;charset=US-ASCII,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2212%22 height=%2212%22 viewBox=%220 0 12 12%22><path fill=%22%2394a3b8%22 d=%22M6 8L1 3h10z%22/></svg>')] bg-[right_0.5rem_center] bg-no-repeat"
    >
      {options.map(([val, label]) => (
        <option key={val} value={val}>{label}</option>
      ))}
    </select>
  )
}

function StatusPill({ active }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium
                  ${active
                    ? 'bg-accent-50 text-accent-700 ring-1 ring-accent-200'
                    : 'bg-slate-100 text-slate-600 ring-1 ring-slate-200'}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${active ? 'bg-accent-500' : 'bg-slate-400'}`} />
      {active ? 'Active' : 'Inactive'}
    </span>
  )
}
