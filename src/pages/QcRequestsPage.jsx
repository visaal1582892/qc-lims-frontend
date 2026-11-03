import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import GrnDetailsModal from '../components/GrnDetailsModal'
import {
  fetchQcRequests,
  validateAcceptanceThunk,
  bulkAcceptThunk,
  bulkRejectThunk,
  setPage,
  setFilter,
  clearFilters,
  toggleSelectRow,
  toggleSelectAllOnPage,
  clearSelection,
  setAcceptModalOpen,
  setRejectModalOpen,
  setMissingConfigModalOpen,
  setStoreMismatchModalOpen,
} from '../store/slices/qcRequestsSlice'
import { useToast } from '../components/Toast'
import Icon from '../components/Icon'
import Pagination from '../components/Pagination'
import MasterPageLayout, {
  FilterInput, TableStatusRow,
  MasterTableHeader, MasterHeaderRow, MasterFilterRow,
} from '../components/MasterPageLayout'
import useDebounce from '../hooks/useDebounce'
import useAuth from '../auth/useAuth'
import { Rights } from '../constants/rights'

export default function QcRequestsPage() {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const toast = useToast()
  const { hasRight } = useAuth()

  const notify = (type, message) => {
    if (typeof toast?.[type] === 'function') {
      toast[type](message)
    } else if (typeof toast?.addToast === 'function') {
      toast.addToast(type, message)
    } else {
      console.error(`[Toast ${type}]:`, message)
    }
  }

  const canAccept = hasRight(Rights.ROLE_SYSTEM_ADMIN) || hasRight(Rights.ROLE_QC_REQUEST_ACCEPT)
  const canReject = hasRight(Rights.ROLE_SYSTEM_ADMIN) || hasRight(Rights.ROLE_QC_REQUEST_REJECT)

  const {
    items,
    total,
    totalPages,
    loading,
    page,
    pageSize,
    filters,
    selectedIds,
    validationLoading,
    actionLoading,
    acceptModalOpen,
    rejectModalOpen,
    missingConfigModalOpen,
    storeMismatchModalOpen,
    mismatchStores,
    missingProducts,
    validationData,
    acceptError,
  } = useSelector((state) => state.qcRequests)

  const [selectedGrnIdForModal, setSelectedGrnIdForModal] = useState(null)

  const dRequestId = useDebounce(filters.requestId, 350)
  const dGrnId = useDebounce(filters.grnId, 350)
  const dStoreId = useDebounce(filters.storeId, 350)
  const dProductId = useDebounce(filters.productId, 350)
  const dBatchId = useDebounce(filters.batchId, 350)

  useEffect(() => {
    dispatch(fetchQcRequests())
  }, [dispatch, page, dRequestId, dGrnId, dStoreId, dProductId, dBatchId])

  // Selection handlers
  const allPageIds = useMemo(() => items.map(i => i.requestId), [items])
  const isAllSelected = items.length > 0 && allPageIds.every(id => selectedIds.includes(id))

  // Pre-validate before opening Accept Modal
  const handleOpenAcceptModal = async () => {
    if (selectedIds.length === 0) return

    // Quick client-side store uniformity check across loaded selected items
    const selectedRows = items.filter(i => selectedIds.includes(i.requestId))
    const stores = Array.from(new Set(selectedRows.map(i => i.fromStoreId).filter(Boolean)))
    if (stores.length > 1) {
      dispatch(setStoreMismatchModalOpen(true))
      return
    }

    try {
      const data = await dispatch(validateAcceptanceThunk(selectedIds)).unwrap()
      if (data && !data.valid) {
        if (data.mismatchStores && data.mismatchStores.length > 1) {
          dispatch(setStoreMismatchModalOpen(true))
        } else if (data.hasMissingConfig || (data.missingProductIds && data.missingProductIds.length > 0)) {
          dispatch(setMissingConfigModalOpen(true))
        } else {
          notify('error', data.errorMessage || 'Selected requests failed validation for acceptance.')
        }
      }
    } catch (err) {
      notify('error', `Validation failed: ${err}`)
    }
  }

  // Execute Bulk Accept
  const handleConfirmAccept = async () => {
    try {
      const res = await dispatch(bulkAcceptThunk(selectedIds)).unwrap()
      const toId = res?.transferOrderId || ''
      notify('success', `Accepted ${selectedIds.length} request(s)! Transfer Order generated: ${toId}`)
      dispatch(setAcceptModalOpen(false))
      dispatch(clearSelection())
    } catch (err) {
      notify('error', `Bulk accept failed: ${err}`)
    }
  }

  // Execute Bulk Reject
  const handleConfirmReject = async () => {
    try {
      await dispatch(bulkRejectThunk(selectedIds)).unwrap()
      notify('success', `Rejected ${selectedIds.length} request(s).`)
    } catch (err) {
      notify('error', `Bulk reject failed: ${err}`)
    }
  }

  const hasActiveFilters = Boolean(
    filters.requestId ||
    filters.grnId ||
    filters.storeId ||
    filters.productId ||
    filters.batchId
  )

  const handleClearFilters = () => {
    dispatch(clearFilters())
  }

  return (
    <div className="mx-auto flex h-full min-h-0 w-full flex-1 flex-col gap-3">
      {/* Page Header */}
      <header className="shrink-0 flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100">
            <Icon name="clipboardList" className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <h1 className="truncate text-lg font-semibold text-slate-900">Pending QC Requests</h1>
            <p className="text-xs text-slate-500">
              {total} request{total === 1 ? '' : 's'} total • Showing Pending requests
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
            onClick={() => navigate('/payload-inward')}
            className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 active:scale-[0.98]"
          >
            <Icon name="upload" className="h-3.5 w-3.5" />
            Payload Inward
          </button>
        </div>
      </header>

      {/* Floating Selection Bar */}
      {selectedIds.length > 0 && (
        <div className="shrink-0 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-brand-200 bg-brand-50/90 px-4 py-2.5 shadow-sm animate-in fade-in duration-150">
          <div className="flex items-center gap-2 text-xs font-semibold text-brand-900">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-600 text-[11px] text-white">
              {selectedIds.length}
            </span>
            <span>request{selectedIds.length === 1 ? '' : 's'} selected</span>
            <button
              onClick={() => dispatch(clearSelection())}
              className="ml-2 text-xs font-medium text-brand-700 underline hover:text-brand-900"
            >
              Clear selection
            </button>
          </div>

          <div className="flex items-center gap-2">
            {canReject && (
              <button
                type="button"
                onClick={() => dispatch(setRejectModalOpen(true))}
                className="inline-flex items-center gap-1 rounded-md bg-white border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-700 shadow-xs transition hover:bg-rose-50 active:scale-[0.98]"
              >
                <Icon name="xCircle" className="h-3.5 w-3.5" />
                Bulk Reject
              </button>
            )}

            {canAccept && (
              <button
                type="button"
                onClick={handleOpenAcceptModal}
                disabled={validationLoading}
                className="inline-flex items-center gap-1.5 rounded-md bg-brand-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs transition hover:bg-brand-700 disabled:opacity-50 active:scale-[0.98]"
              >
                {validationLoading ? (
                  <>
                    <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Validating…
                  </>
                ) : (
                  <>
                    <Icon name="checkCircle2" className="h-3.5 w-3.5" />
                    Bulk Accept (Generate TO)
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Table Container */}
      <MasterPageLayout>
        <div className="hidden flex-1 min-h-0 overflow-auto sm:block">
          <table className="w-full min-w-full text-xs">
            <MasterTableHeader>
              <MasterHeaderRow>
                <th className="w-10 px-2 py-2.5 text-center">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={() => dispatch(toggleSelectAllOnPage())}
                    className="h-3.5 w-3.5 rounded border-slate-300 text-brand-600 focus:ring-brand-500 cursor-pointer"
                    aria-label="Select all on page"
                  />
                </th>
                <th className="w-16 px-2.5 py-2.5">Req ID</th>
                <th className="w-35 px-2.5 py-2.5">GRN ID</th>
                <th className="w-35 px-2.5 py-2.5">Store ID</th>
                <th className="w-35 px-2.5 py-2.5">Product ID</th>
                <th className="w-35 px-2.5 py-2.5">Batch ID</th>
                <th className="w-35 px-2.5 py-2.5 text-center">Status</th>
              </MasterHeaderRow>

              <MasterFilterRow>
                <th className="px-2 py-1.5 text-center">
                  {selectedIds.length > 0 ? (
                    <button
                      onClick={() => dispatch(clearSelection())}
                      title="Clear selection"
                      className="text-slate-400 hover:text-slate-600"
                    >
                      <Icon name="x" className="h-3 w-3 mx-auto" />
                    </button>
                  ) : hasActiveFilters ? (
                    <button
                      onClick={handleClearFilters}
                      title="Clear all filters"
                      className="text-slate-400 hover:text-indigo-600 transition"
                    >
                      <Icon name="rotateCcw" className="h-3 w-3 mx-auto" />
                    </button>
                  ) : null}
                </th>
                <th className="px-1.5 py-1.5">
                  <FilterInput
                    value={filters.requestId}
                    onChange={(val) => dispatch(setFilter({ key: 'requestId', value: val }))}
                    placeholder="Req…"
                  />
                </th>
                <th className="px-1.5 py-1.5">
                  <FilterInput
                    value={filters.grnId}
                    onChange={(val) => dispatch(setFilter({ key: 'grnId', value: val }))}
                    placeholder="GRN…"
                  />
                </th>
                <th className="px-1.5 py-1.5">
                  <FilterInput
                    value={filters.storeId}
                    onChange={(val) => dispatch(setFilter({ key: 'storeId', value: val }))}
                    placeholder="Store…"
                  />
                </th>
                <th className="px-1.5 py-1.5">
                  <FilterInput
                    value={filters.productId}
                    onChange={(val) => dispatch(setFilter({ key: 'productId', value: val }))}
                    placeholder="Prod ID…"
                  />
                </th>
                <th className="px-1.5 py-1.5">
                  <FilterInput
                    value={filters.batchId}
                    onChange={(val) => dispatch(setFilter({ key: 'batchId', value: val }))}
                    placeholder="Batch ID…"
                  />
                </th>
                <th className="px-1.5 py-1.5" />
              </MasterFilterRow>
            </MasterTableHeader>

            <tbody className="divide-y divide-slate-100 bg-white">
              {loading ? (
                <TableStatusRow colSpan={7}>Loading QC testing requests…</TableStatusRow>
              ) : items.length === 0 ? (
                <TableStatusRow colSpan={7}>No matching requests found.</TableStatusRow>
              ) : (
                items.map(item => {
                  const isSelected = selectedIds.includes(item.requestId)
                  return (
                    <tr
                      key={item.requestId}
                      className={`transition hover:bg-slate-50/70 ${isSelected ? 'bg-brand-50/40' : ''
                        }`}
                    >
                      <td className="px-2 py-2 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => dispatch(toggleSelectRow(item.requestId))}
                          className="h-3.5 w-3.5 rounded border-slate-300 text-brand-600 focus:ring-brand-500 cursor-pointer"
                        />
                      </td>
                      <td className="px-2.5 py-2 font-mono text-[11px] text-slate-700">
                        {item.requestId}
                      </td>
                      <td className="px-2.5 py-2 font-mono text-[11px]">
                        {item.grnId ? (
                          <button
                            type="button"
                            onClick={() => setSelectedGrnIdForModal(item.grnId)}
                            className="font-semibold text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer"
                            title="View GRN Details"
                          >
                            {item.grnId}
                          </button>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="px-2.5 py-2 font-mono text-[11px] text-slate-700">
                        {item.fromStoreId || '-'}
                      </td>
                      <td className="px-2.5 py-2 font-mono font-medium text-slate-900">
                        {item.productId}
                      </td>
                      <td className="px-2.5 py-2 font-mono text-[11px] text-slate-600">
                        {item.batchId}
                      </td>
                      <td className="px-2.5 py-2 text-center">
                        <StatusBadge status={item.status} />
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
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

      {/* ========================================================================= */}
      {/* MODAL 1: Acceptance Confirmation Modal (Single TO + Scrollable List)       */}
      {/* ========================================================================= */}
      {acceptModalOpen && validationData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-xl rounded-xl border border-slate-200 bg-white shadow-2xl overflow-hidden">
            <div className="border-b border-slate-100 bg-slate-50/80 px-5 py-4">
              <div className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                  <Icon name="checkCircle2" className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Confirm Bulk Acceptance</h3>
                  <p className="text-xs text-slate-500">
                    Generate single Transfer Order for {selectedIds.length} request(s)
                  </p>
                </div>
              </div>
            </div>

            <div className="p-5 space-y-4">
              {/* Prominent single TO alert */}
              <div className="rounded-lg border border-indigo-200 bg-indigo-50/80 p-3 text-xs text-indigo-900">
                <div className="flex items-start gap-2">
                  <Icon name="truck" className="h-4 w-4 shrink-0 text-indigo-600 mt-0.5" />
                  <div>
                    <strong className="font-semibold">Notice:</strong> A{' '}
                    <strong>single Transfer Order</strong> will be automatically generated for all selected requests.
                    <div className="mt-1 text-[11.5px] text-indigo-800">
                      From Store: <span className="font-mono font-bold">{validationData.fromStoreId}</span> →
                      To Store: <span className="font-mono font-bold">{validationData.toStoreId || 'INAPHYD00337'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Scrollable table of products, batch IDs, counts */}
              <div>
                <p className="text-xs font-semibold text-slate-700 mb-1.5">
                  Products to be transferred ({validationData.summaryItems?.length || 0}):
                </p>
                <div className="max-h-56 overflow-y-auto rounded-lg border border-slate-200 bg-slate-50/50">
                  <table className="w-full text-left text-xs">
                    <thead className="sticky top-0 bg-slate-100 text-[11px] font-semibold text-slate-600">
                      <tr>
                        <th className="px-3 py-2">Product ID</th>
                        <th className="px-3 py-2">Batch ID</th>
                        <th className="px-3 py-2 text-right">Count (TO Quantity)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200/70 bg-white">
                      {validationData.summaryItems?.map((p, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/80">
                          <td className="px-3 py-2 font-mono font-medium text-slate-800">{p.productId}</td>
                          <td className="px-3 py-2 font-mono text-slate-600">{p.batchId}</td>
                          <td className="px-3 py-2 text-right font-bold text-slate-900">{p.quantity}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="mt-1 text-[11px] text-slate-500 italic">
                  * Counts are derived from active QC Inventory Configuration (sum of count_needed).
                </p>
              </div>

              {/* Inline Error Alert if TO Creation Failed */}
              {acceptError && (
                <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800 flex items-start gap-2.5">
                  <Icon name="alertCircle" className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
                  <div className="min-w-0">
                    <strong className="font-semibold text-rose-950">Transfer Order Creation Failed:</strong>
                    <p className="mt-0.5 font-mono text-[11px] text-rose-700 break-words leading-relaxed">{acceptError}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2.5 border-t border-slate-100 bg-slate-50/80 px-5 py-3">
              <button
                type="button"
                onClick={() => dispatch(setAcceptModalOpen(false))}
                disabled={actionLoading}
                className="rounded-md border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmAccept}
                disabled={actionLoading}
                className="inline-flex items-center gap-1.5 rounded-md bg-brand-600 px-4 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-brand-700 disabled:opacity-50 active:scale-[0.98]"
              >
                {actionLoading ? 'Processing…' : 'Confirm & Generate Transfer Order'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: Missing Inventory Config Modal                                   */}
      {/* ========================================================================= */}
      {missingConfigModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white shadow-2xl overflow-hidden">
            <div className="border-b border-amber-100 bg-amber-50/90 px-5 py-4">
              <div className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
                  <Icon name="alertTriangle" className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="text-sm font-bold text-amber-950">Missing QC Inventory Configuration</h3>
                  <p className="text-xs text-amber-800">
                    Configuration required before accepting requests
                  </p>
                </div>
              </div>
            </div>

            <div className="p-5 space-y-3">
              <p className="text-xs text-slate-700 leading-relaxed">
                The Transfer Order count cannot be determined because active QC Inventory Configuration is missing for the following product ID(s):
              </p>
              <div className="max-h-40 overflow-y-auto rounded-lg border border-amber-200 bg-amber-50/40 p-2.5">
                <ul className="space-y-1">
                  {missingProducts.map(pid => (
                    <li key={pid} className="flex items-center gap-2 text-xs font-mono font-semibold text-slate-800">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                      {pid}
                    </li>
                  ))}
                </ul>
              </div>
              <p className="text-xs text-slate-500">
                Please navigate to the QC Inventory Configuration master to configure test parameters and counts needed for these products.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 border-t border-slate-100 bg-slate-50/80 px-5 py-3">
              <button
                type="button"
                onClick={() => dispatch(setMissingConfigModalOpen(false))}
                className="rounded-md border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  dispatch(setMissingConfigModalOpen(false))
                  navigate('/masters/inventory-config')
                }}
                className="inline-flex items-center gap-1.5 rounded-md bg-amber-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-amber-700 active:scale-[0.98]"
              >
                <Icon name="cog" className="h-3.5 w-3.5" />
                Configure in Inventory Config
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: Store Mismatch Alert Modal                                       */}
      {/* ========================================================================= */}
      {storeMismatchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white shadow-2xl overflow-hidden">
            <div className="border-b border-rose-100 bg-rose-50/90 px-5 py-4">
              <div className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-100 text-rose-700">
                  <Icon name="alertCircle" className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="text-sm font-bold text-rose-950">Store ID Mismatch</h3>
                  <p className="text-xs text-rose-800">Cannot combine multiple stores in one TO</p>
                </div>
              </div>
            </div>
            <div className="p-5 space-y-3">
              <p className="text-xs text-slate-700 leading-relaxed">
                The selected requests originate from multiple source stores:
              </p>
              <div className="flex flex-wrap gap-2">
                {mismatchStores.map(store => (
                  <span
                    key={store}
                    className="inline-flex items-center rounded-md bg-rose-50 px-2 py-1 font-mono text-xs font-bold text-rose-700 ring-1 ring-rose-200"
                  >
                    {store}
                  </span>
                ))}
              </div>
              <p className="text-xs text-slate-500">
                All requests in a single Transfer Order must belong to the exact same source store. Please filter by store ID and accept them in separate batches.
              </p>
            </div>
            <div className="flex justify-end border-t border-slate-100 bg-slate-50/80 px-5 py-3">
              <button
                type="button"
                onClick={() => dispatch(setStoreMismatchModalOpen(false))}
                className="rounded-md bg-slate-800 px-4 py-1.5 text-xs font-semibold text-white hover:bg-slate-900"
              >
                Understood
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: Bulk Reject Confirmation Modal                                   */}
      {/* ========================================================================= */}
      {rejectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white shadow-2xl overflow-hidden">
            <div className="border-b border-rose-100 bg-rose-50/90 px-5 py-4">
              <div className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-100 text-rose-700">
                  <Icon name="xCircle" className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="text-sm font-bold text-rose-950">Confirm Rejection</h3>
                  <p className="text-xs text-rose-800">Reject {selectedIds.length} request(s)</p>
                </div>
              </div>
            </div>
            <div className="p-5">
              <p className="text-xs text-slate-700 leading-relaxed">
                Are you sure you want to reject the <strong>{selectedIds.length}</strong> selected QC testing request(s)?
                Their status will be updated to <span className="font-semibold text-rose-600">REJECTED</span>.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2.5 border-t border-slate-100 bg-slate-50/80 px-5 py-3">
              <button
                type="button"
                onClick={() => dispatch(setRejectModalOpen(false))}
                disabled={actionLoading}
                className="rounded-md border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                disabled={actionLoading}
                className="rounded-md bg-rose-600 px-4 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-rose-700 disabled:opacity-50 active:scale-[0.98]"
              >
                {actionLoading ? 'Rejecting…' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* GRN Details Modal */}
      <GrnDetailsModal
        grnId={selectedGrnIdForModal}
        isOpen={Boolean(selectedGrnIdForModal)}
        onClose={() => setSelectedGrnIdForModal(null)}
      />
    </div>
  )
}

function StatusBadge({ status }) {
  if (status === 'P' || status === 'PENDING') {
    return (
      <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-[10.5px] font-semibold text-amber-700 ring-1 ring-amber-200">
        PENDING
      </span>
    )
  }
  if (status === 'A' || status === 'ACCEPTED') {
    return (
      <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[10.5px] font-semibold text-emerald-700 ring-1 ring-emerald-200">
        ACCEPTED
      </span>
    )
  }
  if (status === 'R' || status === 'REJECTED') {
    return (
      <span className="inline-flex items-center rounded-full bg-rose-50 px-2 py-0.5 text-[10.5px] font-semibold text-rose-700 ring-1 ring-rose-200">
        REJECTED
      </span>
    )
  }
  return <span className="text-slate-400 text-xs">-</span>
}
