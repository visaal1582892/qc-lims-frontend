import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  fetchTrackingRequests,
  setPage,
  setFilter,
  clearFilters,
} from '../store/slices/qcRequestTrackingSlice'
import { downloadFileFromProxy, viewFile } from '../utils/fileDownload'
import TrfStatusBadge from '../components/TrfStatusBadge'
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
import useDebounce from '../hooks/useDebounce'
import useAuth from '../auth/useAuth'
import { Rights } from '../constants/rights'
import TransferOrderDetailsModal from '../components/TransferOrderDetailsModal'
import GrnDetailsModal from '../components/GrnDetailsModal'
import ProductIdLink from '../components/ProductIdLink'

export default function QcRequestTrackingPage() {
  const dispatch = useDispatch()
  const toast = useToast()
  const { hasRight } = useAuth()

  const canDownloadTrf =
    hasRight(Rights.ROLE_SYSTEM_ADMIN) ||
    hasRight(Rights.ROLE_TRF_DOWNLOAD) ||
    hasRight(Rights.ROLE_TRF_READ) ||
    hasRight(Rights.ROLE_AR_GENERATE_READ) ||
    hasRight(Rights.ROLE_QC_REQUEST_TRACKING_READ)

  const {
    items,
    total,
    totalPages,
    loading,
    page,
    pageSize,
    filters,
  } = useSelector((state) => state.qcRequestTracking)

  // Details modals
  const [selectedToIdForModal, setSelectedToIdForModal] = useState(null)
  const [selectedGrnIdForModal, setSelectedGrnIdForModal] = useState(null)

  // Debounced filter inputs
  const dRequestId = useDebounce(filters.requestId, 350)
  const dToId = useDebounce(filters.toId, 350)
  const dArNumber = useDebounce(filters.arNumber, 350)
  const dGrnId = useDebounce(filters.grnId, 350)
  const dStoreId = useDebounce(filters.storeId, 350)
  const dProductId = useDebounce(filters.productId, 350)
  const dBatchId = useDebounce(filters.batchId, 350)
  const dTrfRemarks = useDebounce(filters.trfRemarks, 350)
  const dCreatedBy = useDebounce(filters.createdBy, 350)
  const dUpdatedBy = useDebounce(filters.updatedBy, 350)

  useEffect(() => {
    dispatch(fetchTrackingRequests())
  }, [
    dispatch,
    page,
    dRequestId,
    dToId,
    dArNumber,
    dGrnId,
    dStoreId,
    dProductId,
    dBatchId,
    dTrfRemarks,
    dCreatedBy,
    dUpdatedBy,
    filters.status,
    filters.trfStatus,
  ])

  const hasActiveFilters = Boolean(
    filters.requestId ||
    filters.toId ||
    filters.arNumber ||
    filters.grnId ||
    filters.storeId ||
    filters.productId ||
    filters.batchId ||
    filters.trfRemarks ||
    filters.createdBy ||
    filters.updatedBy ||
    (filters.status && filters.status !== 'all') ||
    (filters.trfStatus && filters.trfStatus !== 'all')
  )

  const handleClearFilters = () => {
    dispatch(clearFilters())
  }

  const handleDownloadTrf = (trfUrl, filename = 'trf-document') => {
    downloadFileFromProxy(trfUrl, filename, toast)
  }

  return (
    <div className="mx-auto flex h-full min-h-0 w-full flex-1 flex-col gap-3">
      {/* Header */}
      <header className="shrink-0 flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-teal-600 ring-1 ring-teal-100">
            <Icon name="search" className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <h1 className="truncate text-lg font-semibold text-slate-900">QC Request Tracking</h1>
            <p className="text-xs text-slate-500">
              {total} request{total === 1 ? '' : 's'} total • Ordered latest modified to oldest modified
            </p>
          </div>
        </div>

        {/* Global Toolbar buttons */}
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
            onClick={() => dispatch(fetchTrackingRequests())}
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
          aria-label="QC Request Tracking table"
          className="flex-1 min-h-0 overflow-auto"
        >
          <table className="w-full min-w-max text-xs">
            <caption className="sr-only">QC Request Tracking records</caption>
            <MasterTableHeader>
              <MasterHeaderRow>
                <th scope="col" className="w-16 px-2.5 py-2.5">Req ID</th>
                <th scope="col" className="w-35 px-2.5 py-2.5">Transfer Order</th>
                <th scope="col" className="w-35 px-2.5 py-2.5">AR Number</th>
                <th scope="col" className="w-35 px-2.5 py-2.5">GRN ID</th>
                <th scope="col" className="w-35 px-2.5 py-2.5">Store ID</th>
                <th scope="col" className="w-35 px-2.5 py-2.5">Product ID</th>
                <th scope="col" className="w-35 px-2.5 py-2.5">Batch ID</th>
                <th scope="col" className="w-24 px-2.5 py-2.5 text-right">Qty Needed</th>
                <th scope="col" className="min-w-[160px] px-2.5 py-2.5">TRF Remarks</th>
                <th scope="col" className="w-35 px-2.5 py-2.5">Created At</th>
                <th scope="col" className="w-35 px-2.5 py-2.5">Created By</th>
                <th scope="col" className="w-36 px-2.5 py-2.5">Updated At</th>
                <th scope="col" className="w-35 px-2.5 py-2.5">Updated By</th>

                {/* FIXED COLUMNS ON RIGHT IN ORDER: TRF File, TRF Status, Status */}
                <th scope="col" className="w-[90px] min-w-[90px] max-w-[90px] sticky right-[255px] bg-slate-50 z-20 px-2.5 py-2.5 text-center shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.06)]">
                  TRF File
                </th>
                <th scope="col" className="w-[140px] min-w-[140px] max-w-[140px] sticky right-[115px] bg-slate-50 z-20 px-2.5 py-2.5 text-center">
                  TRF Status
                </th>
                <th scope="col" className="w-[115px] min-w-[115px] max-w-[115px] sticky right-0 bg-slate-50 z-20 px-2.5 py-2.5 text-center">
                  Status
                </th>
              </MasterHeaderRow>

              <MasterFilterRow>
                {/* 1. Req ID */}
                <th className="px-1.5 py-1.5">
                  <FilterInput
                    value={filters.requestId}
                    onChange={(val) => dispatch(setFilter({ key: 'requestId', value: val }))}
                    placeholder="Req ID…"
                  />
                </th>

                {/* 2. Transfer Order */}
                <th className="px-1.5 py-1.5">
                  <FilterInput
                    value={filters.toId}
                    onChange={(val) => dispatch(setFilter({ key: 'toId', value: val }))}
                    placeholder="TO ID…"
                  />
                </th>

                {/* 3. AR Number */}
                <th className="px-1.5 py-1.5">
                  <FilterInput
                    value={filters.arNumber}
                    onChange={(val) => dispatch(setFilter({ key: 'arNumber', value: val }))}
                    placeholder="AR No…"
                  />
                </th>

                {/* 4. GRN ID */}
                <th className="px-1.5 py-1.5">
                  <FilterInput
                    value={filters.grnId}
                    onChange={(val) => dispatch(setFilter({ key: 'grnId', value: val }))}
                    placeholder="GRN ID…"
                  />
                </th>

                {/* 5. Store ID */}
                <th className="px-1.5 py-1.5">
                  <FilterInput
                    value={filters.storeId}
                    onChange={(val) => dispatch(setFilter({ key: 'storeId', value: val }))}
                    placeholder="Store ID…"
                  />
                </th>

                {/* 6. Product ID */}
                <th className="px-1.5 py-1.5">
                  <FilterInput
                    value={filters.productId}
                    onChange={(val) => dispatch(setFilter({ key: 'productId', value: val }))}
                    placeholder="Prod ID…"
                  />
                </th>

                {/* 7. Batch ID */}
                <th className="px-1.5 py-1.5">
                  <FilterInput
                    value={filters.batchId}
                    onChange={(val) => dispatch(setFilter({ key: 'batchId', value: val }))}
                    placeholder="Batch ID…"
                  />
                </th>

                {/* 8. Qty Needed */}
                <th />

                {/* 9. TRF Remarks */}
                <th className="px-1.5 py-1.5">
                  <FilterInput
                    value={filters.trfRemarks}
                    onChange={(val) => dispatch(setFilter({ key: 'trfRemarks', value: val }))}
                    placeholder="Remarks…"
                  />
                </th>

                {/* 9. Created At */}
                <th />

                {/* 10. Created By */}
                <th className="px-1.5 py-1.5">
                  <FilterInput
                    value={filters.createdBy}
                    onChange={(val) => dispatch(setFilter({ key: 'createdBy', value: val }))}
                    placeholder="User…"
                  />
                </th>

                {/* 11. Updated At */}
                <th />

                {/* 12. Updated By */}
                <th className="px-1.5 py-1.5">
                  <FilterInput
                    value={filters.updatedBy}
                    onChange={(val) => dispatch(setFilter({ key: 'updatedBy', value: val }))}
                    placeholder="User…"
                  />
                </th>

                {/* FIXED FILTERS ON RIGHT: TRF File, TRF Status, Status */}
                <th className="w-[90px] min-w-[90px] max-w-[90px] sticky right-[255px] bg-slate-50 z-20 shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.06)]" />

                <th className="w-[140px] min-w-[140px] max-w-[140px] sticky right-[115px] bg-slate-50 z-20 px-1.5 py-1.5">
                  <FilterSelect
                    value={filters.trfStatus}
                    onChange={(val) => dispatch(setFilter({ key: 'trfStatus', value: val }))}
                    options={[
                      ['all', 'All TRFs'],
                      ['PD', 'Pending Details'],
                      ['PA', 'Pending Approval'],
                      ['A', 'Approved'],
                      ['N', 'Needs Revision'],
                    ]}
                  />
                </th>

                <th className="w-[115px] min-w-[115px] max-w-[115px] sticky right-0 bg-slate-50 z-20 px-1.5 py-1.5">
                  <FilterSelect
                    value={filters.status}
                    onChange={(val) => dispatch(setFilter({ key: 'status', value: val }))}
                    options={[
                      ['all', 'All Statuses'],
                      ['P', 'Pending'],
                      ['A', 'Accepted'],
                      ['R', 'Rejected'],
                    ]}
                  />
                </th>
              </MasterFilterRow>
            </MasterTableHeader>

            <tbody className="divide-y divide-slate-100 bg-white">
              {loading ? (
                <TableStatusRow colSpan={16}>Loading QC request tracking records…</TableStatusRow>
              ) : items.length === 0 ? (
                <TableStatusRow colSpan={16}>No matching QC requests found.</TableStatusRow>
              ) : (
                items.map((item) => (
                  <tr
                    key={item.requestId}
                    className="group transition hover:bg-slate-50"
                  >
                    {/* 1. Req ID */}
                    <td className="px-2.5 py-2 font-mono text-[11px] font-semibold text-slate-800">
                      {item.requestId}
                    </td>

                    {/* 2. Transfer Order */}
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
                        <span className="text-slate-400 font-normal">-</span>
                      )}
                    </td>

                    {/* 3. AR Number */}
                    <td className="px-2.5 py-2 font-mono text-[11px] font-semibold text-indigo-700">
                      {item.arNumber ? (
                        <span className="inline-flex items-center rounded-md bg-indigo-50 px-1.5 py-0.5 text-[10.5px] font-bold text-indigo-700 ring-1 ring-indigo-200/80">
                          {item.arNumber}
                        </span>
                      ) : (
                        <span className="text-slate-400 font-normal">-</span>
                      )}
                    </td>

                    {/* 4. GRN ID */}
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

                    {/* 5. Store ID */}
                    <td className="px-2.5 py-2 font-mono text-[11px] text-slate-700">
                      {item.fromStoreId || '-'}
                    </td>

                    {/* 6. Product ID */}
                    <td className="px-2.5 py-2 font-mono text-[11px]">
                      <ProductIdLink productId={item.productId} />
                    </td>

                    {/* 7. Batch ID */}
                    <td className="px-2.5 py-2 font-mono text-[11px] text-slate-600">
                      {item.batchId}
                    </td>

                    {/* 8. Qty Needed */}
                    <td className="px-2.5 py-2 text-right font-mono text-[11px] font-semibold text-slate-800">
                      {item.quantityNeededForTesting != null
                        ? Number(item.quantityNeededForTesting).toLocaleString()
                        : <span className="text-slate-400 font-normal">-</span>}
                    </td>

                    {/* 9. TRF Remarks */}
                    <td
                      className="max-w-[200px] truncate px-2.5 py-2 text-slate-600"
                      title={item.trfRemarks || ''}
                    >
                      {item.trfRemarks || '-'}
                    </td>

                    {/* 12. Created At */}
                    <td className="px-2.5 py-2 text-slate-500 whitespace-nowrap">
                      {formatDateTime(item.createdAt)}
                    </td>

                    {/* 13. Created By */}
                    <td className="px-2.5 py-2 text-slate-600">
                      {item.createdBy || '-'}
                    </td>

                    {/* 14. Updated At */}
                    <td className="px-2.5 py-2 text-slate-500 whitespace-nowrap font-medium">
                      {formatDateTime(item.updatedAt)}
                    </td>

                    {/* 15. Updated By */}
                    <td className="px-2.5 py-2 text-slate-600">
                      {item.updatedBy || '-'}
                    </td>

                    {/* 16. TRF File Actions (FIXED) */}
                    <td className="w-[90px] min-w-[90px] max-w-[90px] sticky right-[255px] bg-white group-hover:bg-slate-50 z-10 px-2.5 py-2 text-center shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.06)]">
                      {item.trfUrl ? (
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Eye: View */}
                          <button
                            type="button"
                            onClick={() => viewFile(item.trfUrl)}
                            title="View TRF Document"
                            className="flex h-6 w-6 items-center justify-center rounded-full bg-teal-50 text-teal-700 ring-1 ring-teal-200/80 transition hover:bg-teal-600 hover:text-white"
                          >
                            <Icon name="eye" className="h-3 w-3" />
                          </button>

                          {/* Download: Proxy Download */}
                          {canDownloadTrf && (
                            <button
                              type="button"
                              onClick={() => handleDownloadTrf(item.trfUrl, `TRF_Req_${item.requestId}`)}
                              title="Download TRF Document"
                              className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-slate-700 ring-1 ring-slate-200 transition hover:bg-slate-700 hover:text-white"
                            >
                              <Icon name="download" className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>

                    {/* 17. TRF Status (FIXED) */}
                    <td className="w-[140px] min-w-[140px] max-w-[140px] sticky right-[115px] bg-white group-hover:bg-slate-50 z-10 px-2.5 py-2 text-center">
                      <TrfStatusBadge status={item.trfStatus} showEmptyDash />
                    </td>

                    {/* 18. Status (FIXED) */}
                    <td className="w-[115px] min-w-[115px] max-w-[115px] sticky right-0 bg-white group-hover:bg-slate-50 z-10 px-2.5 py-2 text-center">
                      <QcStatusBadge status={item.status} />
                    </td>
                  </tr>
                ))
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

function QcStatusBadge({ status }) {
  if (status === 'P' || status === 'PENDING') {
    return (
      <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700 ring-1 ring-amber-200">
        PENDING
      </span>
    )
  }
  if (status === 'A' || status === 'ACCEPTED') {
    return (
      <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 ring-1 ring-emerald-200">
        ACCEPTED
      </span>
    )
  }
  if (status === 'R' || status === 'REJECTED') {
    return (
      <span className="inline-flex items-center rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-700 ring-1 ring-rose-200">
        REJECTED
      </span>
    )
  }
  return <span className="text-slate-400 text-xs">-</span>
}

function formatDateTime(isoString) {
  if (!isoString) return '-'
  try {
    const d = new Date(isoString)
    if (isNaN(d.getTime())) return isoString
    return d.toLocaleString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    })
  } catch {
    return isoString
  }
}
