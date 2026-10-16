/**
 * SubcontractRegisterPage — Digital sub-contract register.
 *
 * Displays all subcontracts dispatched to external labs with
 * create, update, and status tracking functionality.
 *
 * SRS Module 10: Subcontracting Module.
 */
import { useState, useCallback, useEffect } from 'react'
import { Send, RefreshCw, Search, Plus, FileText, X } from 'lucide-react'
import { PageHeader } from '../../components/layout/PageHeader'
import { DataTable } from '../../components/table/DataTable'
import { listSubcontracts, createSubcontract, updateSubcontract, markRoaReceived } from '../../api/subcontractingApi'
import { useAuthRights } from '../../auth/useAuthRights'
import { Rights } from '../../constants/rights'

// Status filter options
const statusFilters = [
  { label: 'All', value: '' },
  { label: 'DISPATCHED', value: 'DISPATCHED' },
  { label: 'IN_PROGRESS', value: 'IN_PROGRESS' },
  { label: 'COMPLETED', value: 'COMPLETED' },
  { label: 'CANCELLED', value: 'CANCELLED' },
]

// Status badge colors
const statusColor = (status) => {
  switch (status) {
    case 'DISPATCHED': return 'info'
    case 'IN_PROGRESS': return 'warning'
    case 'COMPLETED': return 'success'
    case 'CANCELLED': return 'danger'
    default: return 'default'
  }
}

const colorMap = {
  warning: 'bg-amber-100 text-amber-800',
  info: 'bg-blue-100 text-blue-800',
  success: 'bg-green-100 text-green-800',
  danger: 'bg-red-100 text-red-800',
  default: 'bg-gray-100 text-gray-800',
}

