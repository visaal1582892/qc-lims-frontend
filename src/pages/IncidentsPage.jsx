import { useEffect, useState, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  fetchIncidents,
  setPage,
  setFilter,
  clearFilters,
  approveRetestThunk,
  rejectSampleThunk,
} from '../store/slices/incidentsSlice'
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
import ProductIdLink from '../components/ProductIdLink'
import useDebounce from '../hooks/useDebounce'
import useAuth from '../auth/useAuth'
import { Rights } from '../constants/rights'
import { useToast } from '../components/Toast'

export default function IncidentsPage() {
  const dispatch = useDispatch()
  const { hasRight } = useAuth()
  const toast = useToast()

  const canResolve = hasRight(Rights.ROLE_SYSTEM_ADMIN) || hasRight(Rights.ROLE_INCIDENTS_RESOLVE)

  const {
    items,
    total,
    totalPages,
    loading,
    actionLoading,
    page,
    pageSize,
    filters,
  } = useSelector((state) => state.incidents)

  // Debounced filters
  const dIncidentId = useDebounce(filters.incidentId, 350)
  const dArNumber = useDebounce(filters.arNumber, 350)
  const dProductId = useDebounce(filters.productId, 350)
  const dProductName = useDebounce(filters.productName, 350)
  const dParamName = useDebounce(filters.paramName, 350)
  const dBatchId = useDebounce(filters.batchId, 350)
  const dAnalystId = useDebounce(filters.analystId, 350)

  useEffect(() => {
    dispatch(fetchIncidents())
  }, [dispatch, page, dIncidentId, dArNumber, dProductId, dProductName, dParamName, dBatchId, dAnalystId, filters.status])

  const hasActiveFilters = Boolean(
    filters.incidentId ||
    filters.arNumber ||
    filters.productId ||
    filters.productName ||
    filters.paramName ||
    filters.batchId ||
    filters.analystId ||
    (filters.status && filters.status !== 'P')
  )

  const handleClearFilters = () => {
    dispatch(clearFilters())
  }

  // 3-dot menu open state
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

  // Action Reason Modal State
  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    incidentId: null,
    actionType: null, // 'APPROVE_RETEST', 'REJECT_SAMPLE'
    title: '',
    subtitle: '',
    description: '',
    placeholder: '',
    confirmText: '',
    confirmColor: 'brand',
    icon: 'edit',
  })

  const openResolveModal = (incident, actionType) => {
    setActiveMenuId(null)
    const baseSubtitle = `Incident #${incident.incidentId} — AR: ${incident.arNumber || '-'} (${incident.parameterName})`

    if (actionType === 'APPROVE_RETEST') {
      setModalConfig({
        isOpen: true,
        incidentId: incident.incidentId,
        actionType: 'APPROVE_RETEST',
        title: 'Approve Retest Execution',
        subtitle: baseSubtitle,
        description: 'Approving this incident will invalidate the failed attempt and generate a new assigned attempt linked to this incident record.',
        placeholder: 'Reason for approving retest (e.g., standard protocol re-run, investigation authorized)...',
        confirmText: 'Approve Retest',
        confirmColor: 'brand',
        icon: 'refreshCw',
      })
    } else if (actionType === 'REJECT_SAMPLE') {
      setModalConfig({
        isOpen: true,
        incidentId: incident.incidentId,
        actionType: 'REJECT_SAMPLE',
        title: 'Reject Sample',
        subtitle: baseSubtitle,
        description: 'Confirming rejection will mark the test execution as REJECTED and close this incident. Parent QC request status remains unaffected.',
        placeholder: 'Detailed justification for rejecting the sample...',
        confirmText: 'Reject Sample',
        confirmColor: 'rose',
        icon: 'ban',
      })
    }
  }

  const handleModalSubmit = async (reason) => {
    const { incidentId, actionType } = modalConfig
    try {
      if (actionType === 'APPROVE_RETEST') {
        await dispatch(approveRetestThunk({ incidentId, reason })).unwrap()
        toast.success('Retest approved. New attempt generated.')
      } else if (actionType === 'REJECT_SAMPLE') {
        await dispatch(rejectSampleThunk({ incidentId, reason })).unwrap()
        toast.success('Sample rejected successfully.')
      }
      setModalConfig((prev) => ({ ...prev, isOpen: false }))
    } catch (err) {
      toast.error(err || 'Action failed')
    }
  }

  const getStatusBadge = (status) => {
    if (status === 'ANSWERED' || status === 'A') {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
          <Icon name="checkCircle2" className="h-3 w-3" />
          Answered
        </span>
      )
    }
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700 ring-1 ring-inset ring-amber-600/20">
        <Icon name="clock" className="h-3 w-3" />
        Pending
      </span>
    )
  }

  return (
    <div className="mx-auto flex h-full min-h-0 w-full flex-1 flex-col gap-3">
      {/* Page Header */}
      <header className="shrink-0 flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600 ring-1 ring-amber-100">
            <Icon name="alertTriangle" className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <h1 className="truncate text-lg font-semibold text-slate-900">QC Incidents</h1>
            <p className="text-xs text-slate-500">
              {total} incident{total === 1 ? '' : 's'} total • Quality control incident investigation and retest approvals
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
            onClick={() => dispatch(fetchIncidents())}
            className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 active:scale-[0.98]"
            title="Refresh list"
          >
            <Icon name="refreshCw" className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </header>

      {/* Table Container */}
      <MasterPageLayout>
        <div className="hidden flex-1 min-h-0 overflow-auto sm:block">
          <table className="w-full min-w-max border-separate border-spacing-0 text-left text-xs text-slate-600">
            <MasterTableHeader>
              <MasterHeaderRow>
                <th className="w-[100px] min-w-[85px] px-2.5 py-2.5 font-semibold text-slate-700">Inc ID</th>
                <th className="w-[110px] min-w-[100px] px-2.5 py-2.5 font-semibold text-slate-700">AR Number</th>
                <th className="w-[110px] min-w-[85px] px-2.5 py-2.5 font-semibold text-slate-700">Product ID</th>
                <th className="min-w-[140px] px-2.5 py-2.5 font-semibold text-slate-700">Parameter</th>
                <th className="w-[110px] min-w-[80px] px-2.5 py-2.5 font-semibold text-slate-700">Batch ID</th>
                <th className="w-[110px] min-w-[90px] px-2.5 py-2.5 font-semibold text-slate-700">Analyst</th>
                <th className="min-w-[160px] px-2.5 py-2.5 font-semibold text-slate-700">Remarks / Reason</th>
                <th className="w-[130px] px-2.5 py-2.5 font-semibold text-slate-700">Raised At</th>

                {/* FIXED COLUMNS ON RIGHT: Status, Actions */}
                <th className="w-[110px] min-w-[110px] max-w-[110px] sticky right-[80px] bg-slate-50 z-20 px-2.5 py-2.5 text-center font-semibold text-slate-700">
                  Status
                </th>
                <th className="w-[80px] min-w-[80px] max-w-[80px] sticky right-0 bg-slate-50 z-20 px-2.5 py-2.5 text-center font-semibold text-slate-700">
                  Actions
                </th>
              </MasterHeaderRow>

              <MasterFilterRow>
                <th className="px-2.5 py-1.5">
                  <FilterInput
                    value={filters.incidentId}
                    onChange={(val) => dispatch(setFilter({ key: 'incidentId', value: val }))}
                    placeholder="Filter ID..."
                  />
                </th>
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
                    placeholder="Filter Param..."
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
                    value={filters.analystId}
                    onChange={(val) => dispatch(setFilter({ key: 'analystId', value: val }))}
                    placeholder="Filter Analyst..."
                  />
                </th>
                <th className="px-2.5 py-1.5 text-center text-[11px] font-normal text-slate-400">—</th>
                <th className="px-2.5 py-1.5 text-center text-[11px] font-normal text-slate-400">—</th>

                {/* FIXED FILTERS ON RIGHT: Status, Actions */}
                <th className="w-[110px] min-w-[110px] max-w-[110px] sticky right-[80px] bg-slate-50 z-20 px-1.5 py-1.5">
                  <FilterSelect
                    value={filters.status}
                    onChange={(val) => dispatch(setFilter({ key: 'status', value: val }))}
                    options={[
                      { value: 'all', label: 'All' },
                      { value: 'P', label: 'Pending' },
                      { value: 'A', label: 'Answered' },
                    ]}
                  />
                </th>
                <th className="w-[80px] min-w-[80px] max-w-[80px] sticky right-0 bg-slate-50 z-20 px-1.5 py-1.5 text-center">—</th>
              </MasterFilterRow>
            </MasterTableHeader>

            <tbody className="divide-y divide-slate-100 bg-white">
              {loading ? (
                <TableStatusRow colSpan={10}>Loading quality incidents…</TableStatusRow>
              ) : items.length === 0 ? (
                <TableStatusRow colSpan={10}>
                  {hasActiveFilters ? 'No matching incidents found.' : 'No quality incidents found.'}
                </TableStatusRow>
              ) : (
                items.map((item) => {
                  const isMenuOpen = activeMenuId === item.incidentId
                  const isPending = item.status === 'PENDING' || item.status === 'P'

                  return (
                    <tr key={item.incidentId} className={`group hover:bg-slate-50/80 transition-colors ${isMenuOpen ? 'relative z-50' : ''}`}>
                      <td className="px-2.5 py-2 font-mono font-bold text-slate-800">
                        {item.incidentId}
                      </td>
                      <td className="px-2.5 py-2 font-mono font-semibold text-slate-800">
                        {item.arNumber || '-'}
                      </td>
                      <td className="px-2.5 py-2 font-mono text-[11px]">
                        <ProductIdLink productId={item.productId} />
                      </td>
                      <td className="px-2.5 py-2 font-medium text-slate-800">
                        {item.parameterName}
                      </td>
                      <td className="px-2.5 py-2 font-mono text-slate-600">
                        {item.batchId != null ? item.batchId : '-'}
                      </td>
                      <td className="px-2.5 py-2 text-slate-700 font-medium">
                        {item.analystId}
                      </td>
                      <td className="px-2.5 py-2 text-slate-600 max-w-[200px] truncate" title={item.remarks}>
                        {item.remarks || <span className="text-slate-400 italic">No notes</span>}
                      </td>
                      <td className="px-2.5 py-2 text-[11px] text-slate-500 whitespace-nowrap">
                        {item.createdAt ? new Date(item.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : '-'}
                      </td>
                      {/* Status (FIXED) */}
                      <td className="w-[110px] min-w-[110px] max-w-[110px] sticky right-[80px] bg-white group-hover:bg-slate-50 z-10 px-2.5 py-2 text-center">
                        {getStatusBadge(item.status)}
                      </td>
                      {/* Fixed 3-dot Menu (FIXED) */}
                      <td className={`w-[80px] min-w-[80px] max-w-[80px] sticky right-0 bg-white group-hover:bg-slate-50 ${isMenuOpen ? 'z-50' : 'z-10'} px-2.5 py-2 text-center`}>
                        {!isPending ? (
                          <span className="text-slate-400">—</span>
                        ) : (
                          <div className="relative inline-block text-left" ref={isMenuOpen ? menuRef : null}>
                            <button
                              type="button"
                              onClick={() => setActiveMenuId(isMenuOpen ? null : item.incidentId)}
                              className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition"
                            >
                              <Icon name="moreVertical" className="h-4 w-4" />
                            </button>

                            {isMenuOpen && canResolve && (
                              <div className="absolute right-0 z-50 mt-1 w-44 origin-top-right rounded-xl bg-white shadow-xl ring-1 ring-slate-900/10 py-1 text-xs divide-y divide-slate-100 animate-in fade-in zoom-in-95 duration-100">
                                <div className="py-1">
                                  <button
                                    type="button"
                                    onClick={() => openResolveModal(item, 'APPROVE_RETEST')}
                                    className="flex w-full items-center gap-2 px-3 py-1.5 text-left font-medium text-emerald-700 hover:bg-emerald-50"
                                  >
                                    <Icon name="refreshCw" className="h-3.5 w-3.5 text-emerald-600" />
                                    Approve Retest
                                  </button>
                                </div>
                                <div className="py-1">
                                  <button
                                    type="button"
                                    onClick={() => openResolveModal(item, 'REJECT_SAMPLE')}
                                    className="flex w-full items-center gap-2 px-3 py-1.5 text-left font-medium text-rose-600 hover:bg-rose-50"
                                  >
                                    <Icon name="ban" className="h-3.5 w-3.5 text-rose-500" />
                                    Reject Sample
                                  </button>
                                </div>
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

      {/* Action Reason Modal */}
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
    </div>
  )
}
