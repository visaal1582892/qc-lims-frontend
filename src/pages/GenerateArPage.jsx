import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  fetchGenerateArRequests,
  fetchNextProposedAr,
  generateArNumbersThunk,
  reviseTrfThunk,
  setPage,
  setFilter,
  resetFilters,
  toggleSelectRow,
  toggleSelectAllOnPage,
  clearSelection,
  openArModal,
  closeArModal,
  setSerialInput,
  openReviseModal,
  closeReviseModal,
  setReviseRemarks,
} from '../store/slices/generateArSlice'
import { qcRequestsApi } from '../api/qcRequests'
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
import TransferOrderDetailsModal from '../components/TransferOrderDetailsModal'
import GrnDetailsModal from '../components/GrnDetailsModal'

export default function GenerateArPage() {
  const dispatch = useDispatch()
  const { addToast } = useToast()
  const { hasRight } = useAuth()

  const canGenerateAr = hasRight(Rights.ROLE_SYSTEM_ADMIN) || hasRight(Rights.ROLE_AR_GENERATE_CREATE)
  const canReviseTrf = hasRight(Rights.ROLE_SYSTEM_ADMIN) || hasRight(Rights.ROLE_TRF_REVISE)
  const canDownloadTrf = hasRight(Rights.ROLE_SYSTEM_ADMIN) || hasRight(Rights.ROLE_TRF_DOWNLOAD) || hasRight(Rights.ROLE_AR_GENERATE_READ)

  const {
    items,
    total,
    totalPages,
    loading,
    page,
    pageSize,
    filters,
    selectedIds,
    modalOpen,
    targetIds,
    yearPrefix,
    serialInput,
    modalLoading,
    actionLoading,
    reviseModalOpen,
    selectedRequestForRevise,
    reviseRemarks,
    reviseLoading,
  } = useSelector((state) => state.generateAr)

  // Details modals
  const [selectedToIdForModal, setSelectedToIdForModal] = useState(null)
  const [selectedGrnIdForModal, setSelectedGrnIdForModal] = useState(null)

  // Pre-generation TO validation states
  const [validatingTo, setValidatingTo] = useState(false)
  const [missingToModalOpen, setMissingToModalOpen] = useState(false)
  const [missingToRequests, setMissingToRequests] = useState([])
  const [unreplenishedModalOpen, setUnreplenishedModalOpen] = useState(false)
  const [unreplenishedItems, setUnreplenishedItems] = useState([])

  const dRequestId = useDebounce(filters.requestId, 350)
  const dToId = useDebounce(filters.toId, 350)
  const dGrnId = useDebounce(filters.grnId, 350)
  const dStoreId = useDebounce(filters.storeId, 350)
  const dProductId = useDebounce(filters.productId, 350)
  const dBatchId = useDebounce(filters.batchId, 350)

  useEffect(() => {
    dispatch(fetchGenerateArRequests())
  }, [dispatch, page, dRequestId, dToId, dGrnId, dStoreId, dProductId, dBatchId])

  // Multi-step pre-generation validation upon clicking "Generate AR"
  const handleOpenBulkArModal = async () => {
    if (selectedIds.length === 0) return

    const selectedRows = items.filter((i) => selectedIds.includes(i.requestId))

    // Step 1: Check selected requests for missing TO ID (to_id == null or empty)
    const requestsWithoutTo = selectedRows.filter((r) => !r.toId || !r.toId.trim())
    if (requestsWithoutTo.length > 0) {
      setMissingToRequests(requestsWithoutTo)
      setMissingToModalOpen(true)
      return
    }

    // Step 2: Fetch TO details for all unique to_ids and verify existence & replenishment (status == 'T')
    const uniqueToIds = Array.from(new Set(selectedRows.map((r) => r.toId.trim()).filter(Boolean)))
    if (uniqueToIds.length === 0) {
      setMissingToRequests(selectedRows)
      setMissingToModalOpen(true)
      return
    }

    setValidatingTo(true)
    try {
      const res = await qcRequestsApi.getTransferOrderDetails(uniqueToIds)
      const toList = res.data || []
      const toMap = new Map()
      toList.forEach((to) => {
        if (to.toId) toMap.set(String(to.toId), to)
      })

      const unreplenished = []
      selectedRows.forEach((req) => {
        const toObj = toMap.get(String(req.toId))
        if (!toObj) {
          unreplenished.push({
            requestId: req.requestId,
            toId: req.toId,
            productId: req.productId,
            batchId: req.batchId,
            status: 'NOT_FOUND',
            statusDescription: 'Transfer Order not found in system',
          })
        } else if (toObj.status !== 'T') {
          unreplenished.push({
            requestId: req.requestId,
            toId: req.toId,
            productId: req.productId,
            batchId: req.batchId,
            status: toObj.status,
            statusDescription: toObj.statusDescription || toObj.status || 'Unreplenished',
          })
        }
      })

      if (unreplenished.length > 0) {
        setUnreplenishedItems(unreplenished)
        setUnreplenishedModalOpen(true)
        return
      }

      // Step 3: All TOs replenished -> proceed to AR generation sequence modal
      dispatch(openArModal(selectedIds))
      dispatch(fetchNextProposedAr())
    } catch (err) {
      addToast('error', `Failed to validate Transfer Orders: ${err.response?.data?.message || err.message}`)
    } finally {
      setValidatingTo(false)
    }
  }

  // Handle AR generation submit
  const handleGenerateSubmit = async (e) => {
    e.preventDefault()
    const customSeqInt = serialInput ? parseInt(serialInput, 10) : null
    try {
      const res = await dispatch(
        generateArNumbersThunk({ requestIds: targetIds, customSequence: customSeqInt })
      ).unwrap()
      const count = Object.keys(res.generatedArNumbers || {}).length
      addToast('success', `Generated ${count} AR Number(s) successfully!`)
    } catch (err) {
      addToast('error', `AR generation failed: ${err}`)
    }
  }

  // Handle Revise TRF submit
  const handleReviseSubmit = async (e) => {
    e.preventDefault()
    if (!selectedRequestForRevise) return
    try {
      await dispatch(
        reviseTrfThunk({
          requestId: selectedRequestForRevise.requestId,
          remarks: reviseRemarks,
        })
      ).unwrap()
      addToast('success', `Request #${selectedRequestForRevise.requestId} marked as NEEDS_REVISION!`)
    } catch (err) {
      addToast('error', `Failed to flag revision: ${err}`)
    }
  }

  // State for bulk revise modal
  const [bulkReviseModalOpen, setBulkReviseModalOpen] = useState(false)
  const [bulkReviseRemarks, setBulkReviseRemarks] = useState('')
  const [bulkReviseLoading, setBulkReviseLoading] = useState(false)

  // Handle Bulk Revise TRF submit
  const handleBulkReviseSubmit = async (e) => {
    e.preventDefault()
    if (selectedIds.length === 0 || !bulkReviseRemarks.trim()) return

    setBulkReviseLoading(true)
    try {
      const results = await Promise.allSettled(
        selectedIds.map((id) => qcRequestsApi.reviseTrf(id, bulkReviseRemarks.trim()))
      )
      const failed = results.filter((r) => r.status === 'rejected')
      if (failed.length === 0) {
        addToast('success', `Marked ${selectedIds.length} request(s) as NEEDS_REVISION!`)
      } else {
        addToast(
          'warning',
          `Updated ${selectedIds.length - failed.length} requests, but ${failed.length} failed.`
        )
      }
      setBulkReviseModalOpen(false)
      setBulkReviseRemarks('')
      dispatch(clearSelection())
      dispatch(fetchGenerateArRequests())
    } catch (err) {
      addToast('error', `Bulk revision failed: ${err.message || err}`)
    } finally {
      setBulkReviseLoading(false)
    }
  }

  // Download TRF document safely
  const handleDownloadTrf = (trfUrl, filename = 'trf-document.pdf') => {
    if (!trfUrl) return
    const downloadUrl = qcRequestsApi.getProxyDownloadUrl(trfUrl)
    const link = document.createElement('a')
    link.href = downloadUrl
    link.setAttribute('download', filename)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const allPageIds = items.map((i) => i.requestId)
  const isAllSelected = items.length > 0 && allPageIds.every((id) => selectedIds.includes(id))

  const hasActiveFilters = Boolean(
    filters.requestId ||
    filters.toId ||
    filters.grnId ||
    filters.storeId ||
    filters.productId ||
    filters.batchId
  )

  const handleClearFilters = () => {
    dispatch(resetFilters())
  }

  return (
    <div className="mx-auto flex h-full min-h-0 w-full flex-1 flex-col gap-3">
      {/* ================= PAGE HEADER ================= */}
      <header className="shrink-0 flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-teal-600 ring-1 ring-teal-100">
            <Icon name="badgeCheck" className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <h1 className="truncate text-lg font-semibold text-slate-900">Generate AR Number</h1>
            <p className="text-xs text-slate-500">
              {total} request{total === 1 ? '' : 's'} total • Showing verified requests awaiting AR number generation
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleClearFilters}
            disabled={!hasActiveFilters}
            className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-xs transition hover:bg-slate-50 disabled:opacity-40 active:scale-[0.98]"
            title="Clear all filters"
          >
            <Icon name="rotateCcw" className="h-3.5 w-3.5" />
            Clear Filters
          </button>
          <button
            type="button"
            onClick={() => dispatch(fetchGenerateArRequests())}
            className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 active:scale-[0.98]"
          >
            <Icon name="refreshCw" className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </header>

      {/* ================= FLOATING SELECTION BAR ================= */}
      {selectedIds.length > 0 && (
        <div className="shrink-0 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-teal-200 bg-teal-50/90 px-4 py-2.5 shadow-sm animate-in fade-in duration-150">
          <div className="flex items-center gap-2 text-xs font-semibold text-teal-900">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-teal-600 text-[11px] text-white">
              {selectedIds.length}
            </span>
            <span>request{selectedIds.length === 1 ? '' : 's'} selected</span>
            <button
              onClick={() => dispatch(clearSelection())}
              className="ml-2 text-xs font-medium text-teal-700 underline hover:text-teal-900"
            >
              Clear selection
            </button>
          </div>

          <div className="flex items-center gap-2">
            {canReviseTrf && (
              <button
                type="button"
                onClick={() => setBulkReviseModalOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-md bg-white border border-amber-300 px-3 py-1.5 text-xs font-semibold text-amber-700 shadow-xs transition hover:bg-amber-50 active:scale-[0.98]"
              >
                <Icon name="edit" className="h-3.5 w-3.5" />
                Revise TRFs
              </button>
            )}

            {canGenerateAr && (
              <button
                type="button"
                onClick={handleOpenBulkArModal}
                disabled={validatingTo}
                className="inline-flex items-center gap-1.5 rounded-md bg-teal-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs transition hover:bg-teal-700 disabled:opacity-50 active:scale-[0.98]"
              >
                {validatingTo ? (
                  <>
                    <Icon name="refreshCw" className="h-3.5 w-3.5 animate-spin" />
                    Validating TOs…
                  </>
                ) : (
                  <>
                    <Icon name="badgeCheck" className="h-3.5 w-3.5" />
                    Generate AR ({selectedIds.length})
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      )}

      {/* ================= DATA TABLE CONTAINER ================= */}
      <MasterPageLayout>
        <div className="flex-1 min-h-0 overflow-auto">
          <table className="w-full min-w-full text-xs">
            <MasterTableHeader>
              <MasterHeaderRow>
                <th className="w-10 px-2 py-2.5 text-center">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={() => dispatch(toggleSelectAllOnPage())}
                    className="h-3.5 w-3.5 rounded border-slate-300 text-teal-600 focus:ring-teal-500 cursor-pointer"
                  />
                </th>
                <th className="w-16 px-2.5 py-2.5">Req ID</th>
                <th className="w-35 px-2.5 py-2.5">Transfer Order</th>
                <th className="w-35 px-2.5 py-2.5">GRN ID</th>
                <th className="w-35 px-2.5 py-2.5">Store ID</th>
                <th className="w-35 px-2.5 py-2.5">Product ID</th>
                <th className="w-35 px-2.5 py-2.5">Batch ID</th>

                {/* FIXED / STICKY COLUMNS ON RIGHT */}
                <th className="w-[100px] min-w-[100px] max-w-[100px] sticky right-[120px] bg-slate-50 z-20 px-2.5 py-2.5 text-center shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.06)]">
                  Status
                </th>
                <th className="w-[120px] min-w-[120px] max-w-[120px] sticky right-0 bg-slate-50 z-20 px-2.5 py-2.5 text-center">
                  TRF URL
                </th>
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
                      className="text-slate-400 hover:text-teal-600 transition"
                    >
                      <Icon name="rotateCcw" className="h-3 w-3 mx-auto" />
                    </button>
                  ) : null}
                </th>
                <th className="px-2 py-1.5">
                  <FilterInput
                    value={filters.requestId}
                    onChange={(val) => dispatch(setFilter({ key: 'requestId', value: val }))}
                    placeholder="Req…"
                  />
                </th>
                <th className="px-2 py-1.5">
                  <FilterInput
                    value={filters.toId}
                    onChange={(val) => dispatch(setFilter({ key: 'toId', value: val }))}
                    placeholder="TO ID…"
                  />
                </th>
                <th className="px-2 py-1.5">
                  <FilterInput
                    value={filters.grnId}
                    onChange={(val) => dispatch(setFilter({ key: 'grnId', value: val }))}
                    placeholder="GRN…"
                  />
                </th>
                <th className="px-2 py-1.5">
                  <FilterInput
                    value={filters.storeId}
                    onChange={(val) => dispatch(setFilter({ key: 'storeId', value: val }))}
                    placeholder="Store…"
                  />
                </th>
                <th className="px-2 py-1.5">
                  <FilterInput
                    value={filters.productId}
                    onChange={(val) => dispatch(setFilter({ key: 'productId', value: val }))}
                    placeholder="Prod ID…"
                  />
                </th>
                <th className="px-2 py-1.5">
                  <FilterInput
                    value={filters.batchId}
                    onChange={(val) => dispatch(setFilter({ key: 'batchId', value: val }))}
                    placeholder="Batch ID…"
                  />
                </th>
                {/* FIXED COLUMNS FILTERS */}
                <th className="w-[100px] min-w-[100px] max-w-[100px] sticky right-[120px] bg-slate-50 z-20 shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.06)]" />
                <th className="w-[120px] min-w-[120px] max-w-[120px] sticky right-0 bg-slate-50 z-20" />
              </MasterFilterRow>
            </MasterTableHeader>

            <tbody className="divide-y divide-slate-100 bg-white">
              {loading ? (
                <TableStatusRow colSpan={9}>Loading verified requests…</TableStatusRow>
              ) : items.length === 0 ? (
                <TableStatusRow colSpan={9}>
                  No accepted requests with verified TRFs awaiting AR number generation.
                </TableStatusRow>
              ) : (
                items.map((item) => {
                  const isSelected = selectedIds.includes(item.requestId)
                  return (
                    <tr
                      key={item.requestId}
                      className={`group transition ${
                        isSelected ? 'bg-teal-50' : 'hover:bg-slate-50'
                      }`}
                    >
                      <td className="px-2 py-2 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => dispatch(toggleSelectRow(item.requestId))}
                          className="h-3.5 w-3.5 rounded border-slate-300 text-teal-600 focus:ring-teal-500 cursor-pointer"
                        />
                      </td>
                      <td className="px-2.5 py-2 font-mono text-[11px] text-slate-700">
                        {item.requestId}
                      </td>
                      <td className="px-2.5 py-2 font-mono text-[11px]">
                        {item.toId ? (
                          <button
                            type="button"
                            onClick={() => setSelectedToIdForModal(item.toId)}
                            className="font-semibold text-teal-700 hover:text-teal-900 hover:underline cursor-pointer"
                            title="View Transfer Order Details"
                          >
                            {item.toId}
                          </button>
                        ) : (
                          '-'
                        )}
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

                      {/* FIXED STATUS COLUMN */}
                      <td
                        className={`w-[100px] min-w-[100px] max-w-[100px] px-2.5 py-2 text-center sticky right-[120px] z-10 shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.06)] ${
                          isSelected ? 'bg-teal-50' : 'bg-white group-hover:bg-slate-50'
                        }`}
                      >
                        <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[10.5px] font-semibold text-emerald-700 ring-1 ring-emerald-200">
                          ACCEPTED
                        </span>
                      </td>

                      {/* FIXED TRF ACTION BUTTONS COLUMN */}
                      <td
                        className={`w-[120px] min-w-[120px] max-w-[120px] px-2.5 py-2 text-center sticky right-0 z-10 ${
                          isSelected ? 'bg-teal-50' : 'bg-white group-hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Eye Button: View TRF */}
                          {canDownloadTrf && (
                            <button
                              type="button"
                              onClick={() => window.open(item.trfUrl, '_blank', 'noopener,noreferrer')}
                              title="View TRF Document"
                              className="flex h-7 w-7 items-center justify-center rounded-full bg-teal-50 text-teal-700 ring-1 ring-teal-200/70 transition hover:bg-teal-600 hover:text-white"
                            >
                              <Icon name="eye" className="h-3.5 w-3.5" />
                            </button>
                          )}

                          {/* Download Button: Download TRF */}
                          {canDownloadTrf && (
                            <button
                              type="button"
                              onClick={() => handleDownloadTrf(item.trfUrl, `TRF_${item.requestId}.pdf`)}
                              title="Download TRF Document"
                              className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-slate-700 ring-1 ring-slate-200 transition hover:bg-slate-700 hover:text-white"
                            >
                              <Icon name="download" className="h-3.5 w-3.5" />
                            </button>
                          )}

                          {/* Revise Button: Individual Row Revise Action */}
                          {canReviseTrf && (
                            <button
                              type="button"
                              onClick={() => dispatch(openReviseModal(item))}
                              title="Revise TRF Document"
                              className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-50 text-amber-700 ring-1 ring-amber-200 transition hover:bg-amber-600 hover:text-white"
                            >
                              <Icon name="edit" className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ================= PAGINATION ================= */}
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

      {/* ================= MODAL: GENERATE AR NUMBER ================= */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl ring-1 ring-slate-900/10">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-100 text-teal-700">
                  <Icon name="badgeCheck" className="h-4 w-4" />
                </span>
                <h3 className="text-sm font-bold text-slate-900">Generate AR Number</h3>
              </div>
              <button
                onClick={() => dispatch(closeArModal())}
                className="text-slate-400 hover:text-slate-600"
              >
                <Icon name="x" className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleGenerateSubmit} className="mt-4 space-y-4">
              <p className="text-xs text-slate-600 leading-relaxed">
                Assigning AR numbers for <span className="font-bold text-teal-700">{targetIds.length}</span> verified request(s).
              </p>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Proposed Starting AR Number
                </label>
                {modalLoading ? (
                  <div className="h-10 animate-pulse rounded-lg bg-slate-100" />
                ) : (
                  <div className="flex rounded-lg border border-slate-300 shadow-sm focus-within:border-teal-500 focus-within:ring-1 focus-within:ring-teal-500">
                    <span className="inline-flex items-center rounded-l-lg bg-slate-100 px-3 font-mono text-xs font-semibold text-slate-600">
                      {yearPrefix}
                    </span>
                    <input
                      type="text"
                      maxLength={4}
                      value={serialInput}
                      onChange={(e) => dispatch(setSerialInput(e.target.value.replace(/\D/g, '')))}
                      className="block w-full flex-1 rounded-none rounded-r-lg border-0 py-2 px-3 font-mono text-xs font-bold text-slate-900 focus:ring-0"
                      placeholder="0001"
                      required
                    />
                  </div>
                )}
                <p className="mt-1 text-[10px] text-slate-400">
                  Format: MHSL + Year (2 digits) + 4-digit sequence (e.g. MHSL260001)
                </p>
              </div>

              <div className="mt-6 flex justify-end gap-2 border-t border-slate-100 pt-3">
                <button
                  type="button"
                  onClick={() => dispatch(closeArModal())}
                  disabled={actionLoading}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading || modalLoading || !serialInput}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-teal-600 px-4 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-teal-700 disabled:opacity-50"
                >
                  {actionLoading ? (
                    <>
                      <Icon name="refreshCw" className="h-3.5 w-3.5 animate-spin" />
                      Generating…
                    </>
                  ) : (
                    'Confirm & Generate'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: REVISE TRF ================= */}
      {reviseModalOpen && selectedRequestForRevise && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl ring-1 ring-slate-900/10">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
                  <Icon name="edit" className="h-4 w-4" />
                </span>
                <h3 className="text-sm font-bold text-slate-900">Request TRF Revision</h3>
              </div>
              <button
                onClick={() => dispatch(closeReviseModal())}
                className="text-slate-400 hover:text-slate-600"
              >
                <Icon name="x" className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleReviseSubmit} className="mt-4 space-y-4">
              <div className="rounded-lg bg-amber-50/70 p-3 text-xs text-amber-900 border border-amber-200/60">
                <p className="font-semibold">
                  Request #{selectedRequestForRevise.requestId} — {selectedRequestForRevise.productName}
                </p>
                <p className="text-[11px] text-amber-800 mt-0.5">
                  Batch: {selectedRequestForRevise.batch || selectedRequestForRevise.batchId}
                </p>
                <p className="mt-1 text-[11px]">
                  Flagging this document will move the request back to the <strong>Upload TRFs</strong> page for a replacement file.
                </p>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Revision Reason / Remarks <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  value={reviseRemarks}
                  onChange={(e) => dispatch(setReviseRemarks(e.target.value))}
                  placeholder="e.g., Illegible scan, missing analyst signature, incorrect product name…"
                  maxLength={500}
                  required
                  className="w-full rounded-lg border border-slate-300 p-2.5 text-xs text-slate-900 shadow-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                />
                <span className="block text-right text-[10px] text-slate-400 mt-0.5">
                  {reviseRemarks.length}/500
                </span>
              </div>

              <div className="mt-6 flex justify-end gap-2 border-t border-slate-100 pt-3">
                <button
                  type="button"
                  onClick={() => dispatch(closeReviseModal())}
                  disabled={reviseLoading}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={reviseLoading || !reviseRemarks.trim()}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-4 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-amber-700 disabled:opacity-50"
                >
                  {reviseLoading ? (
                    <>
                      <Icon name="refreshCw" className="h-3.5 w-3.5 animate-spin" />
                      Submitting…
                    </>
                  ) : (
                    'Submit Revision'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* ================= MODAL: BULK REVISE TRF ================= */}
      {bulkReviseModalOpen && selectedIds.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl ring-1 ring-slate-900/10">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
                  <Icon name="edit" className="h-4 w-4" />
                </span>
                <h3 className="text-sm font-bold text-slate-900">Bulk Request TRF Revision</h3>
              </div>
              <button
                onClick={() => {
                  setBulkReviseModalOpen(false)
                  setBulkReviseRemarks('')
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                <Icon name="x" className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleBulkReviseSubmit} className="mt-4 space-y-4">
              <div className="rounded-lg bg-amber-50/70 p-3 text-xs text-amber-900 border border-amber-200/60">
                <p className="font-semibold">
                  Flagging <span className="font-bold text-amber-800">{selectedIds.length}</span> request(s) for TRF revision
                </p>
                <p className="mt-1 text-[11px]">
                  All selected requests will be marked as <strong>NEEDS_REVISION</strong> and moved back to the <strong>Upload TRFs</strong> page.
                </p>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Revision Reason / Remarks <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  value={bulkReviseRemarks}
                  onChange={(e) => setBulkReviseRemarks(e.target.value)}
                  placeholder="e.g., Illegible scans, missing signatures, or document discrepancies…"
                  maxLength={500}
                  required
                  className="w-full rounded-lg border border-slate-300 p-2.5 text-xs text-slate-900 shadow-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                />
                <span className="block text-right text-[10px] text-slate-400 mt-0.5">
                  {bulkReviseRemarks.length}/500
                </span>
              </div>

              <div className="mt-6 flex justify-end gap-2 border-t border-slate-100 pt-3">
                <button
                  type="button"
                  onClick={() => {
                    setBulkReviseModalOpen(false)
                    setBulkReviseRemarks('')
                  }}
                  disabled={bulkReviseLoading}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={bulkReviseLoading || !bulkReviseRemarks.trim()}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-4 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-amber-700 disabled:opacity-50"
                >
                  {bulkReviseLoading ? (
                    <>
                      <Icon name="refreshCw" className="h-3.5 w-3.5 animate-spin" />
                      Submitting…
                    </>
                  ) : (
                    `Revise ${selectedIds.length} TRFs`
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: TRANSFER ORDER DETAILS ================= */}
      <TransferOrderDetailsModal
        toId={selectedToIdForModal}
        isOpen={Boolean(selectedToIdForModal)}
        onClose={() => setSelectedToIdForModal(null)}
      />

      {/* ================= MODAL: GRN DETAILS ================= */}
      <GrnDetailsModal
        grnId={selectedGrnIdForModal}
        isOpen={Boolean(selectedGrnIdForModal)}
        onClose={() => setSelectedGrnIdForModal(null)}
      />

      {/* ================= MODAL: MISSING TO ERROR MODAL ================= */}
      {missingToModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-xl rounded-xl border border-slate-200 bg-white shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="border-b border-rose-100 bg-rose-50/80 px-5 py-4">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-rose-100 text-rose-600 ring-1 ring-rose-200">
                  <Icon name="alertCircle" className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Transfer Orders Missing</h3>
                  <p className="text-xs text-rose-700 font-medium">
                    Transfer orders are not there for those requests to generate ars.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-3">
              <p className="text-xs text-slate-600">
                The following <strong className="text-slate-900">{missingToRequests.length}</strong> selected request(s) do not have an associated Transfer Order ID. Requests must have an initiated and replenished Transfer Order before AR numbers can be generated:
              </p>

              <div className="rounded-lg border border-slate-200 overflow-hidden shadow-2xs">
                <div className="max-h-60 overflow-y-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="sticky top-0 bg-slate-50 text-[10.5px] font-semibold uppercase text-slate-500 border-b border-slate-200">
                      <tr>
                        <th className="px-3 py-2">Req ID</th>
                        <th className="px-3 py-2">Store ID</th>
                        <th className="px-3 py-2">Product ID</th>
                        <th className="px-3 py-2">Batch ID</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {missingToRequests.map((req) => (
                        <tr key={req.requestId} className="hover:bg-slate-50/70">
                          <td className="px-3 py-2 font-mono font-semibold text-slate-900">{req.requestId}</td>
                          <td className="px-3 py-2 font-mono text-slate-700">{req.fromStoreId || '-'}</td>
                          <td className="px-3 py-2 font-mono text-slate-700 font-medium">{req.productId}</td>
                          <td className="px-3 py-2 font-mono text-slate-600">{req.batchId}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end border-t border-slate-100 bg-slate-50/60 px-5 py-3">
              <button
                type="button"
                onClick={() => {
                  setMissingToModalOpen(false)
                  setMissingToRequests([])
                }}
                className="rounded-lg bg-white px-4 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs ring-1 ring-slate-300 ring-inset hover:bg-slate-50 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: UNREPLENISHED TO ERROR MODAL ================= */}
      {unreplenishedModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-2xl rounded-xl border border-slate-200 bg-white shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="border-b border-amber-100 bg-amber-50/80 px-5 py-4">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100 text-amber-700 ring-1 ring-amber-200">
                  <Icon name="truck" className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Transfer Order Not Replenished</h3>
                  <p className="text-xs text-amber-800 font-medium">
                    Transfer order is not yet replenished.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-3">
              <p className="text-xs text-slate-600">
                The following <strong className="text-slate-900">{unreplenishedItems.length}</strong> request(s) are linked to Transfer Orders that are either missing or have not yet reached <strong>Replenished (T)</strong> status:
              </p>

              <div className="rounded-lg border border-slate-200 overflow-hidden shadow-2xs">
                <div className="max-h-60 overflow-y-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="sticky top-0 bg-slate-50 text-[10.5px] font-semibold uppercase text-slate-500 border-b border-slate-200">
                      <tr>
                        <th className="px-3 py-2">Req ID</th>
                        <th className="px-3 py-2">Transfer Order</th>
                        <th className="px-3 py-2">Current Status</th>
                        <th className="px-3 py-2">Product ID</th>
                        <th className="px-3 py-2">Batch ID</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {unreplenishedItems.map((item, idx) => (
                        <tr key={`${item.requestId}-${idx}`} className="hover:bg-slate-50/70">
                          <td className="px-3 py-2 font-mono font-semibold text-slate-900">{item.requestId}</td>
                          <td className="px-3 py-2 font-mono font-semibold text-teal-700">{item.toId || '-'}</td>
                          <td className="px-3 py-2">
                            <span
                              className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10.5px] font-semibold ring-1 ring-inset ${
                                item.status === 'T'
                                  ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20'
                                  : item.status === 'NOT_FOUND'
                                  ? 'bg-rose-50 text-rose-700 ring-rose-600/20'
                                  : 'bg-amber-50 text-amber-700 ring-amber-600/20'
                              }`}
                            >
                              {item.statusDescription || item.status}
                            </span>
                          </td>
                          <td className="px-3 py-2 font-mono text-slate-700">{item.productId}</td>
                          <td className="px-3 py-2 font-mono text-slate-600">{item.batchId}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end border-t border-slate-100 bg-slate-50/60 px-5 py-3">
              <button
                type="button"
                onClick={() => {
                  setUnreplenishedModalOpen(false)
                  setUnreplenishedItems([])
                }}
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
