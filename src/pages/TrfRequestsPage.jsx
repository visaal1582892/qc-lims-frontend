import { useEffect, useState, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import {
  fetchTrfRequests,
  approveTrfThunk,
  reviseTrfRequestThunk,
  setPage,
  setFilter,
  resetFilters,
} from '../store/slices/trfRequestsSlice'
import { useToast } from '../components/Toast'
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
import ActionReasonModal from '../components/ActionReasonModal'
import TransferOrderDetailsModal from '../components/TransferOrderDetailsModal'
import GrnDetailsModal from '../components/GrnDetailsModal'
import ProductIdLink from '../components/ProductIdLink'
import useDebounce from '../hooks/useDebounce'
import useAuth from '../auth/useAuth'
import { Rights } from '../constants/rights'
import { downloadFileFromProxy, viewFile } from '../utils/fileDownload'
import { normalizeTrfStatus } from '../utils/trfStatus'
import TrfStatusBadge from '../components/TrfStatusBadge'

export default function TrfRequestsPage() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const toast = useToast()
  const { hasRight } = useAuth()

  const canEditTrf =
    hasRight(Rights.ROLE_SYSTEM_ADMIN) ||
    hasRight(Rights.ROLE_E_TRF_WRITE) ||
    hasRight(Rights.ROLE_TRF_UPLOAD)
  const canApproveTrf =
    hasRight(Rights.ROLE_SYSTEM_ADMIN) ||
    hasRight(Rights.ROLE_TRF_APPROVE)
  const canReviseTrf =
    hasRight(Rights.ROLE_SYSTEM_ADMIN) ||
    hasRight(Rights.ROLE_TRF_REVISE)
  const canDownloadTrf =
    hasRight(Rights.ROLE_SYSTEM_ADMIN) ||
    hasRight(Rights.ROLE_TRF_DOWNLOAD) ||
    hasRight(Rights.ROLE_TRF_READ)

  const {
    items,
    total,
    totalPages,
    loading,
    error,
    actionLoading,
    page,
    pageSize,
    filters,
  } = useSelector((state) => state.trfRequests)

  // Details modals
  const [selectedToIdForModal, setSelectedToIdForModal] = useState(null)
  const [selectedGrnIdForModal, setSelectedGrnIdForModal] = useState(null)

  // Kebab dropdown menu open row
  const [activeMenuId, setActiveMenuId] = useState(null)
  const menuRef = useRef(null)

  // Approve confirmation modal state
  const [approveModalItem, setApproveModalItem] = useState(null)

  // Revise remarks modal state
  const [reviseModalItem, setReviseModalItem] = useState(null)

  // View Revision Remarks modal state
  const [remarksModalItem, setRemarksModalItem] = useState(null)

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setActiveMenuId(null)
      }
    }
    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setActiveMenuId(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  const dRequestId = useDebounce(filters.requestId, 350)
  const dToId = useDebounce(filters.toId, 350)
  const dGrnId = useDebounce(filters.grnId, 350)
  const dStoreId = useDebounce(filters.storeId, 350)
  const dProductId = useDebounce(filters.productId, 350)
  const dBatchId = useDebounce(filters.batchId, 350)

  useEffect(() => {
    dispatch(fetchTrfRequests())
  }, [
    dispatch,
    page,
    dRequestId,
    dToId,
    dGrnId,
    dStoreId,
    dProductId,
    dBatchId,
    filters.trfStatus,
  ])

  const hasActiveFilters = Boolean(
    filters.requestId ||
    filters.toId ||
    filters.grnId ||
    filters.storeId ||
    filters.productId ||
    filters.batchId ||
    (filters.trfStatus && filters.trfStatus !== 'all')
  )

  const handleClearFilters = () => {
    dispatch(resetFilters())
  }

  const handleConfirmApprove = async () => {
    if (!approveModalItem) return
    try {
      await dispatch(approveTrfThunk({ requestId: approveModalItem.requestId })).unwrap()
      toast.success(`TRF for Request #${approveModalItem.requestId} approved successfully!`)
      setApproveModalItem(null)
    } catch (err) {
      toast.error(err || 'Failed to approve TRF')
    }
  }

  const handleSubmitRevision = async (remarks) => {
    if (!reviseModalItem) return
    try {
      await dispatch(
        reviseTrfRequestThunk({
          requestId: reviseModalItem.requestId,
          remarks,
        })
      ).unwrap()
      toast.success(`TRF for Request #${reviseModalItem.requestId} marked as NEEDS REVISION.`)
      setReviseModalItem(null)
    } catch (err) {
      toast.error(err || 'Failed to flag TRF for revision')
    }
  }

  return (
    <div className="mx-auto flex h-full min-h-0 w-full flex-1 flex-col gap-3">
      {/* Page Header */}
      <header className="shrink-0 flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-teal-600 ring-1 ring-teal-100">
            <Icon name="fileText" className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <h1 id="trf-requests-heading" className="truncate text-lg font-semibold text-slate-900">
              TRF Requests
            </h1>
            <p className="text-xs text-slate-500">
              {total} request{total === 1 ? '' : 's'} total • Complete electronic TRFs, review pending approvals, or track revision remarks
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
            onClick={() => dispatch(fetchTrfRequests())}
            className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 active:scale-[0.98]"
          >
            <Icon name="refreshCw" className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </header>

      {/* Table Container */}
      <MasterPageLayout>
        <div
          tabIndex={0}
          role="region"
          aria-labelledby="trf-requests-heading"
          className="flex-1 min-h-0 overflow-auto focus-visible:outline-none"
        >
          <table className="w-full min-w-max border-separate border-spacing-0 text-left text-xs">
            <caption className="sr-only">
              Accepted QC testing requests with E-TRF details, documents, and approval workflow status
            </caption>
            <MasterTableHeader className="z-30">
              <MasterHeaderRow>
                <th scope="col" className="w-16 px-2.5 py-2.5">Req ID</th>
                <th scope="col" className="w-32 px-2.5 py-2.5">Transfer Order</th>
                <th scope="col" className="w-32 px-2.5 py-2.5">GRN ID</th>
                <th scope="col" className="w-28 px-2.5 py-2.5">Store ID</th>
                <th scope="col" className="w-32 px-2.5 py-2.5">Product ID</th>
                <th scope="col" className="w-36 px-2.5 py-2.5">Batch ID</th>

                {/* Sticky Columns on Right */}
                <th
                  scope="col"
                  className="w-[90px] min-w-[90px] max-w-[90px] sticky right-[250px] bg-slate-50 z-20 px-2.5 py-2.5 text-center shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.06)]"
                >
                  TRF File
                </th>
                <th
                  scope="col"
                  className="w-[170px] min-w-[170px] max-w-[170px] sticky right-[80px] bg-slate-50 z-20 px-2.5 py-2.5 text-center"
                >
                  Status
                </th>
                <th
                  scope="col"
                  className="w-[80px] min-w-[80px] max-w-[80px] sticky right-0 bg-slate-50 z-20 px-2.5 py-2.5 text-center"
                >
                  Actions
                </th>
              </MasterHeaderRow>

              <MasterFilterRow>
                <th className="px-1.5 py-1.5">
                  <FilterInput
                    value={filters.requestId}
                    onChange={(val) => dispatch(setFilter({ key: 'requestId', value: val }))}
                    placeholder="Req…"
                  />
                </th>
                <th className="px-1.5 py-1.5">
                  <FilterInput
                    value={filters.toId}
                    onChange={(val) => dispatch(setFilter({ key: 'toId', value: val }))}
                    placeholder="TO ID…"
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

                <th className="w-[90px] min-w-[90px] max-w-[90px] sticky right-[250px] bg-slate-50 z-20 px-2 py-1.5 text-center text-[11px] font-normal text-slate-400 shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.06)]">
                  —
                </th>
                <th className="w-[170px] min-w-[170px] max-w-[170px] sticky right-[80px] bg-slate-50 z-20 px-1.5 py-1.5">
                  <FilterSelect
                    value={filters.trfStatus}
                    onChange={(val) => dispatch(setFilter({ key: 'trfStatus', value: val }))}
                    options={[
                      ['all', 'All Statuses'],
                      ['PD', 'Pending Details'],
                      ['PA', 'Pending Approval'],
                      ['N', 'Needs Revision'],
                      ['A', 'Approved'],
                    ]}
                  />
                </th>
                <th className="w-[80px] min-w-[80px] max-w-[80px] sticky right-0 bg-slate-50 z-20 px-1.5 py-1.5 text-center text-[11px] font-normal text-slate-400">
                  —
                </th>
              </MasterFilterRow>
            </MasterTableHeader>

            <tbody className="divide-y divide-slate-100 bg-white">
              {loading ? (
                <TableStatusRow colSpan={9}>Loading TRF requests…</TableStatusRow>
              ) : error ? (
                <TableStatusRow colSpan={9}>
                  <div className="flex flex-col items-center gap-2 text-rose-600">
                    <Icon name="alertTriangle" className="h-5 w-5" />
                    <p className="text-xs font-semibold">Failed to load TRF requests: {error}</p>
                  </div>
                </TableStatusRow>
              ) : items.length === 0 ? (
                <TableStatusRow colSpan={9}>
                  {hasActiveFilters
                    ? 'No matching TRF requests found for your filters.'
                    : 'No accepted QC requests available for TRF processing.'}
                </TableStatusRow>
              ) : (
                items.map((item) => {
                  const isMenuOpen = activeMenuId === item.requestId
                  const normalizedStatus = normalizeTrfStatus(item.trfStatus)
                  const isPendingDetails = normalizedStatus === 'PENDING_DETAILS'
                  const isPendingApproval = normalizedStatus === 'PENDING_APPROVAL'
                  const isNeedsRevision = normalizedStatus === 'NEEDS_REVISION'
                  const isApproved = normalizedStatus === 'APPROVED'

                  return (
                    <tr
                      key={item.requestId}
                      className={`group transition-colors hover:bg-slate-50/80 ${isMenuOpen ? 'relative z-50' : ''}`}
                    >
                      <td className="px-2.5 py-2 font-mono text-[11px] font-semibold text-slate-800">
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

                      <td className="px-2.5 py-2 font-mono text-[11px]">
                        <ProductIdLink productId={item.productId} />
                      </td>

                      <td className="px-2.5 py-2 font-mono text-[11px] text-slate-700">
                        <div>{item.batchId}</div>
                        {item.batch && (
                          <div className="text-[10px] text-slate-400">{item.batch}</div>
                        )}
                      </td>

                      {/* TRF FILE (STICKY) */}
                      <td className="w-[90px] min-w-[90px] max-w-[90px] sticky right-[250px] bg-white group-hover:bg-slate-50 z-10 px-2.5 py-2 text-center shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.06)]">
                        {item.trfUrl ? (
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => viewFile(item.trfUrl)}
                              title="View Attached TRF Document"
                              className="flex h-6 w-6 items-center justify-center rounded-full bg-teal-50 text-teal-700 ring-1 ring-teal-200/80 transition hover:bg-teal-600 hover:text-white cursor-pointer"
                            >
                              <Icon name="eye" className="h-3 w-3" />
                            </button>
                            {canDownloadTrf && (
                              <button
                                type="button"
                                onClick={() => downloadFileFromProxy(item.trfUrl, `TRF_Req_${item.requestId}`, toast)}
                                title="Download Attached TRF Document"
                                className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-slate-700 ring-1 ring-slate-200 transition hover:bg-slate-700 hover:text-white cursor-pointer"
                              >
                                <Icon name="download" className="h-3 w-3" />
                              </button>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>

                      {/* NORMALIZED STATUS (STICKY) */}
                      <td className="w-[170px] min-w-[170px] max-w-[170px] sticky right-[80px] bg-white group-hover:bg-slate-50 z-10 px-2.5 py-2 text-center">
                        <div className="flex flex-col items-center">
                          <TrfStatusBadge status={normalizedStatus} />
                        </div>
                      </td>

                      {/* ACTIONS KEBAB MENU (STICKY) */}
                      <td
                        className={`w-[80px] min-w-[80px] max-w-[80px] sticky right-0 bg-white group-hover:bg-slate-50 ${
                          isMenuOpen ? 'z-50' : 'z-10'
                        } px-2.5 py-2 text-center`}
                      >
                        <div className="relative inline-block text-left" ref={isMenuOpen ? menuRef : null}>
                          <button
                            type="button"
                            aria-haspopup="menu"
                            aria-expanded={isMenuOpen}
                            aria-label={`Actions for Request #${item.requestId}`}
                            onClick={() => setActiveMenuId(isMenuOpen ? null : item.requestId)}
                            className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition cursor-pointer"
                          >
                            <Icon name="moreVertical" className="h-4 w-4" />
                          </button>

                          {isMenuOpen && (
                            <div
                              role="menu"
                              className="absolute right-0 z-50 mt-1 w-48 origin-top-right rounded-xl bg-white shadow-xl ring-1 ring-slate-900/10 py-1 text-xs divide-y divide-slate-100 animate-in fade-in zoom-in-95 duration-100"
                            >
                              {/* PENDING_DETAILS / NEEDS_REVISION actions */}
                              {(isPendingDetails || isNeedsRevision) && (
                                <div className="py-1">
                                  {canEditTrf ? (
                                    <button
                                      type="button"
                                      role="menuitem"
                                      onClick={() => {
                                        setActiveMenuId(null)
                                        navigate(`/e-trf/${item.requestId}`)
                                      }}
                                      className="flex w-full items-center gap-2 px-3 py-1.5 text-left font-medium text-indigo-700 hover:bg-indigo-50 cursor-pointer"
                                    >
                                      <Icon name="edit" className="h-3.5 w-3.5 text-indigo-600" />
                                      Edit TRF
                                    </button>
                                  ) : (
                                    <button
                                      type="button"
                                      role="menuitem"
                                      onClick={() => {
                                        setActiveMenuId(null)
                                        navigate(`/e-trf/${item.requestId}/view`)
                                      }}
                                      className="flex w-full items-center gap-2 px-3 py-1.5 text-left font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
                                    >
                                      <Icon name="eye" className="h-3.5 w-3.5 text-slate-500" />
                                      View TRF
                                    </button>
                                  )}

                                  {isNeedsRevision && item.trfRemarks && (
                                    <button
                                      type="button"
                                      role="menuitem"
                                      onClick={() => {
                                        setActiveMenuId(null)
                                        setRemarksModalItem(item)
                                      }}
                                      className="flex w-full items-center gap-2 px-3 py-1.5 text-left font-medium text-amber-700 hover:bg-amber-50 cursor-pointer"
                                    >
                                      <Icon name="messageSquare" className="h-3.5 w-3.5 text-amber-600" />
                                      Revision Remarks
                                    </button>
                                  )}
                                </div>
                              )}

                              {/* PENDING_APPROVAL actions */}
                              {isPendingApproval && (
                                <>
                                  <div className="py-1">
                                    <button
                                      type="button"
                                      role="menuitem"
                                      onClick={() => {
                                        setActiveMenuId(null)
                                        navigate(`/e-trf/${item.requestId}/view`)
                                      }}
                                      className="flex w-full items-center gap-2 px-3 py-1.5 text-left font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
                                    >
                                      <Icon name="eye" className="h-3.5 w-3.5 text-slate-500" />
                                      View TRF
                                    </button>
                                  </div>
                                  {(canApproveTrf || canReviseTrf) && (
                                    <div className="py-1">
                                      {canApproveTrf && (
                                        <button
                                          type="button"
                                          role="menuitem"
                                          onClick={() => {
                                            setActiveMenuId(null)
                                            setApproveModalItem(item)
                                          }}
                                          className="flex w-full items-center gap-2 px-3 py-1.5 text-left font-medium text-emerald-700 hover:bg-emerald-50 cursor-pointer"
                                        >
                                          <Icon name="checkCircle2" className="h-3.5 w-3.5 text-emerald-600" />
                                          Approve TRF
                                        </button>
                                      )}
                                      {canReviseTrf && (
                                        <button
                                          type="button"
                                          role="menuitem"
                                          onClick={() => {
                                            setActiveMenuId(null)
                                            setReviseModalItem(item)
                                          }}
                                          className="flex w-full items-center gap-2 px-3 py-1.5 text-left font-medium text-amber-700 hover:bg-amber-50 cursor-pointer"
                                        >
                                          <Icon name="refreshCw" className="h-3.5 w-3.5 text-amber-600" />
                                          Revise TRF
                                        </button>
                                      )}
                                    </div>
                                  )}
                                </>
                              )}

                              {/* APPROVED actions */}
                              {isApproved && (
                                <div className="py-1">
                                  <button
                                    type="button"
                                    role="menuitem"
                                    onClick={() => {
                                      setActiveMenuId(null)
                                      navigate(`/e-trf/${item.requestId}/view`)
                                    }}
                                    className="flex w-full items-center gap-2 px-3 py-1.5 text-left font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
                                  >
                                    <Icon name="eye" className="h-3.5 w-3.5 text-slate-500" />
                                    View TRF
                                  </button>
                                </div>
                              )}
                            </div>
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

      {/* ================= MODAL: APPROVE TRF CONFIRMATION (No remarks needed) ================= */}
      {approveModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl ring-1 ring-slate-900/10">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                  <Icon name="checkCircle2" className="h-4 w-4" />
                </span>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Approve TRF Request</h3>
                  <p className="text-[11px] text-slate-500">Request #{approveModalItem.requestId}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setApproveModalItem(null)}
                disabled={actionLoading}
                className="text-slate-400 hover:text-slate-600 rounded-lg p-1"
              >
                <Icon name="x" className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs text-slate-600">
              <div className="rounded-lg bg-slate-50 p-3 border border-slate-200/80 space-y-1">
                <div className="flex justify-between gap-2">
                  <span className="text-slate-500">Product:</span>
                  <span className="font-semibold text-slate-800 text-right">
                    {approveModalItem.productName || approveModalItem.productId}
                  </span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-slate-500">Batch:</span>
                  <span className="font-mono text-slate-700">
                    {approveModalItem.batch || approveModalItem.batchId}
                  </span>
                </div>
              </div>
              <p className="leading-relaxed">
                Approving this E-TRF will mark it as <strong className="text-emerald-700">APPROVED</strong> and make Request #{approveModalItem.requestId} eligible for AR Number generation.
              </p>
            </div>

            <div className="mt-6 flex justify-end gap-2 border-t border-slate-100 pt-3">
              <button
                type="button"
                onClick={() => setApproveModalItem(null)}
                disabled={actionLoading}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmApprove}
                disabled={actionLoading}
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50 cursor-pointer"
              >
                {actionLoading ? (
                  <>
                    <Icon name="refreshCw" className="h-3.5 w-3.5 animate-spin" />
                    Approving…
                  </>
                ) : (
                  <>
                    <Icon name="checkCircle2" className="h-3.5 w-3.5" />
                    Confirm Approval
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: REVISE TRF (Mandatory remarks) ================= */}
      <ActionReasonModal
        isOpen={Boolean(reviseModalItem)}
        onClose={() => setReviseModalItem(null)}
        onSubmit={handleSubmitRevision}
        title="Request TRF Revision"
        subtitle={
          reviseModalItem
            ? `Request #${reviseModalItem.requestId} — ${reviseModalItem.productName || reviseModalItem.productId}`
            : ''
        }
        description="Provide clear remarks explaining what needs to be corrected. Status will change to NEEDS REVISION so the submitter can edit and resubmit."
        placeholder="e.g., Missing license number, incorrect sample quantity, or document mismatch…"
        confirmText="Submit Revision"
        confirmColor="amber"
        icon="refreshCw"
        loading={actionLoading}
        required={true}
        maxLength={1000}
      />

      {/* ================= MODAL: REVISION REMARKS PREVIEW ================= */}
      {remarksModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl ring-1 ring-slate-900/10">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
                  <Icon name="alertTriangle" className="h-4 w-4" />
                </span>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">TRF Revision Remarks</h3>
                  <p className="text-[11px] text-slate-500">
                    Request #{remarksModalItem.requestId} • {remarksModalItem.productName || remarksModalItem.productId}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setRemarksModalItem(null)}
                className="text-slate-400 hover:text-slate-600 rounded-lg p-1"
              >
                <Icon name="x" className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50/70 p-4 text-xs text-amber-950 leading-relaxed whitespace-pre-wrap">
              {remarksModalItem.trfRemarks || 'No revision remarks provided.'}
            </div>

            <div className="mt-5 flex justify-end gap-2 border-t border-slate-100 pt-3">
              {canEditTrf && normalizeTrfStatus(remarksModalItem.trfStatus) === 'NEEDS_REVISION' && (
                <button
                  type="button"
                  onClick={() => {
                    const reqId = remarksModalItem.requestId
                    setRemarksModalItem(null)
                    navigate(`/e-trf/${reqId}`)
                  }}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 cursor-pointer"
                >
                  <Icon name="edit" className="h-3.5 w-3.5" />
                  Edit E-TRF
                </button>
              )}
              <button
                type="button"
                onClick={() => setRemarksModalItem(null)}
                className="rounded-lg border border-slate-200 px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Transfer Order Details Modal */}
      <TransferOrderDetailsModal
        toId={selectedToIdForModal}
        isOpen={Boolean(selectedToIdForModal)}
        onClose={() => setSelectedToIdForModal(null)}
      />

      {/* GRN Details Modal */}
      <GrnDetailsModal
        grnId={selectedGrnIdForModal}
        isOpen={Boolean(selectedGrnIdForModal)}
        onClose={() => setSelectedGrnIdForModal(null)}
      />
    </div>
  )
}
