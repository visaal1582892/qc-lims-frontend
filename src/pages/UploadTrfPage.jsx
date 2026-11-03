import { useEffect, useState, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  fetchUploadTrfRequests,
  uploadTrfThunk,
  setPage,
  setFilter,
  resetFilters,
  openUploadModal,
  closeUploadModal,
} from '../store/slices/uploadTrfSlice'
import { useToast } from '../components/Toast'
import Icon from '../components/Icon'
import Pagination from '../components/Pagination'
import MasterPageLayout, {
  FilterInput, FilterSelect, TableStatusRow,
  MasterTableHeader, MasterHeaderRow, MasterFilterRow,
} from '../components/MasterPageLayout'
import useDebounce from '../hooks/useDebounce'
import useAuth from '../auth/useAuth'
import { Rights } from '../constants/rights'
import TransferOrderDetailsModal from '../components/TransferOrderDetailsModal'
import GrnDetailsModal from '../components/GrnDetailsModal'

export default function UploadTrfPage() {
  const dispatch = useDispatch()
  const { addToast } = useToast()
  const { hasRight } = useAuth()
  const canUpload = hasRight(Rights.ROLE_SYSTEM_ADMIN) || hasRight(Rights.ROLE_TRF_UPLOAD)

  const {
    items,
    total,
    totalPages,
    loading,
    page,
    pageSize,
    filters,
    uploadModalOpen,
    selectedRequestForUpload,
    uploading,
    uploadError,
  } = useSelector((state) => state.uploadTrf)

  // Drag and drop state
  const [dragOver, setDragOver] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)
  const fileInputRef = useRef(null)

  // Details modals
  const [selectedToIdForModal, setSelectedToIdForModal] = useState(null)
  const [selectedGrnIdForModal, setSelectedGrnIdForModal] = useState(null)

  const dRequestId = useDebounce(filters.requestId, 350)
  const dToId = useDebounce(filters.toId, 350)
  const dGrnId = useDebounce(filters.grnId, 350)
  const dStoreId = useDebounce(filters.storeId, 350)
  const dProductId = useDebounce(filters.productId, 350)
  const dBatchId = useDebounce(filters.batchId, 350)

  useEffect(() => {
    dispatch(fetchUploadTrfRequests())
  }, [dispatch, page, dRequestId, dToId, dGrnId, dStoreId, dProductId, dBatchId, filters.trfStatus])

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      validateAndSetFile(file)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) {
      validateAndSetFile(file)
    }
  }

  const validateAndSetFile = (file) => {
    const validMimes = ['application/pdf', 'image/jpeg', 'image/png']
    if (!validMimes.includes(file.type)) {
      addToast('error', 'Only PDF, JPEG, and PNG files are accepted.')
      return
    }
    // Limit to 25MB
    if (file.size > 25 * 1024 * 1024) {
      addToast('error', 'File size exceeds the 25MB limit.')
      return
    }
    setSelectedFile(file)
  }

  const handleUploadSubmit = async (e) => {
    e.preventDefault()
    if (!selectedRequestForUpload || !selectedFile) return

    try {
      await dispatch(
        uploadTrfThunk({
          requestId: selectedRequestForUpload.requestId,
          file: selectedFile,
        })
      ).unwrap()
      addToast('success', `TRF document uploaded successfully for Request #${selectedRequestForUpload.requestId}!`)
      setSelectedFile(null)
    } catch (err) {
      addToast('error', `Upload failed: ${err}`)
    }
  }

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }

  const hasActiveFilters = Boolean(
    filters.requestId ||
    filters.toId ||
    filters.grnId ||
    filters.storeId ||
    filters.productId ||
    filters.batchId ||
    filters.trfStatus
  )

  const handleClearFilters = () => {
    dispatch(resetFilters())
  }

  return (
    <div className="mx-auto flex h-full min-h-0 w-full flex-1 flex-col gap-3">
      {/* Page Header */}
      <header className="shrink-0 flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-teal-600 ring-1 ring-teal-100">
            <Icon name="cloudUpload" className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <h1 className="truncate text-lg font-semibold text-slate-900">Upload TRFs</h1>
            <p className="text-xs text-slate-500">
              {total} request{total === 1 ? '' : 's'} total • Showing accepted requests awaiting TRF upload or revision
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
            onClick={() => dispatch(fetchUploadTrfRequests())}
            className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 active:scale-[0.98]"
          >
            <Icon name="refreshCw" className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </header>

      {/* Table Container */}
      <MasterPageLayout>
        <div className="flex-1 min-h-0 overflow-auto">
          <table className="w-full min-w-full text-xs">
            <MasterTableHeader>
              <MasterHeaderRow>
                <th className="w-16 px-2.5 py-2.5">Req ID</th>
                <th className="w-35 px-2.5 py-2.5">Transfer Order</th>
                <th className="w-35 px-2.5 py-2.5">GRN ID</th>
                <th className="w-35 px-2.5 py-2.5">Store ID</th>
                <th className="w-35 px-2.5 py-2.5">Product ID</th>
                <th className="w-35 px-2.5 py-2.5">Batch ID</th>
                <th className="w-35 px-2.5 py-2.5 text-center">TRF Status</th>
                <th className="w-35 px-2.5 py-2.5 text-center">Action</th>
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
                <th className="px-1.5 py-1.5">
                  <FilterSelect
                    value={filters.trfStatus}
                    onChange={(val) => dispatch(setFilter({ key: 'trfStatus', value: val }))}
                    options={[
                      ['', 'All Pending'],
                      ['null', 'Pending Upload'],
                      ['N', 'Needs Revision'],
                    ]}
                  />
                </th>
                <th />
              </MasterFilterRow>
            </MasterTableHeader>

            <tbody className="divide-y divide-slate-100 bg-white">
              {loading ? (
                <TableStatusRow colSpan={8}>Loading requests awaiting TRF upload…</TableStatusRow>
              ) : items.length === 0 ? (
                <TableStatusRow colSpan={8}>
                  No accepted requests awaiting TRF upload or revision.
                </TableStatusRow>
              ) : (
                items.map((item) => {
                  const isNeedsRevision = item.trfStatus === 'N'
                  return (
                    <tr key={item.requestId} className="transition hover:bg-slate-50/70">
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

                      {/* TRF STATUS BADGE */}
                      <td className="px-2.5 py-2 text-center">
                        {isNeedsRevision ? (
                          <span
                            className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10.5px] font-semibold text-amber-700 ring-1 ring-amber-200"
                            title={item.trfRemarks ? `Revision remarks: ${item.trfRemarks}` : 'Needs Revision'}
                          >
                            <Icon name="alertTriangle" className="h-3 w-3 text-amber-500" />
                            NEEDS REVISION
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10.5px] font-semibold text-slate-600 ring-1 ring-slate-200">
                            PENDING UPLOAD
                          </span>
                        )}
                      </td>

                      {/* ACTION: UPLOAD TRF */}
                      <td className="px-2.5 py-2 text-center">
                        {canUpload ? (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedFile(null)
                              dispatch(openUploadModal(item))
                            }}
                            className="inline-flex items-center gap-1.5 rounded-md bg-teal-50 px-2.5 py-1 text-[11px] font-semibold text-teal-700 ring-1 ring-teal-200/80 transition hover:bg-teal-600 hover:text-white"
                          >
                            <Icon name="upload" className="h-3.5 w-3.5" />
                            Upload TRF
                          </button>
                        ) : (
                          <span className="text-slate-400 text-xs italic">View only</span>
                        )}
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

      {/* ================= MODAL: UPLOAD TRF ================= */}
      {uploadModalOpen && selectedRequestForUpload && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl ring-1 ring-slate-900/10">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-100 text-teal-700">
                  <Icon name="cloudUpload" className="h-4 w-4" />
                </span>
                <h3 className="text-sm font-bold text-slate-900">
                  Upload TRF Document — Request #{selectedRequestForUpload.requestId}
                </h3>
              </div>
              <button
                onClick={() => {
                  setSelectedFile(null)
                  dispatch(closeUploadModal())
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                <Icon name="x" className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="mt-4 space-y-4">
              {/* Product and batch summary */}
              <div className="rounded-lg bg-slate-50 p-3 text-xs border border-slate-200/80 space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Product:</span>
                  <span className="font-semibold text-slate-800">{selectedRequestForUpload.productName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Batch:</span>
                  <span className="font-mono text-slate-700">{selectedRequestForUpload.batch || selectedRequestForUpload.batchId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Transfer Order:</span>
                  <span className="font-mono text-teal-700 font-semibold">{selectedRequestForUpload.toId || '-'}</span>
                </div>
              </div>

              {/* Revision remarks display if previously flagged for revision */}
              {selectedRequestForUpload.trfStatus === 'N' && (
                <div className="rounded-lg bg-amber-50 p-3 text-xs border border-amber-200 text-amber-900 space-y-1">
                  <div className="flex items-center gap-1 font-semibold text-amber-800">
                    <Icon name="alertTriangle" className="h-3.5 w-3.5" />
                    <span>Previous Revision Remarks:</span>
                  </div>
                  <p className="text-[11.5px] italic pl-4">
                    "{selectedRequestForUpload.trfRemarks || 'No remarks provided'}"
                  </p>
                  {selectedRequestForUpload.trfUrl && (
                    <div className="pt-1 pl-4">
                      <button
                        type="button"
                        onClick={() => window.open(selectedRequestForUpload.trfUrl, '_blank')}
                        className="text-[11px] font-semibold text-amber-700 underline hover:text-amber-900"
                      >
                        View Previously Rejected Document ↗
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Upload error display */}
              {uploadError && (
                <div className="rounded-lg bg-rose-50 p-3 text-xs text-rose-700 border border-rose-200">
                  {uploadError}
                </div>
              )}

              {/* Drag and drop upload zone */}
              <div
                onDragOver={(e) => {
                  e.preventDefault()
                  setDragOver(true)
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 transition cursor-pointer ${dragOver
                  ? 'border-teal-500 bg-teal-50/60'
                  : 'border-slate-300 bg-slate-50/50 hover:border-slate-400 hover:bg-slate-50'
                  }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/pdf,image/jpeg,image/png"
                  onChange={handleFileChange}
                  className="hidden"
                />

                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-teal-50 text-teal-600 mb-2 ring-4 ring-teal-50/60">
                  <Icon name="cloudUpload" className="h-6 w-6" />
                </span>

                <p className="text-xs font-semibold text-slate-700">
                  Click to browse or drag and drop your TRF file
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Supported formats: PDF, JPEG, PNG (max 25MB)
                </p>
              </div>

              {/* Selected File Card */}
              {selectedFile && (
                <div className="flex items-center justify-between rounded-lg border border-teal-200 bg-teal-50/40 p-3 text-xs">
                  <div className="flex items-center gap-2.5 truncate">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-100 text-teal-700 shrink-0">
                      <Icon name="fileText" className="h-4 w-4" />
                    </span>
                    <div className="truncate">
                      <p className="font-semibold text-slate-800 truncate">{selectedFile.name}</p>
                      <p className="text-[10.5px] text-slate-400">{formatFileSize(selectedFile.size)}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedFile(null)}
                    title="Remove selected file"
                    className="p-1 text-slate-400 hover:text-slate-600 rounded-md"
                  >
                    <Icon name="x" className="h-4 w-4" />
                  </button>
                </div>
              )}

              {/* Modal footer actions */}
              <div className="mt-6 flex justify-end gap-2 border-t border-slate-100 pt-3">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedFile(null)
                    dispatch(closeUploadModal())
                  }}
                  disabled={uploading}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading || !selectedFile}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-teal-600 px-4 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-teal-700 disabled:opacity-50"
                >
                  {uploading ? (
                    <>
                      <Icon name="refreshCw" className="h-3.5 w-3.5 animate-spin" />
                      Uploading to Image Server…
                    </>
                  ) : (
                    'Upload & Verify'
                  )}
                </button>
              </div>
            </form>
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
