import { useEffect, useState, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import {
  fetchAssignedTests,
  setPage,
  setFilter,
  clearFilters,
  startTestThunk,
  holdTestThunk,
  unholdTestThunk,
  cancelTestThunk,
  outsourceTestThunk,
  approveTestThunk,
  reworkTestThunk,
} from '../store/slices/assignedTestsSlice'
import { qcRequestsApi } from '../api/qcRequests'
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
import useDebounce from '../hooks/useDebounce'
import useAuth from '../auth/useAuth'
import { Rights } from '../constants/rights'
import { useToast } from '../components/Toast'

export default function AssignedTestsPage() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { hasRight } = useAuth()
  const toast = useToast()

  const canExecute = hasRight(Rights.ROLE_SYSTEM_ADMIN) || hasRight(Rights.ROLE_TEST_EXECUTE)
  const canReview = hasRight(Rights.ROLE_SYSTEM_ADMIN) || hasRight(Rights.ROLE_TEST_REVIEW)
  const canDownloadTrf =
    hasRight(Rights.ROLE_SYSTEM_ADMIN) ||
    hasRight(Rights.ROLE_TRF_DOWNLOAD) ||
    hasRight(Rights.ROLE_TRF_READ) ||
    hasRight(Rights.ROLE_ASSIGNED_TESTS_READ)

  const {
    items,
    total,
    totalPages,
    loading,
    actionLoading,
    page,
    pageSize,
    filters,
  } = useSelector((state) => state.assignedTests)

  // Debounced filters
  const dArNumber = useDebounce(filters.arNumber, 350)
  const dProductId = useDebounce(filters.productId, 350)
  const dProductName = useDebounce(filters.productName, 350)
  const dParamName = useDebounce(filters.paramName, 350)
  const dBatchId = useDebounce(filters.batchId, 350)
  const dUserId = useDebounce(filters.userId, 350)

  useEffect(() => {
    dispatch(fetchAssignedTests())
  }, [dispatch, page, dArNumber, dProductId, dProductName, dParamName, dBatchId, dUserId, filters.status])

  const hasActiveFilters = Boolean(
    filters.arNumber ||
    filters.productId ||
    filters.productName ||
    filters.paramName ||
    filters.batchId ||
    filters.userId ||
    (filters.status && filters.status !== 'all')
  )

  const handleClearFilters = () => {
    dispatch(clearFilters())
  }

  // Active action modal state
  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    detailId: null,
    actionType: null, // 'CANCEL', 'OUTSOURCE', 'HOLD', 'REWORK'
    title: '',
    subtitle: '',
    description: '',
    placeholder: '',
    confirmText: '',
    confirmColor: 'brand',
    icon: 'edit',
  })

  // 3-dot dropdown menu open row
  const [activeMenuId, setActiveMenuId] = useState(null)
  const menuRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setActiveMenuId(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Action Handlers
  const handleStart = async (detailId) => {
    try {
      await dispatch(startTestThunk(detailId)).unwrap()
      toast.success('Test started successfully')
      setActiveMenuId(null)
    } catch (err) {
      toast.error(err || 'Failed to start test')
    }
  }

  const handleUnhold = async (detailId) => {
    try {
      await dispatch(unholdTestThunk(detailId)).unwrap()
      toast.success('Test unheld and resumed')
      setActiveMenuId(null)
    } catch (err) {
      toast.error(err || 'Failed to unhold test')
    }
  }

  const handleApprove = async (detailId) => {
    try {
      await dispatch(approveTestThunk(detailId)).unwrap()
      toast.success('Test approved successfully')
      setActiveMenuId(null)
    } catch (err) {
      toast.error(err || 'Failed to approve test')
    }
  }

  const openActionModal = (item, actionType) => {
    setActiveMenuId(null)
    const baseSubtitle = `${item.arNumber || 'AR Pending'} — ${item.parameterName}`

    if (actionType === 'HOLD') {
      setModalConfig({
        isOpen: true,
        detailId: item.detailId,
        actionType: 'HOLD',
        title: 'Put Test on Hold',
        subtitle: baseSubtitle,
        description: 'Provide a reason for placing this test on hold (e.g., equipment calibration, reagent shortage).',
        placeholder: 'Reason for hold...',
        confirmText: 'Hold Test',
        confirmColor: 'amber',
        icon: 'clock',
      })
    } else if (actionType === 'CANCEL') {
      setModalConfig({
        isOpen: true,
        detailId: item.detailId,
        actionType: 'CANCEL',
        title: 'Cancel Test Execution',
        subtitle: baseSubtitle,
        description: 'Are you sure you want to cancel this test? This is a terminal state.',
        placeholder: 'Reason for cancellation...',
        confirmText: 'Cancel Test',
        confirmColor: 'rose',
        icon: 'slash',
      })
    } else if (actionType === 'OUTSOURCE') {
      setModalConfig({
        isOpen: true,
        detailId: item.detailId,
        actionType: 'OUTSOURCE',
        title: 'Outsource Test',
        subtitle: baseSubtitle,
        description: 'Specify outsourcing destination and justification for external analysis.',
        placeholder: 'Reason and outsourcing details...',
        confirmText: 'Outsource Test',
        confirmColor: 'teal',
        icon: 'truck',
      })
    } else if (actionType === 'REWORK') {
      setModalConfig({
        isOpen: true,
        detailId: item.detailId,
        actionType: 'REWORK',
        title: 'Request Test Rework',
        subtitle: baseSubtitle,
        description: 'This will invalidate the current attempt and generate a new assigned attempt for testing.',
        placeholder: 'Reason for rework (e.g., suspected dilution error, re-extraction needed)...',
        confirmText: 'Submit for Rework',
        confirmColor: 'amber',
        icon: 'refreshCw',
      })
    }
  }

  const handleModalSubmit = async (reason) => {
    const { detailId, actionType } = modalConfig
    try {
      if (actionType === 'HOLD') {
        await dispatch(holdTestThunk({ detailId, reason })).unwrap()
        toast.success('Test placed on hold')
      } else if (actionType === 'CANCEL') {
        await dispatch(cancelTestThunk({ detailId, reason })).unwrap()
        toast.success('Test cancelled successfully')
      } else if (actionType === 'OUTSOURCE') {
        await dispatch(outsourceTestThunk({ detailId, reason })).unwrap()
        toast.success('Test marked as outsourced')
      } else if (actionType === 'REWORK') {
        await dispatch(reworkTestThunk({ detailId, reason })).unwrap()
        toast.success('Rework requested. New attempt created.')
      }
      setModalConfig((prev) => ({ ...prev, isOpen: false }))
    } catch (err) {
      toast.error(err || 'Action failed')
    }
  }

  // TRF Download Handler
  const handleDownloadTrf = async (trfUrl, fileName) => {
    try {
      const response = await qcRequestsApi.downloadProxyFile(trfUrl)
      const blob = new Blob([response.data], { type: response.headers['content-type'] || 'application/pdf' })
      const link = document.createElement('a')
      link.href = window.URL.createObjectURL(blob)
      link.download = fileName || 'TRF_Document.pdf'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(link.href)
    } catch {
      toast.error('Failed to download TRF file')
    }
  }

  const getStatusBadge = (status) => {
    const map = {
      ASSIGNED: 'bg-blue-50 text-blue-700 ring-blue-600/20',
      TESTING: 'bg-amber-50 text-amber-700 ring-amber-600/20',
      SUBMITTED: 'bg-purple-50 text-purple-700 ring-purple-600/20',
      HOLD: 'bg-orange-50 text-orange-700 ring-orange-600/20',
      CANCELLED: 'bg-slate-50 text-slate-700 ring-slate-600/20',
      OUTSOURCED: 'bg-indigo-50 text-indigo-700 ring-indigo-600/20',
      INVALID: 'bg-rose-50 text-rose-700 ring-rose-600/20',
      APPROVED: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
      REJECTED: 'bg-rose-100 text-rose-800 ring-rose-700/30',
    }
    const color = map[status] || 'bg-slate-50 text-slate-700 ring-slate-600/20'
    return (
      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ring-inset ${color}`}>
        {status}
      </span>
    )
  }

  return (
    <MasterPageLayout
      title="Assigned Tests"
      description="View and execute laboratory quality control tests assigned to you"
      totalCount={total}
      hasActiveFilters={hasActiveFilters}
      onClearFilters={handleClearFilters}
    >
      <div className="flex flex-1 min-h-0 flex-col overflow-hidden bg-white shadow-xs ring-1 ring-slate-200/80 rounded-xl">
        <div className="flex-1 min-h-0 overflow-auto">
          <table className="w-full min-w-max border-separate border-spacing-0 text-left text-xs text-slate-600">
            <MasterTableHeader>
              <MasterHeaderRow>
                <th className="w-12 px-2.5 py-2.5 font-semibold text-slate-700 text-center">#</th>
                <th className="w-[110px] min-w-[100px] px-2.5 py-2.5 font-semibold text-slate-700">AR Number</th>
                <th className="w-[110px] min-w-[85px] px-2.5 py-2.5 font-semibold text-slate-700">Product ID</th>
                <th className="min-w-[140px] px-2.5 py-2.5 font-semibold text-slate-700">Parameter Name</th>
                <th className="w-[110px] min-w-[80px] px-2.5 py-2.5 font-semibold text-slate-700">Batch ID</th>
                <th className="w-[110px] min-w-[90px] px-2.5 py-2.5 font-semibold text-slate-700">Assigned To</th>
                <th className="w-[75px] px-2.5 py-2.5 font-semibold text-slate-700 text-center">Attempt</th>
                {/* FIXED COLUMNS ON RIGHT: TRF File, Status, Actions */}
                <th className="w-[90px] min-w-[90px] max-w-[90px] sticky right-[200px] bg-slate-50 z-20 px-2.5 py-2.5 text-center font-semibold text-slate-700">
                  TRF File
                </th>
                <th className="w-[120px] min-w-[120px] max-w-[120px] sticky right-[80px] bg-slate-50 z-20 px-2.5 py-2.5 text-center font-semibold text-slate-700">
                  Status
                </th>
                <th className="w-[80px] min-w-[80px] max-w-[80px] sticky right-0 bg-slate-50 z-20 px-2.5 py-2.5 text-center font-semibold text-slate-700">
                  Actions
                </th>
              </MasterHeaderRow>

              <MasterFilterRow>
                <th className="px-2.5 py-1.5 text-center text-[11px] font-normal text-slate-400">—</th>
                <th className="px-2.5 py-1.5">
                  <FilterInput
                    value={filters.arNumber}
                    onChange={(val) => dispatch(setFilter({ key: 'arNumber', value: val }))}
                    placeholder="Filter AR..."
                  />
                </th>
                <th className="px-2.5 py-1.5">
                  <FilterInput
                    value={filters.productId}
                    onChange={(val) => dispatch(setFilter({ key: 'productId', value: val }))}
                    placeholder="Filter ID..."
                  />
                </th>
                <th className="px-2.5 py-1.5">
                  <FilterInput
                    value={filters.paramName}
                    onChange={(val) => dispatch(setFilter({ key: 'paramName', value: val }))}
                    placeholder="Filter Parameter..."
                  />
                </th>
                <th className="px-2.5 py-1.5">
                  <FilterInput
                    value={filters.batchId}
                    onChange={(val) => dispatch(setFilter({ key: 'batchId', value: val }))}
                    placeholder="Filter Batch..."
                  />
                </th>
                <th className="px-2.5 py-1.5">
                  <FilterInput
                    value={filters.userId}
                    onChange={(val) => dispatch(setFilter({ key: 'userId', value: val }))}
                    placeholder="Filter User..."
                  />
                </th>
                <th className="px-2.5 py-1.5 text-center text-[11px] font-normal text-slate-400">—</th>
                {/* FIXED FILTERS ON RIGHT: TRF File, Status, Actions */}
                <th className="w-[90px] min-w-[90px] max-w-[90px] sticky right-[200px] bg-slate-50 z-20 px-2.5 py-1.5 text-center text-[11px] font-normal text-slate-400">—</th>
                <th className="w-[120px] min-w-[120px] max-w-[120px] sticky right-[80px] bg-slate-50 z-20 px-1.5 py-1.5">
                  <FilterSelect
                    value={filters.status}
                    onChange={(val) => dispatch(setFilter({ key: 'status', value: val }))}
                    options={[
                      { value: 'all', label: 'All Statuses' },
                      { value: 'ASSIGNED', label: 'ASSIGNED' },
                      { value: 'TESTING', label: 'TESTING' },
                      { value: 'HOLD', label: 'HOLD' },
                      { value: 'SUBMITTED', label: 'SUBMITTED' },
                      { value: 'APPROVED', label: 'APPROVED' },
                      { value: 'INVALID', label: 'INVALID' },
                      { value: 'CANCELLED', label: 'CANCELLED' },
                      { value: 'OUTSOURCED', label: 'OUTSOURCED' },
                      { value: 'REJECTED', label: 'REJECTED' },
                    ]}
                  />
                </th>
                <th className="w-[80px] min-w-[80px] max-w-[80px] sticky right-0 bg-slate-50 z-20 px-1.5 py-1.5 text-center">—</th>
              </MasterFilterRow>
            </MasterTableHeader>

            <tbody className="divide-y divide-slate-100 bg-white">
              {loading ? (
                <TableStatusRow colSpan={10} type="loading" message="Loading assigned tests..." />
              ) : items.length === 0 ? (
                <TableStatusRow
                  colSpan={10}
                  type="empty"
                  message={hasActiveFilters ? 'No tests match the current filter criteria' : 'No tests currently assigned to you'}
                />
              ) : (
                items.map((item, idx) => {
                  const isMenuOpen = activeMenuId === item.detailId
                  const isAssigned = item.status === 'ASSIGNED'
                  const isTesting = item.status === 'TESTING'
                  const isHold = item.status === 'HOLD'
                  const isSubmitted = item.status === 'SUBMITTED'
                  const isTerminal = ['CANCELLED', 'OUTSOURCED', 'INVALID', 'APPROVED', 'REJECTED'].includes(item.status)

                  return (
                    <tr key={item.detailId} className={`group hover:bg-slate-50/80 transition-colors ${isMenuOpen ? 'relative z-50' : ''}`}>
                      <td className="px-2.5 py-2 text-center text-slate-400">
                        {page * pageSize + idx + 1}
                      </td>
                      <td className="px-2.5 py-2 font-mono font-semibold text-slate-800">
                        {item.arNumber || '-'}
                      </td>
                      <td className="px-2.5 py-2 font-mono font-medium text-slate-800">
                        {item.productId || '-'}
                      </td>
                      <td className="px-2.5 py-2 font-medium text-slate-800">
                        {item.parameterName}
                      </td>
                      <td className="px-2.5 py-2 font-mono text-slate-600">
                        {item.batchId != null ? item.batchId : '-'}
                      </td>
                      <td className="px-2.5 py-2 font-mono font-medium text-slate-800">
                        {item.userId || '-'}
                      </td>
                      <td className="px-2.5 py-2 text-center">
                        <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-700">
                          {item.attemptNumber}
                        </span>
                      </td>
                      {/* TRF File (FIXED) */}
                      <td className="w-[90px] min-w-[90px] max-w-[90px] sticky right-[200px] bg-white group-hover:bg-slate-50 z-10 px-2.5 py-2 text-center">
                        {item.trfUrl ? (
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => window.open(item.trfUrl, '_blank', 'noopener,noreferrer')}
                              title="View TRF Document"
                              className="flex h-6 w-6 items-center justify-center rounded-full bg-teal-50 text-teal-700 ring-1 ring-teal-200/80 transition hover:bg-teal-600 hover:text-white"
                            >
                              <Icon name="eye" className="h-3 w-3" />
                            </button>
                            {canDownloadTrf && (
                              <button
                                type="button"
                                onClick={() => handleDownloadTrf(item.trfUrl, `TRF_${item.requestId}.pdf`)}
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
                      {/* Status (FIXED) */}
                      <td className="w-[120px] min-w-[120px] max-w-[120px] sticky right-[80px] bg-white group-hover:bg-slate-50 z-10 px-2.5 py-2 text-center">
                        {getStatusBadge(item.status)}
                      </td>
                      {/* Actions 3-dot Menu (FIXED) */}
                      <td className={`w-[80px] min-w-[80px] max-w-[80px] sticky right-0 bg-white group-hover:bg-slate-50 ${isMenuOpen ? 'z-50' : 'z-10'} px-2.5 py-2 text-center`}>
                        {isTerminal ? (
                          <span className="text-slate-400">—</span>
                        ) : (
                          <div className="relative inline-block text-left" ref={isMenuOpen ? menuRef : null}>
                            <button
                              type="button"
                              onClick={() => setActiveMenuId(isMenuOpen ? null : item.detailId)}
                              className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition"
                            >
                              <Icon name="moreVertical" className="h-4 w-4" />
                            </button>

                            {isMenuOpen && (
                              <div className="absolute right-0 z-50 mt-1 w-44 origin-top-right rounded-xl bg-white shadow-xl ring-1 ring-slate-900/10 py-1 text-xs divide-y divide-slate-100 animate-in fade-in zoom-in-95 duration-100">
                                {/* ASSIGNED Actions */}
                                {isAssigned && canExecute && (
                                  <div className="py-1">
                                    <button
                                      type="button"
                                      onClick={() => handleStart(item.detailId)}
                                      className="flex w-full items-center gap-2 px-3 py-1.5 text-left font-medium text-slate-700 hover:bg-brand-50 hover:text-brand-700"
                                    >
                                      <Icon name="play" className="h-3.5 w-3.5 text-brand-600" />
                                      Start Test
                                    </button>
                                  </div>
                                )}

                                {/* TESTING Actions */}
                                {isTesting && canExecute && (
                                  <div className="py-1">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setActiveMenuId(null)
                                        navigate(`/assigned-tests/${item.detailId}/submit`)
                                      }}
                                      className="flex w-full items-center gap-2 px-3 py-1.5 text-left font-medium text-purple-700 hover:bg-purple-50"
                                    >
                                      <Icon name="checkSquare" className="h-3.5 w-3.5 text-purple-600" />
                                      Submit Test
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => openActionModal(item, 'HOLD')}
                                      className="flex w-full items-center gap-2 px-3 py-1.5 text-left font-medium text-amber-700 hover:bg-amber-50"
                                    >
                                      <Icon name="pause" className="h-3.5 w-3.5 text-amber-600" />
                                      Hold Test
                                    </button>
                                  </div>
                                )}

                                {/* HOLD Actions */}
                                {isHold && canExecute && (
                                  <div className="py-1">
                                    <button
                                      type="button"
                                      onClick={() => handleUnhold(item.detailId)}
                                      className="flex w-full items-center gap-2 px-3 py-1.5 text-left font-medium text-emerald-700 hover:bg-emerald-50"
                                    >
                                      <Icon name="play" className="h-3.5 w-3.5 text-emerald-600" />
                                      Unhold Test
                                    </button>
                                  </div>
                                )}

                                {/* Common: Cancel & Outsource (for ASSIGNED, TESTING, HOLD) */}
                                {(isAssigned || isTesting || isHold) && (canExecute || canReview) && (
                                  <div className="py-1">
                                    <button
                                      type="button"
                                      onClick={() => openActionModal(item, 'OUTSOURCE')}
                                      className="flex w-full items-center gap-2 px-3 py-1.5 text-left font-medium text-slate-700 hover:bg-slate-50"
                                    >
                                      <Icon name="truck" className="h-3.5 w-3.5 text-indigo-600" />
                                      Outsource
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => openActionModal(item, 'CANCEL')}
                                      className="flex w-full items-center gap-2 px-3 py-1.5 text-left font-medium text-rose-600 hover:bg-rose-50"
                                    >
                                      <Icon name="slash" className="h-3.5 w-3.5 text-rose-500" />
                                      Cancel
                                    </button>
                                  </div>
                                )}

                                {/* SUBMITTED Actions: Approve & Rework */}
                                {isSubmitted && canReview && (
                                  <div className="py-1">
                                    <button
                                      type="button"
                                      onClick={() => handleApprove(item.detailId)}
                                      className="flex w-full items-center gap-2 px-3 py-1.5 text-left font-medium text-emerald-700 hover:bg-emerald-50"
                                    >
                                      <Icon name="checkCircle2" className="h-3.5 w-3.5 text-emerald-600" />
                                      Approve
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => openActionModal(item, 'REWORK')}
                                      className="flex w-full items-center gap-2 px-3 py-1.5 text-left font-medium text-amber-700 hover:bg-amber-50"
                                    >
                                      <Icon name="refreshCw" className="h-3.5 w-3.5 text-amber-600" />
                                      Rework
                                    </button>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer pagination */}
        <div className="border-t border-slate-100 bg-slate-50/50 px-4 py-2.5">
          <Pagination
            page={page}
            totalPages={totalPages}
            totalElements={total}
            pageSize={pageSize}
            onPageChange={(p) => dispatch(setPage(p))}
            loading={loading}
          />
        </div>
      </div>

      {/* Modal for Remarks/Reason */}
      <ActionReasonModal
        isOpen={modalConfig.isOpen}
        onClose={() => setModalConfig((prev) => ({ ...prev, isOpen: false }))}
        onSubmit={handleModalSubmit}
        title={modalConfig.title}
        subtitle={modalConfig.subtitle}
        description={modalConfig.description}
        placeholder={modalConfig.placeholder}
        confirmText={modalConfig.confirmText}
        confirmColor={modalConfig.confirmColor}
        icon={modalConfig.icon}
        loading={actionLoading}
        required={true}
      />
    </MasterPageLayout>
  )
}
