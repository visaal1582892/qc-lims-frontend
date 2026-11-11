import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  fetchGrnFailures,
  setPage,
  setFilters,
  resetFilters,
  openJsonModal,
  closeJsonModal,
} from '../store/slices/grnFailuresSlice'
import Icon from '../components/Icon'
import Pagination from '../components/Pagination'
import MasterPageLayout, {
  FilterInput,
  FilterSelect,
  TableStatusRow,
  MasterTableHeader,
  MasterHeaderRow,
  MasterFilterRow,
} from '../components/MasterPageLayout'
import useDebounce from '../hooks/useDebounce'

export default function GrnFailuresPage() {
  const dispatch = useDispatch()
  const {
    items,
    total,
    totalPages,
    loading,
    page,
    pageSize,
    filters,
    jsonModalOpen,
    jsonModalTitle,
    jsonModalContent,
  } = useSelector((state) => state.grnFailures)

  const [copied, setCopied] = useState(false)

  const dRefNo = useDebounce(filters.requestReferenceNo, 350)
  const dGrnId = useDebounce(filters.grnId, 350)
  const dFromStore = useDebounce(filters.fromStoreId, 350)
  const dToStore = useDebounce(filters.toStoreId, 350)

  useEffect(() => {
    dispatch(fetchGrnFailures())
  }, [dispatch, page, dRefNo, dGrnId, dFromStore, dToStore, filters.status])

  const handleCopyJson = () => {
    if (!jsonModalContent) return
    let textToCopy = jsonModalContent
    try {
      const parsed = typeof jsonModalContent === 'string' ? JSON.parse(jsonModalContent) : jsonModalContent
      textToCopy = JSON.stringify(parsed, null, 2)
    } catch {
      // keep raw string
    }
    navigator.clipboard.writeText(textToCopy).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const formatJson = (val) => {
    if (!val) return 'No payload captured'
    try {
      const parsed = typeof val === 'string' ? JSON.parse(val) : val
      return JSON.stringify(parsed, null, 2)
    } catch {
      return String(val)
    }
  }

  const hasActiveFilters = Boolean(
    filters.requestReferenceNo ||
    filters.grnId ||
    filters.fromStoreId ||
    filters.toStoreId ||
    (filters.status && filters.status !== 'FAILED')
  )

  const handleClearFilters = () => {
    dispatch(resetFilters())
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'FAILED':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-[10.5px] font-semibold text-rose-700 ring-1 ring-inset ring-rose-600/20">
            <Icon name="xCircle" className="h-3 w-3" />
            FAILED
          </span>
        )
      case 'SUCCESS':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10.5px] font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
            <Icon name="checkCircle2" className="h-3 w-3" />
            SUCCESS
          </span>
        )
      case 'INITIATED':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10.5px] font-semibold text-amber-700 ring-1 ring-inset ring-amber-600/20">
            <Icon name="clock" className="h-3 w-3" />
            INITIATED
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10.5px] font-semibold text-slate-700 ring-1 ring-inset ring-slate-500/10">
            {status || 'UNKNOWN'}
          </span>
        )
    }
  }

  return (
    <div className="mx-auto flex h-full min-h-0 w-full flex-1 flex-col gap-3">
      {/* Page Header */}
      <header className="shrink-0 flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-rose-50 text-rose-600 ring-1 ring-rose-100">
            <Icon name="alertCircle" className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <h1 className="truncate text-lg font-semibold text-slate-900">GRN Failures & Inward Audit</h1>
            <p className="text-xs text-slate-500">
              {total} record{total === 1 ? '' : 's'} total • Audit log of GRN inward payloads and manual QC request failures
            </p>
          </div>
        </div>

        {/* Global Toolbar buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleClearFilters}
            disabled={!hasActiveFilters}
            className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-xs transition hover:bg-slate-50 disabled:opacity-40"
            title="Clear all filters"
          >
            <Icon name="rotateCcw" className="h-3.5 w-3.5" />
            Clear Filters
          </button>
          <button
            type="button"
            onClick={() => dispatch(fetchGrnFailures())}
            className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 active:scale-[0.98]"
          >
            <Icon name="refreshCw" className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </header>

      {/* Main Table Layout */}
      <MasterPageLayout>
        <div className="hidden flex-1 min-h-0 overflow-auto sm:block">
          <table className="w-full min-w-full text-xs">
            <MasterTableHeader>
              <MasterHeaderRow>
                <th className="w-44 px-2.5 py-2.5">Reference No</th>
                <th className="w-28 px-2.5 py-2.5">GRN ID</th>
                <th className="w-28 px-2.5 py-2.5">From Store</th>
                <th className="w-28 px-2.5 py-2.5">To QC Store</th>
                <th className="w-28 px-2.5 py-2.5 text-center">Status</th>
                <th className="px-2.5 py-2.5">Error Message</th>
                <th className="w-36 px-2.5 py-2.5">Created At</th>
                <th className="w-40 px-2.5 py-2.5 text-center">Payloads</th>
              </MasterHeaderRow>

              <MasterFilterRow>
                <th className="px-1.5 py-1.5">
                  <FilterInput
                    placeholder="Ref No…"
                    value={filters.requestReferenceNo}
                    onChange={(val) => dispatch(setFilters({ requestReferenceNo: val }))}
                  />
                </th>
                <th className="px-1.5 py-1.5">
                  <FilterInput
                    placeholder="GRN ID…"
                    value={filters.grnId}
                    onChange={(val) => dispatch(setFilters({ grnId: val }))}
                  />
                </th>
                <th className="px-1.5 py-1.5">
                  <FilterInput
                    placeholder="From Store…"
                    value={filters.fromStoreId}
                    onChange={(val) => dispatch(setFilters({ fromStoreId: val }))}
                  />
                </th>
                <th className="px-1.5 py-1.5">
                  <FilterInput
                    placeholder="To Store…"
                    value={filters.toStoreId}
                    onChange={(val) => dispatch(setFilters({ toStoreId: val }))}
                  />
                </th>
                <th className="px-1.5 py-1.5">
                  <FilterSelect
                    value={filters.status}
                    onChange={(val) => dispatch(setFilters({ status: val }))}
                    options={[
                      { value: '', label: 'All' },
                      { value: 'FAILED', label: 'FAILED' },
                      { value: 'INITIATED', label: 'INITIATED' },
                      { value: 'SUCCESS', label: 'SUCCESS' },
                    ]}
                  />
                </th>
                <th className="px-1.5 py-1.5" colSpan={3} />
              </MasterFilterRow>
            </MasterTableHeader>

            <tbody className="divide-y divide-slate-100 bg-white">
              {loading ? (
                <TableStatusRow colSpan={8}>Loading GRN audit records…</TableStatusRow>
              ) : items.length === 0 ? (
                <TableStatusRow colSpan={8}>No GRN audit records found.</TableStatusRow>
              ) : (
                items.map((item) => (
                  <tr
                    key={item.requestReferenceNo}
                    className="hover:bg-slate-50/70 transition"
                  >
                    <td className="px-2.5 py-2 font-mono text-[11px] font-semibold text-slate-800 whitespace-nowrap">
                      {item.requestReferenceNo}
                    </td>
                    <td className="px-2.5 py-2 font-mono text-[11px] font-semibold text-indigo-600 whitespace-nowrap">
                      {item.grnId || '—'}
                    </td>
                    <td className="px-2.5 py-2 font-mono text-[11px] text-slate-700 whitespace-nowrap">
                      {item.fromStoreId || '—'}
                    </td>
                    <td className="px-2.5 py-2 font-mono text-[11px] text-slate-700 whitespace-nowrap">
                      {item.toStoreId || '—'}
                    </td>
                    <td className="px-2.5 py-2 text-center whitespace-nowrap">
                      {getStatusBadge(item.status)}
                    </td>
                    <td
                      className="px-2.5 py-2 text-xs text-rose-700 font-medium max-w-xs truncate"
                      title={item.errorMessage || ''}
                    >
                      {item.errorMessage || '—'}
                    </td>
                    <td className="px-2.5 py-2 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                      {item.createdAt ? new Date(item.createdAt).toLocaleString() : '—'}
                    </td>
                    <td className="px-2.5 py-2 text-center whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() =>
                            dispatch(
                              openJsonModal({
                                title: `Request Payload — Ref #${item.requestReferenceNo}`,
                                content: item.requestPayload,
                              })
                            )
                          }
                          disabled={!item.requestPayload}
                          className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] font-medium text-slate-700 shadow-2xs hover:bg-slate-50 hover:text-indigo-600 active:scale-[0.98] disabled:opacity-30 disabled:cursor-not-allowed transition"
                          title="View Request JSON"
                        >
                          <Icon name="code" className="h-3 w-3 text-slate-400" />
                          Request
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            dispatch(
                              openJsonModal({
                                title: `Response Payload — Ref #${item.requestReferenceNo}`,
                                content: item.responsePayload,
                              })
                            )
                          }
                          disabled={!item.responsePayload}
                          className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] font-medium text-slate-700 shadow-2xs hover:bg-slate-50 hover:text-indigo-600 active:scale-[0.98] disabled:opacity-30 disabled:cursor-not-allowed transition"
                          title="View Response JSON"
                        >
                          <Icon name="fileText" className="h-3 w-3 text-slate-400" />
                          Response
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pinned Pagination Footer */}
        <div className="shrink-0 border-t border-slate-100 bg-white px-4 py-1">
          <Pagination
            page={page}
            totalPages={totalPages}
            totalElements={total}
            pageSize={pageSize}
            onPageChange={(p) => dispatch(setPage(p))}
            loading={loading}
          />
        </div>
      </MasterPageLayout>

      {/* JSON Viewer Modal */}
      {jsonModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-3xl rounded-xl border border-slate-200 bg-white shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-5 py-3.5">
              <div className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100">
                  <Icon name="code" className="h-4 w-4" />
                </span>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{jsonModalTitle}</h3>
                  <p className="text-[11px] text-slate-500">Payload capture for diagnostic review</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyJson}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 active:scale-[0.98] transition"
                >
                  <Icon name={copied ? 'check' : 'copy'} className="h-3.5 w-3.5" />
                  {copied ? 'Copied!' : 'Copy JSON'}
                </button>
                <button
                  type="button"
                  onClick={() => dispatch(closeJsonModal())}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
                >
                  <Icon name="x" className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 bg-slate-950 font-mono text-[11.5px] text-emerald-400 leading-relaxed">
              <pre className="whitespace-pre-wrap break-all">{formatJson(jsonModalContent)}</pre>
            </div>

            <div className="flex items-center justify-end border-t border-slate-100 bg-slate-50/60 px-5 py-3">
              <button
                type="button"
                onClick={() => dispatch(closeJsonModal())}
                className="rounded-lg bg-white px-4 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs ring-1 ring-slate-300 ring-inset hover:bg-slate-50 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
