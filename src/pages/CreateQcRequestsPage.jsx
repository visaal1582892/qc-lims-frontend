import { useEffect, useState } from 'react'
import { qcRequestsApi } from '../api/qcRequests'
import { useToast } from '../components/Toast'
import Icon from '../components/Icon'
import ProductIdLink from '../components/ProductIdLink'
import MasterPageLayout, {
  TableStatusRow,
  MasterTableHeader,
  MasterHeaderRow,
} from '../components/MasterPageLayout'

const isMissingOrInvalidCount = (val) => {
  if (val === '' || val === null || val === undefined) return true
  const trimmed = String(val).trim()
  if (!/^\d+$/.test(trimmed)) return true
  return Number(trimmed) <= 0
}

export default function CreateQcRequestsPage() {
  const { addToast } = useToast()

  const [grnIdInput, setGrnIdInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [grnData, setGrnData] = useState(null)
  const [selectedBatchIds, setSelectedBatchIds] = useState(new Set())

  // Modal State
  const [modalOpen, setModalOpen] = useState(false)
  const [modalItems, setModalItems] = useState([])
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!modalOpen) return undefined
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && !submitting) {
        setModalOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [modalOpen, submitting])

  const handleFetchGrn = async (e) => {
    if (e) e.preventDefault()
    const trimmed = grnIdInput.trim()
    if (!trimmed) {
      addToast('error', 'Please enter a valid GRN ID.')
      return
    }

    setLoading(true)
    setSelectedBatchIds(new Set())
    try {
      const res = await qcRequestsApi.getGrnBatchesWithInventory(trimmed)
      const batches = res.data || []
      if (batches.length === 0) {
        addToast('error', `No GRN found with ID '${trimmed}'.`)
        setGrnData(null)
      } else {
        setGrnData(batches)
      }
    } catch (err) {
      addToast('error', err.response?.data?.message || err.message || 'Failed to fetch GRN details.')
      setGrnData(null)
    } finally {
      setLoading(false)
    }
  }

  // Toggle selection (only batches with status 'O' and no active QC request are allowed)
  const handleToggleSelect = (item) => {
    const status = (item.batchStatus || item.status || '').trim().toUpperCase()
    const existingReqStatus = (item.existingRequestStatus || '').trim().toUpperCase()
    const hasActiveRequest = existingReqStatus === 'P' || existingReqStatus === 'A'
    const isSelectable =
      (item.canSelect != null ? Boolean(item.canSelect) : true) &&
      status === 'O' &&
      !hasActiveRequest
    if (!isSelectable) return

    const next = new Set(selectedBatchIds)
    if (next.has(item.batchId)) {
      next.delete(item.batchId)
    } else {
      next.add(item.batchId)
    }
    setSelectedBatchIds(next)
  }

  // Select all valid 'O' batches without an existing active request
  const handleSelectAll = () => {
    if (!grnData) return
    const selectable = grnData.filter((b) => {
      const status = (b.batchStatus || b.status || '').trim().toUpperCase()
      const existingReqStatus = (b.existingRequestStatus || '').trim().toUpperCase()
      const hasActiveRequest = existingReqStatus === 'P' || existingReqStatus === 'A'
      return (
        (b.canSelect != null ? Boolean(b.canSelect) : true) &&
        status === 'O' &&
        !hasActiveRequest
      )
    })
    if (selectedBatchIds.size === selectable.length) {
      setSelectedBatchIds(new Set())
    } else {
      setSelectedBatchIds(new Set(selectable.map((b) => b.batchId)))
    }
  }

  // Open creation modal
  const handleOpenModal = () => {
    if (selectedBatchIds.size === 0 || !grnData) return
    const selected = grnData.filter((b) => selectedBatchIds.has(b.batchId))

    const prepared = selected.map((b) => {
      const invCount = b.inventoryQuantity != null ? Math.floor(b.inventoryQuantity) : 0
      const configuredNeeded = b.configuredCountNeeded || b.configuredTestCount || 0
      const hasConfig = configuredNeeded > 0
      // Leave input completely empty ('') when active QC inventory config is missing/0
      const defaultNeeded = hasConfig ? String(configuredNeeded) : ''

      return {
        batchId: b.batchId,
        productId: b.productId,
        productName: b.productName,
        batchNumber: b.batch,
        inventoryCount: invCount,
        hasConfig,
        configuredCountNeeded: configuredNeeded,
        countNeeded: defaultNeeded,
      }
    })

    setModalItems(prepared)
    setModalOpen(true)
  }

  const handleUpdateCountNeeded = (batchId, newCount) => {
    const rawValue = newCount == null ? '' : String(newCount)
    setModalItems((prev) =>
      prev.map((item) =>
        item.batchId === batchId
          ? { ...item, countNeeded: rawValue }
          : item
      )
    )
  }

  // Strict UI validation: blank, zero, negative, non-integer, or > inventory blocks submission
  const hasInvalidCount = modalItems.some((item) => isMissingOrInvalidCount(item.countNeeded))
  const hasExceededInventory = modalItems.some(
    (item) => !isMissingOrInvalidCount(item.countNeeded) && Number(item.countNeeded) > item.inventoryCount
  )
  const hasUnconfiguredRows = modalItems.some((item) => !item.hasConfig)

  const handleProceedCreate = async () => {
    if (modalItems.length === 0) return
    if (hasInvalidCount) {
      addToast('error', 'Every selected batch must have a whole number sample count greater than zero.')
      return
    }
    if (hasExceededInventory) {
      addToast('error', 'One or more items exceed physical store inventory. Cannot proceed.')
      return
    }

    const nonOpenBatch = modalItems.find((m) => {
      const orig = grnData?.find((b) => b.batchId === m.batchId)
      const st = (orig?.batchStatus || orig?.status || '').trim().toUpperCase()
      return st !== 'O'
    })
    if (nonOpenBatch) {
      addToast('error', `Batch ${nonOpenBatch.batchId} is not in Open ('O') status. Only 'O' status batches can be submitted.`)
      return
    }

    const header = grnData?.[0]
    if (!header) return

    setSubmitting(true)
    try {
      const payload = {
        grnId: header.proformaStoreReceiptId,
        storeId: header.storeId,
        items: modalItems.map((m) => {
          const orig = grnData?.find((b) => b.batchId === m.batchId)
          return {
            batchId: m.batchId,
            batch: m.batchNumber,
            batchStatus: (orig?.batchStatus || orig?.status || 'O').trim().toUpperCase(),
            productId: m.productId,
            requestedCount: Number(m.countNeeded),
            countNeeded: Number(m.countNeeded),
            inventoryQuantity: Number(m.inventoryCount),
          }
        }),
      }

      const res = await qcRequestsApi.manualCreateQcRequests(payload)
      const data = res.data
      addToast('success', data.message || `Created ${data.newCreated} QC request(s) successfully!`)
      setModalOpen(false)
      setSelectedBatchIds(new Set())
      // Refresh GRN data
      handleFetchGrn()
    } catch (err) {
      addToast('error', err.response?.data?.message || err.message || 'Failed to create QC requests.')
    } finally {
      setSubmitting(false)
    }
  }

  const headerInfo = grnData && grnData.length > 0 ? grnData[0] : null
  const grnStatus = (headerInfo?.grnStatus || headerInfo?.headerStatus || '').trim().toUpperCase()
  const grnStatusDesc =
    headerInfo?.grnStatusDescription ||
    headerInfo?.headerStatusDescription ||
    headerInfo?.statusDescription ||
    (grnStatus === 'O' ? 'Open (O)' : grnStatus || '—')

  const selectableCount = grnData
    ? grnData.filter((b) => {
        const st = (b.batchStatus || b.status || '').trim().toUpperCase()
        const existingReqStatus = (b.existingRequestStatus || '').trim().toUpperCase()
        const hasActiveRequest = existingReqStatus === 'P' || existingReqStatus === 'A'
        return (b.canSelect != null ? Boolean(b.canSelect) : true) && st === 'O' && !hasActiveRequest
      }).length
    : 0

  return (
    <div className="mx-auto flex h-full min-h-0 w-full flex-1 flex-col gap-3">
      {/* Page Header */}
      <header className="shrink-0 flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100">
            <Icon name="filePlus" className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <h1 className="truncate text-lg font-semibold text-slate-900">Create QC Requests</h1>
            <p className="text-xs text-slate-500">
              Query warehouse GRN inventory receipts, inspect batch statuses, and generate QC testing requests
            </p>
          </div>
        </div>
      </header>

      {/* Query Bar & GRN Summary Strip */}
      <div className="shrink-0 rounded-xl border border-slate-200/80 bg-white p-3 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <form onSubmit={handleFetchGrn} className="flex items-center gap-2 max-w-md w-full">
          <div className="relative flex-1">
            <Icon
              name="search"
              className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              value={grnIdInput}
              onChange={(e) => setGrnIdInput(e.target.value)}
              placeholder="Enter GRN Receipt ID (e.g. 4235236)..."
              className="w-full rounded-lg border border-slate-200 bg-white py-1.5 pl-8 pr-3 text-xs text-slate-700 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100 shadow-2xs"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !grnIdInput.trim()}
            className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-brand-700 disabled:opacity-50 active:scale-[0.98] transition cursor-pointer"
          >
            {loading ? (
              <>
                <Icon name="refreshCw" className="h-3.5 w-3.5 animate-spin" />
                Fetching…
              </>
            ) : (
              <>
                <Icon name="arrowRight" className="h-3.5 w-3.5" />
                Get Details
              </>
            )}
          </button>
        </form>

        {headerInfo && (
          <div className="flex flex-wrap items-center gap-5 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="text-[10.5px] font-medium text-slate-400 uppercase tracking-wider">GRN ID:</span>
              <span className="font-mono font-bold text-slate-900">{headerInfo.proformaStoreReceiptId}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10.5px] font-medium text-slate-400 uppercase tracking-wider">Store:</span>
              <span className="font-mono font-semibold text-slate-700">{headerInfo.storeId || '—'}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10.5px] font-medium text-slate-400 uppercase tracking-wider">GRN Status:</span>
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-semibold ring-1 ring-inset ${
                  grnStatus === 'O'
                    ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20'
                    : 'bg-amber-50 text-amber-700 ring-amber-600/20'
                }`}
              >
                {grnStatusDesc || (grnStatus === 'O' ? 'Open (O)' : grnStatus || '—')}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10.5px] font-medium text-slate-400 uppercase tracking-wider">Batches:</span>
              <span className="font-semibold text-slate-800">
                {grnData.length} total ({selectableCount} eligible)
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Floating Selection Bar */}
      {selectedBatchIds.size > 0 && (
        <div className="shrink-0 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-brand-200 bg-brand-50/90 px-4 py-2 shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2 text-xs font-semibold text-brand-900">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-600 text-[11px] text-white">
              {selectedBatchIds.size}
            </span>
            <span>batch{selectedBatchIds.size === 1 ? '' : 'es'} selected for QC testing</span>
            <button
              type="button"
              onClick={() => setSelectedBatchIds(new Set())}
              className="ml-2 text-xs font-medium text-brand-700 underline hover:text-brand-900 cursor-pointer"
            >
              Clear selection
            </button>
          </div>

          <button
            type="button"
            onClick={handleOpenModal}
            className="inline-flex items-center gap-1.5 rounded-md bg-brand-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs transition hover:bg-brand-700 active:scale-[0.98] cursor-pointer"
          >
            <Icon name="plusCircle" className="h-3.5 w-3.5" />
            Create QC Requests ({selectedBatchIds.size})
          </button>
        </div>
      )}

      {/* Table Container */}
      <MasterPageLayout>
        <div
          tabIndex={0}
          role="region"
          aria-label="GRN batches and store inventory table"
          className="hidden flex-1 min-h-0 overflow-auto sm:block"
        >
          <table className="w-full min-w-full text-xs">
            <caption className="sr-only">GRN batch inventory eligible for QC testing requests</caption>
            <MasterTableHeader>
              <MasterHeaderRow>
                <th scope="col" className="w-10 px-2 py-2.5 text-center">
                  <input
                    type="checkbox"
                    checked={selectableCount > 0 && selectedBatchIds.size === selectableCount}
                    onChange={handleSelectAll}
                    disabled={selectableCount === 0}
                    className="h-3.5 w-3.5 rounded border-slate-300 text-brand-600 focus:ring-brand-500 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                    aria-label="Select all eligible batches"
                  />
                </th>
                <th scope="col" className="w-44 px-2.5 py-2.5">Product ID</th>
                <th scope="col" className="px-2.5 py-2.5">Product Name</th>
                <th scope="col" className="w-36 px-2.5 py-2.5">Batch ID</th>
                <th scope="col" className="w-36 px-2.5 py-2.5">Batch Number</th>
                <th scope="col" className="w-40 px-2.5 py-2.5 text-center">Batch Status</th>
                <th scope="col" className="w-36 px-2.5 py-2.5 text-right">GRN Received Qty</th>
                <th scope="col" className="w-36 px-2.5 py-2.5 text-right">Store Inventory</th>
              </MasterHeaderRow>
            </MasterTableHeader>

            <tbody className="divide-y divide-slate-100 bg-white">
              {loading ? (
                <TableStatusRow colSpan={8}>Fetching GRN and inventory stock details…</TableStatusRow>
              ) : !grnData ? (
                <TableStatusRow colSpan={8}>
                  <div className="py-12 text-center text-slate-400">
                    <Icon name="search" className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                    <p className="text-xs font-medium text-slate-600">No GRN Queried</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Enter a GRN receipt ID above and click &quot;Get Details&quot; to inspect batches and stock.
                    </p>
                  </div>
                </TableStatusRow>
              ) : grnData.length === 0 ? (
                <TableStatusRow colSpan={8}>No batches found for this GRN.</TableStatusRow>
              ) : (
                grnData.map((item) => {
                  const bStatus = (item.batchStatus || item.status || '').trim().toUpperCase()
                  const existingReqStatus = (item.existingRequestStatus || '').trim().toUpperCase()
                  const hasActiveRequest = existingReqStatus === 'P' || existingReqStatus === 'A'
                  const existingStatusLabel =
                    existingReqStatus === 'P'
                      ? 'Pending'
                      : existingReqStatus === 'A'
                      ? 'Accepted'
                      : existingReqStatus
                  const isSelectable =
                    (item.canSelect != null ? Boolean(item.canSelect) : true) &&
                    bStatus === 'O' &&
                    !hasActiveRequest
                  const bStatusDesc =
                    item.batchStatusDescription ||
                    item.statusDescription ||
                    (bStatus === 'O' ? 'Open (O)' : bStatus || 'Unknown')
                  const isChecked = selectedBatchIds.has(item.batchId)
                  const disabledTitle = hasActiveRequest
                    ? `Active QC request already exists (${existingStatusLabel}) for this batch`
                    : "Only batches with 'O' status can be selected for QC requests"

                  return (
                    <tr
                      key={item.batchId}
                      className={`transition ${
                        !isSelectable
                          ? 'bg-slate-50/50 opacity-60'
                          : isChecked
                          ? 'bg-brand-50/40 hover:bg-brand-50/60'
                          : 'hover:bg-slate-50/70'
                      }`}
                    >
                      <td className="px-2 py-2 text-center">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          disabled={!isSelectable}
                          onChange={() => handleToggleSelect(item)}
                          aria-label={
                            isSelectable
                              ? `Select batch ${item.batchId} for QC request creation`
                              : disabledTitle
                          }
                          className="h-3.5 w-3.5 rounded border-slate-300 text-brand-600 focus:ring-brand-500 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                          title={isSelectable ? 'Select for QC request creation' : disabledTitle}
                        />
                      </td>

                      <td className="px-2.5 py-2 font-mono text-[11px]">
                        <ProductIdLink productId={item.productId} />
                      </td>

                      <td className="px-2.5 py-2 text-slate-700 truncate max-w-xs" title={item.productName}>
                        {item.productName || '—'}
                      </td>

                      <td className="px-2.5 py-2 font-mono text-[11px] text-slate-700">
                        {item.batchId}
                      </td>

                      <td className="px-2.5 py-2 font-mono text-[11px] text-slate-700">
                        {item.batch || '—'}
                      </td>

                      <td className="px-2.5 py-2 text-center">
                        <div className="inline-flex flex-col items-center gap-1">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-semibold ring-1 ring-inset ${
                              bStatus === 'O'
                                ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20'
                                : 'bg-rose-50 text-rose-700 ring-rose-600/20'
                            }`}
                          >
                            <Icon name={bStatus === 'O' ? 'checkCircle2' : 'xCircle'} className="h-3 w-3" />
                            {bStatusDesc}
                          </span>
                          {hasActiveRequest && (
                            <span
                              className="inline-flex items-center rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-semibold text-indigo-700 ring-1 ring-inset ring-indigo-200"
                              title={`Active QC request (${existingStatusLabel}) already exists for this batch`}
                            >
                              Requested ({existingStatusLabel})
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-2.5 py-2 text-right font-mono text-[11px] font-medium text-slate-800">
                        {item.quantity != null ? Number(item.quantity).toLocaleString() : '—'}
                      </td>

                      <td className="px-2.5 py-2 text-right font-mono text-[11px] font-semibold">
                        <span
                          className={
                            item.inventoryQuantity != null && item.inventoryQuantity > 0
                              ? 'text-emerald-700'
                              : 'text-rose-600'
                          }
                        >
                          {item.inventoryQuantity != null
                            ? Number(item.inventoryQuantity).toLocaleString()
                            : '0'}
                        </span>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </MasterPageLayout>

      {/* Confirmation & Quantity Adjustment Modal */}
      {modalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="create-qc-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs animate-in fade-in"
        >
          <div className="w-full max-w-3xl rounded-xl border border-slate-200 bg-white shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-5 py-3.5">
              <div className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100">
                  <Icon name="package" className="h-4 w-4" />
                </span>
                <div>
                  <h2 id="create-qc-modal-title" className="text-sm font-bold text-slate-900">
                    Review & Adjust QC Quantities
                  </h2>
                  <p className="text-[11px] text-slate-500">
                    Confirm sample counts needed for QC tests against physical store inventory
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                disabled={submitting}
                aria-label="Close quantity adjustment dialog"
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition cursor-pointer disabled:opacity-50"
              >
                <Icon name="x" className="h-4 w-4" />
              </button>
            </div>

            {hasUnconfiguredRows && (
              <div className="mx-5 mt-4 rounded-lg border border-amber-200 bg-amber-50/80 p-3 text-xs text-amber-900 flex items-start gap-2">
                <Icon name="alertTriangle" className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
                <div>
                  <span className="font-semibold">Missing Inventory Config:</span> Products without active QC Inventory Configuration start blank. Enter a sample count greater than zero to create the request (active configuration must still be set before accepting the request).
                </div>
              </div>
            )}

            {/* Error Banner if countNeeded > inventoryCount */}
            {hasExceededInventory && (
              <div
                role="alert"
                className="mx-5 mt-3 rounded-lg border border-rose-200 bg-rose-50/80 p-3 text-xs text-rose-800 flex items-start gap-2"
              >
                <Icon name="alertCircle" className="h-4 w-4 shrink-0 text-rose-500 mt-0.5" />
                <div>
                  <span className="font-semibold">Validation Error:</span> One or more batches have a requested QC sample count exceeding available physical store inventory.
                </div>
              </div>
            )}

            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              <div className="rounded-lg border border-slate-200 overflow-hidden shadow-2xs">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="sticky top-0 bg-slate-50 text-[10.5px] font-semibold uppercase text-slate-500 border-b border-slate-200">
                    <tr>
                      <th scope="col" className="px-3 py-2">Product</th>
                      <th scope="col" className="px-3 py-2">Batch ID</th>
                      <th scope="col" className="px-3 py-2 text-right">Physical Inventory</th>
                      <th scope="col" className="px-3 py-2 text-right w-60">QC Sample Count Requested</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {modalItems.map((item) => {
                      const trimmed = String(item.countNeeded ?? '').trim()
                      const isBlank = trimmed === ''
                      const isInteger = /^\d+$/.test(trimmed)
                      const countVal = isInteger ? Number(trimmed) : null
                      const isZeroOrNegativeOrInvalid = !isBlank && (!isInteger || countVal <= 0)
                      const exceeds = countVal != null && countVal > 0 && countVal > item.inventoryCount
                      const hasRowError = exceeds || isZeroOrNegativeOrInvalid || isBlank
                      const inputId = `qc-qty-${item.batchId}`
                      const errorId = `${inputId}-msg`

                      return (
                        <tr
                          key={item.batchId}
                          className={hasRowError ? 'bg-rose-50/40' : 'hover:bg-slate-50/70'}
                        >
                          <td className="px-3 py-2.5">
                            <div className="text-xs">
                              <ProductIdLink productId={item.productId} />
                            </div>
                            {item.productName && (
                              <div className="text-[11px] text-slate-500 truncate max-w-xs" title={item.productName}>
                                {item.productName}
                              </div>
                            )}
                          </td>
                          <td className="px-3 py-2.5 font-mono text-slate-700">{item.batchId}</td>
                          <td className="px-3 py-2.5 text-right font-semibold font-mono text-slate-800">
                            {item.inventoryCount.toLocaleString()}
                          </td>
                          <td className="px-3 py-2.5 text-right">
                            <div className="flex flex-col items-end">
                              <label htmlFor={inputId} className="sr-only">
                                QC Sample Count Requested for batch {item.batchId}
                              </label>
                              <input
                                id={inputId}
                                type="text"
                                inputMode="numeric"
                                placeholder="Enter qty…"
                                value={item.countNeeded}
                                aria-invalid={hasRowError ? 'true' : undefined}
                                aria-describedby={errorId}
                                onChange={(e) => handleUpdateCountNeeded(item.batchId, e.target.value)}
                                className={`w-32 text-right rounded-md border px-2.5 py-1 text-xs font-mono shadow-2xs focus:outline-none focus:ring-1 ${
                                  hasRowError
                                    ? 'border-rose-400 bg-rose-50 text-rose-700 focus:border-rose-500 focus:ring-rose-500'
                                    : 'border-slate-200 bg-white text-slate-800 focus:border-brand-500 focus:ring-brand-500'
                                }`}
                              />
                              <div id={errorId} className="mt-1 text-right">
                                {exceeds ? (
                                  <span className="text-[10px] text-rose-600 font-semibold">
                                    Requested count exceeds physical inventory ({item.inventoryCount.toLocaleString()})
                                  </span>
                                ) : isZeroOrNegativeOrInvalid ? (
                                  <span className="text-[10px] text-rose-600 font-medium">
                                    Enter a whole number greater than zero
                                  </span>
                                ) : isBlank ? (
                                  <span className="text-[10px] text-rose-600 font-medium">
                                    {item.hasConfig
                                      ? 'Requested count is required'
                                      : 'Required (no QC config found)'}
                                  </span>
                                ) : !item.hasConfig ? (
                                  <span className="text-[10px] text-amber-700 font-medium">
                                    No active QC config yet (required before acceptance)
                                  </span>
                                ) : null}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-slate-100 bg-slate-50/60 px-5 py-3">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                disabled={submitting}
                className="rounded-lg bg-white px-4 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs ring-1 ring-slate-300 ring-inset hover:bg-slate-50 transition cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleProceedCreate}
                disabled={submitting || modalItems.length === 0 || hasExceededInventory || hasInvalidCount}
                className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition cursor-pointer"
              >
                {submitting ? (
                  <>
                    <Icon name="refreshCw" className="h-3.5 w-3.5 animate-spin" />
                    Creating…
                  </>
                ) : (
                  <>
                    <Icon name="check" className="h-3.5 w-3.5" />
                    Proceed & Create Requests
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
