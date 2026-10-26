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

export default function InventoryConfigPage() {
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
  const [fProductId, setProductId]  = useState('')
  const [fParameter, setParameter]    = useState('')
  const [fStatus, setFStatus]     = useState('all')

  const dId         = useDebounce(fId,         400)
  const dProductId  = useDebounce(fProductId,  400)
  const dParameter  = useDebounce(fParameter,  400)

  useEffect(() => { setPage(0) }, [dId, dProductId, dParameter, fStatus]) // eslint-disable-line react-hooks/exhaustive-deps

  const fetchItems = useCallback(async () => {
    setLoading(true)
    try {
      const res = await mastersApi.getInventoryConfig({
        page,
        size: PAGE_SIZE,
        sort: 'productId,asc',
        id: dId || undefined,
        productId: dProductId || undefined,
        parameterName: dParameter || undefined,
        includeInactive: fStatus === 'all' ? undefined : fStatus === 'inactive',
      })
      if (res.data?.content) {
        setItems(res.data.content)
        setTotalPages(res.data.totalPages || 0)
        setTotal(res.data.totalElements || 0)
      }
    } catch (err) {
      console.error('Failed to load inventory configurations:', err)
    } finally {
      setLoading(false)
    }
  }, [page, dId, dProductId, dParameter, fStatus, refreshSeed])

  useEffect(() => { fetchItems() }, [fetchItems])

  const handleUpload = async (file) => {
    const res = await mastersApi.uploadInventoryConfig(file)
    setRefreshSeed((s) => s + 1)
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

  const canUpload = hasRight(Rights.ROLE_INVENTORY_CONFIG_UPLOAD)

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <BackToMaster />
      <header className="flex flex-wrap items-center justify-between gap-3">
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
                <th className="px-4 py-2.5">Product ID</th>
                <th className="px-4 py-2.5">Test Parameter</th>
                <th className="w-36 px-4 py-2.5">Count Needed</th>
                <th className="w-36 px-4 py-2.5">Status</th>
              </tr>
              <tr className="border-y border-slate-100 bg-slate-50/40">
                <th className="px-4 py-2">
                  <FilterInput value={fId} onChange={setFId} placeholder="Filter ID…" />
                </th>
                <th className="px-4 py-2">
                  <FilterInput value={fProductId} onChange={setProductId} placeholder="Filter Product ID…" icon="search" />
                </th>
                <th className="px-4 py-2">
                  <FilterInput value={fParameter} onChange={setParameter} placeholder="Search parameter…" icon="search" />
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
                  <InventoryRow key={item.id} item={item} />
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
                  </div>
                  <div className="mt-1.5 flex items-center gap-2">
                    <StatusPill active={isItemActive(item)} />
                    <span className="text-xs text-slate-500">Count: {item.countNeeded}</span>
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
      <td className="px-4 py-2.5 font-mono text-xs text-slate-600">{item.id}</td>
      <td className={`px-4 py-2.5 font-medium text-slate-800 ${!active ? 'line-through text-slate-400' : ''}`}>{item.productId}</td>
      <td className={`px-4 py-2.5 text-slate-600 ${!active ? 'line-through text-slate-400' : ''}`}>{item.testParameter?.name || '-'}</td>
      <td className={`px-4 py-2.5 text-slate-600 ${!active ? 'line-through text-slate-400' : ''}`}>{item.countNeeded}</td>
      <td className="px-4 py-2.5"><StatusPill active={active} /></td>
    </tr>
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