function StatusBadge({ status }) {
  const variant = statusColor(status)
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${colorMap[variant] || colorMap.default}`}>
      {status || '-'}
    </span>
  )
}

export function SubcontractRegisterPage() {
  const [subcontracts, setSubcontracts] = useState([])
  const [filteredSubcontracts, setFilteredSubcontracts] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [toast, setToast] = useState(null)
  const { hasRight } = useAuthRights()

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await listSubcontracts().catch(() => ({ data: [] }))
      const data = (res.data || []).map((item) => item.data ?? item) ?? []
      setSubcontracts(data)
      setFilteredSubcontracts(data)
    } catch {
      // Handled by API client
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  useEffect(() => {
    let result = subcontracts
    if (statusFilter) {
      result = result.filter((s) => s.subcontractStatus === statusFilter)
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      result = result.filter(
        (s) =>
          (s.subcontractNo || '').toLowerCase().includes(q) ||
          (s.externalLabName || '').toLowerCase().includes(q) ||
          (s.reason || '').toLowerCase().includes(q)
      )
    }
    setFilteredSubcontracts(result)
  }, [subcontracts, statusFilter, searchQuery])

  const showToast = (message) => {
    setToast({ message, visible: true })
    setTimeout(() => setToast(null), 3000)
  }

  const columns = [
    { key: 'subcontractNo', label: 'Subcontract No.' },
    {
      key: 'externalLabName',
      label: 'External Lab',
    },
    {
      key: 'reason',
      label: 'Reason',
      render: (val) => {
        const text = val || '-'
        return text.length > 60 ? text.substring(0, 60) + '...' : text
      },
    },
    {
      key: 'dispatchDate',
      label: 'Dispatch Date',
      render: (val) => (val ? new Date(val).toLocaleDateString() : '-'),
    },
    {
      key: 'expectedReturnDate',
      label: 'Expected Return',
      render: (val) => (val ? new Date(val).toLocaleDateString() : '-'),
    },
    {
      key: 'subcontractStatus',
      label: 'Status',
      render: (val) => <StatusBadge status={val} />,
    },
    {
      key: 'roaReceived',
      label: 'ROA',
      render: (val) => val ? <FileText className="h-4 w-4 text-green-600" /> : '-',
    },
    {
      key: 'actions',
      label: 'Actions',
      filter: false,
      stickyRight: true,
      width: 140,
      render: (_val, row) => (
        <ActionCell subcontract={row} onRefresh={fetchData} onToast={showToast} />
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Subcontract Register"
        description="Track samples dispatched to external laboratories"
        icon={Send}
        action={
          hasRight(Rights.ROLE_SUBCONTRACT_CREATE) ? (
            <div className="flex gap-2">
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center gap-1 rounded-lg bg-primary-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-primary-700 transition-colors"
              >
                <Plus className="h-4 w-4" /> New Subcontract
              </button>
              <button onClick={fetchData} className="inline-flex items-center rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs hover:bg-slate-50 transition-colors" title="Refresh">
                <RefreshCw className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <button onClick={fetchData} className="inline-flex items-center rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs hover:bg-slate-50 transition-colors" title="Refresh">
              <RefreshCw className="h-4 w-4" />
            </button>
          )
        }
      />

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by subcontract no, lab name, or reason..."
            className="w-full rounded-md border border-slate-200 px-2 py-2 pl-9 text-xs outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-100"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <select
          className="rounded-md border border-slate-200 px-2 py-2 text-xs outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-100"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          {statusFilters.map((f) => (
            <option key={f.value} value={f.value}>{f.label}</option>
          ))}
        </select>
        <span className="text-xs text-slate-500">
          {filteredSubcontracts.length} subcontract{filteredSubcontracts.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={filteredSubcontracts}
        loading={loading}
      />

      {/* Create Modal */}
      {showCreateModal && (
        <SubcontractFormModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false)
            fetchData()
          }}
          onToast={showToast}
        />
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-4 right-4 z-50 rounded-lg bg-green-600 px-4 py-2 text-sm text-white shadow-lg animate-fade-in">
          {toast.message}
        </div>
      )}
    </div>
  )
}

/* --- Sub-components --- */

function ActionCell({ subcontract, onRefresh, onToast }) {
  const { hasRight } = useAuthRights()
  const [showRemarksModal, setShowRemarksModal] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [remarksText, setRemarksText] = useState('')

  const handleUpdateStatus = async (newStatus) => {
    if (!hasRight(Rights.ROLE_SUBCONTRACT_UPDATE)) return
    try {
      await updateSubcontract(subcontract.id, { status: newStatus })
      onToast(`Status updated to ${newStatus} for ${subcontract.subcontractNo}`)
      onRefresh()
    } catch (e) {
      onToast(`Failed: ${e.message || 'Unknown error'}`)
    }
  }

  const handleRoaReceived = async () => {
    if (!hasRight(Rights.ROLE_SUBCONTRACT_UPDATE)) return
    try {
      await markRoaReceived(subcontract.id)
      onToast(`ROA marked as received for ${subcontract.subcontractNo}`)
      onRefresh()
      setShowConfirmModal(false)
    } catch (e) {
      onToast(`Failed: ${e.message || 'Unknown error'}`)
    }
  }

  const handleRemarksSubmit = async () => {
    if (!remarksText.trim()) return
    try {
      await updateSubcontract(subcontract.id, { remarks: remarksText.trim() })
      onToast(`Remarks updated for ${subcontract.subcontractNo}`)
      onRefresh()
      setShowRemarksModal(false)
      setRemarksText('')
    } catch (e) {
      onToast(`Failed: ${e.message || 'Unknown error'}`)
    }
  }

  if (!hasRight(Rights.ROLE_SUBCONTRACT_UPDATE)) {
    return null
  }

  return (
    <div className="flex flex-col gap-1 items-end">
      {!subcontract.roaReceived && ['DISPATCHED', 'IN_PROGRESS'].includes(subcontract.subcontractStatus) && (
        <button
          className="rounded-md bg-green-600 px-2 py-1 text-[10px] font-medium text-white hover:bg-green-700"
          onClick={() => setShowConfirmModal(true)}
        >
          ROA Received
        </button>
      )}
      {subcontract.subcontractStatus === 'DISPATCHED' && (
        <button
          className="rounded-md bg-blue-600 px-2 py-1 text-[10px] font-medium text-white hover:bg-blue-700"
          onClick={() => handleUpdateStatus('IN_PROGRESS')}
        >
          In Progress
        </button>
      )}
      {['DISPATCHED', 'IN_PROGRESS'].includes(subcontract.subcontractStatus) && (
        <button
          className="rounded-md border border-slate-300 bg-white px-2 py-1 text-[10px] font-medium text-slate-700 hover:bg-slate-50"
          onClick={() => setShowRemarksModal(true)}
        >
          Remarks
        </button>
      )}
      {['COMPLETED', 'CANCELLED'].includes(subcontract.subcontractStatus) && (
        <span className="text-[10px] text-slate-400">Closed</span>
      )}

      {/* Remarks Modal (replaces prompt) */}
      {showRemarksModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900">Add Remarks</h3>
              <button onClick={() => setShowRemarksModal(false)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="mb-3 text-xs text-slate-500">Subcontract: {subcontract.subcontractNo}</p>
            <textarea
              className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-primary-500"
              rows={3}
              placeholder="Enter remarks..."
              value={remarksText}
              onChange={(e) => setRemarksText(e.target.value)}
              autoFocus
            />
            <div className="flex justify-end gap-2 mt-4">
              <button type="button" onClick={() => setShowRemarksModal(false)} className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50">
                Cancel
              </button>
              <button onClick={handleRemarksSubmit} className="rounded-lg bg-primary-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-primary-700">
                Save Remarks
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Modal (replaces confirm) */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-semibold text-slate-900">Confirm ROA Received</h3>
              <button onClick={() => setShowConfirmModal(false)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="text-sm text-slate-600">
              Mark ROA as received for <strong>{subcontract.subcontractNo}</strong>? This will update the status to COMPLETED.
            </p>
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setShowConfirmModal(false)} className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50">
                Cancel
              </button>
              <button onClick={handleRoaReceived} className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700">
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function SubcontractFormModal({ onClose, onSuccess, onToast }) {
  const [form, setForm] = useState({
    externalLabName: '',
    reason: '',
    qcHeadId: '',
    trfId: '',
    expectedReturnDate: '',
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.externalLabName || !form.reason || !form.qcHeadId) {
      onToast('External lab name, reason, and QC Head ID are required')
      return
    }
    try {
      const payload = {
        externalLabName: form.externalLabName,
        reason: form.reason,
        qcHeadId: parseInt(form.qcHeadId, 10),
      }
      if (form.trfId) payload.trfId = parseInt(form.trfId, 10)
      if (form.expectedReturnDate) payload.expectedReturnDate = form.expectedReturnDate

      await createSubcontract(payload)
      onToast('Subcontract created successfully')
      onSuccess()
    } catch (e) {
      onToast(`Failed: ${e.message || 'Unknown error'}`)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-900">New Subcontract Entry</h3>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
            <X className="h-4 w-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">TRF ID (optional)</label>
            <input
              type="number"
              className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-primary-500"
              value={form.trfId}
              onChange={(e) => setForm({ ...form, trfId: e.target.value })}
              placeholder="e.g. 123"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">External Lab Name *</label>
            <input
              type="text"
              className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-primary-500"
              value={form.externalLabName}
              onChange={(e) => setForm({ ...form, externalLabName: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Reason for Subcontracting *</label>
            <textarea
              className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-primary-500"
              rows={3}
              value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">QC Head ID *</label>
            <input
              type="number"
              className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-primary-500"
              value={form.qcHeadId}
              onChange={(e) => setForm({ ...form, qcHeadId: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Expected Return Date</label>
            <input
              type="date"
              className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-primary-500"
              value={form.expectedReturnDate}
              onChange={(e) => setForm({ ...form, expectedReturnDate: e.target.value })}
            />
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50">
              Cancel
            </button>
            <button type="submit" className="rounded-lg bg-primary-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-primary-700">
              Create Subcontract
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
