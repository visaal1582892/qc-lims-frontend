import { useState, useCallback, useEffect } from 'react'
import { Plus, Eye } from 'lucide-react'
import { PageHeader } from '../../components/layout/PageHeader'
import { DataTable } from '../../components/table/DataTable'
import { Modal } from '../../components/feedback/Modal'
import { receiptChecklistApi } from '../../api/receiptChecklistApi'
import { useAuthRights } from '../../auth/useAuthRights'
import { Rights } from '../../constants/rights'

/**
 * Receipt Checklist page — Physical Verification of TRF samples.
 * SRS Module 3.1 D: 3 radio fields (Sample Name & Batch Match, Free from Damage/Leakage, Pharmacopoeial Reference Mentioned).
 * V-20: Exactly one checklist per TRF.
 */
export function ReceiptChecklistPage() {
  const { hasRight } = useAuthRights()
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState('create')
  const [editingRow, setEditingRow] = useState(null)
  const [toast, setToast] = useState(null)
  const [trfIdFilter, setTrfIdFilter] = useState('')

  const addToast = useCallback((message, type = 'info') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 4000)
  }, [])

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await receiptChecklistApi.getByTrfId(parseInt(trfIdFilter, 10))
      setData([res.data?.data ?? res.data].filter(Boolean))
    } catch (err) {
      setError(err.message ?? 'Failed to load checklist')
      addToast('Failed to load checklist', 'error')
    } finally {
      setLoading(false)
    }
  }, [addToast, trfIdFilter])

  useEffect(() => {
    if (trfIdFilter) {
      fetchData()
    }
  }, [fetchData, trfIdFilter])

  const handleCreate = () => {
    setModalMode('create')
    setEditingRow(null)
    setModalOpen(true)
  }

  const handleEdit = (row) => {
    setModalMode('edit')
    setEditingRow(row)
    setModalOpen(true)
  }

  const handleView = (row) => {
    setModalMode('view')
    setEditingRow(row)
    setModalOpen(true)
  }

  const handleSave = async (formData) => {
    try {
      if (modalMode === 'create') {
        await receiptChecklistApi.create(formData)
        addToast('Checklist created successfully', 'success')
      } else if (modalMode === 'edit' && editingRow) {
        await receiptChecklistApi.update(editingRow.checklistId, formData)
        addToast('Checklist updated successfully', 'success')
      }
      setModalOpen(false)
      if (trfIdFilter) {
        fetchData()
      }
    } catch (err) {
      addToast(err.message ?? 'Failed to save checklist', 'error')
    }
  }

  const columns = [
    { key: 'checklistId', label: 'ID', width: '80px' },
    { key: 'trfId', label: 'TRF ID', width: '100px' },
    { key: 'arNumber', label: 'AR Number', width: '150px' },
    {
      key: 'matchSampleNameBatch',
      label: 'Sample/Match',
      width: '120px',
      render: (val) => <span className={`font-medium ${val === 'Yes' ? 'text-green-600' : val === 'No' ? 'text-red-600' : 'text-slate-500'}`}>{val}</span>,
    },
    {
      key: 'freeFromDamageLeakage',
      label: 'No Damage/Leak',
      width: '120px',
      render: (val) => <span className={`font-medium ${val === 'Yes' ? 'text-green-600' : val === 'No' ? 'text-red-600' : 'text-slate-500'}`}>{val}</span>,
    },
    {
      key: 'pharmacopoeialRefMentioned',
      label: 'Pharma Ref',
      width: '120px',
      render: (val) => <span className={`font-medium ${val === 'Yes' ? 'text-green-600' : val === 'No' ? 'text-red-600' : 'text-slate-500'}`}>{val}</span>,
    },
    { key: 'verifiedByUserId', label: 'Verified By', width: '120px' },
    {
      key: 'verifiedAt',
      label: 'Verified At',
      width: '170px',
      render: (val) => val ? new Date(val).toLocaleString() : '—',
    },
    {
      actions: true,
      render: (_, row) => (
        <>
          {hasRight(Rights.ROLE_RECEIPT_CHECKLIST_VIEW) && (
            <button onClick={() => handleView(row)} className="text-sm text-blue-600 hover:underline" title="View">
              <Eye className="w-4 h-4" />
            </button>
          )}
          {hasRight(Rights.ROLE_RECEIPT_CHECKLIST_UPDATE) && (
            <button onClick={() => handleEdit(row)} className="text-sm text-amber-600 hover:underline ml-2" title="Edit">
              Edit
            </button>
          )}
        </>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="Receipt Checklist"
        subtitle="Physical verification of TRF samples — Sample/Match, Damage/Leakage, Pharmacopoeial Reference"
      />

      {/* Filters and Create */}
      <div className="flex items-center gap-4 mb-4">
        <input
          type="number"
          placeholder="Filter by TRF ID"
          value={trfIdFilter}
          onChange={(e) => setTrfIdFilter(e.target.value)}
          className="px-3 py-2 border border-slate-300 rounded-md text-sm w-48"
        />
        {hasRight(Rights.ROLE_RECEIPT_CHECKLIST_CREATE) && (
          <button
            onClick={handleCreate}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Checklist
          </button>
        )}
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={data}
        loading={loading}
        error={error}
        emptyMessage={trfIdFilter ? 'No checklist found for this TRF' : 'Enter a TRF ID to view its receipt checklist'}
      />

      {/* Create/Edit/View Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={modalMode === 'create' ? 'New Receipt Checklist' : modalMode === 'view' ? 'View Checklist' : 'Edit Checklist'}
        size="md"
      >
        <ChecklistForm
          mode={modalMode}
          initialData={editingRow}
          onSave={handleSave}
          onCancel={() => setModalOpen(false)}
        />
      </Modal>

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-4 right-4 px-4 py-3 rounded-md text-sm shadow-lg text-white ${
          toast.type === 'error' ? 'bg-red-600' : toast.type === 'success' ? 'bg-green-600' : 'bg-blue-600'
        }`}>
          {toast.message}
        </div>
      )}
    </div>
  )
}

/**
 * Receipt Checklist form component.
 * 3 radio fields as per backend ReceiptChecklistRequest DTO.
 */
function ChecklistForm({ mode, initialData, onSave, onCancel }) {
  const isViewMode = mode === 'view'

  const [form, setForm] = useState({
    trfId: initialData?.trfId ?? '',
    arNumber: initialData?.arNumber ?? '',
    matchSampleNameBatch: initialData?.matchSampleNameBatch ?? 'Yes',
    freeFromDamageLeakage: initialData?.freeFromDamageLeakage ?? 'Yes',
    pharmacopoeialRefMentioned: initialData?.pharmacopoeialRefMentioned ?? 'Yes',
    verifiedByUserId: initialData?.verifiedByUserId ?? '',
  })

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async () => {
    const { trfId, matchSampleNameBatch, freeFromDamageLeakage, pharmacopoeialRefMentioned, verifiedByUserId } = form
    if (!trfId) {
      alert('TRF ID is required')
      return
    }
    if (!verifiedByUserId) {
      alert('Verified By user ID is required')
      return
    }
    await onSave({ ...form, verifiedByUserId: parseInt(verifiedByUserId, 10) })
  }

  const radioOptions = ['Yes', 'No', 'NA']

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">TRF ID *</label>
          <input
            type="number"
            value={form.trfId}
            onChange={(e) => handleChange('trfId', e.target.value)}
            disabled={isViewMode || mode === 'edit'}
            className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm disabled:bg-slate-100"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">AR Number</label>
          <input
            type="text"
            value={form.arNumber}
            onChange={(e) => handleChange('arNumber', e.target.value)}
            disabled={isViewMode}
            className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm disabled:bg-slate-100"
          />
        </div>
      </div>

      {/* Radio Fields */}
      {[
        { field: 'matchSampleNameBatch', label: 'Sample Name & Batch Match' },
        { field: 'freeFromDamageLeakage', label: 'Free from Damage/Leakage' },
        { field: 'pharmacopoeialRefMentioned', label: 'Pharmacopoeial Reference Mentioned' },
      ].map(({ field, label }) => (
        <div key={field}>
          <label className="block text-sm font-medium text-slate-700 mb-1">{label} *</label>
          <div className="flex gap-4">
            {radioOptions.map((opt) => (
              <label key={opt} className="flex items-center gap-2">
                <input
                  type="radio"
                  name={field}
                  value={opt}
                  checked={form[field] === opt}
                  onChange={(e) => handleChange(field, e.target.value)}
                  disabled={isViewMode}
                  className="text-blue-600"
                />
                <span className={`text-sm ${opt === 'Yes' ? 'text-green-600' : opt === 'No' ? 'text-red-600' : 'text-slate-500'}`}>
                  {opt}
                </span>
              </label>
            ))}
          </div>
        </div>
      ))}

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Verified By (User ID) *</label>
        <input
          type="number"
          value={form.verifiedByUserId}
          onChange={(e) => handleChange('verifiedByUserId', e.target.value)}
          disabled={isViewMode}
          className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm disabled:bg-slate-100"
        />
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-2">
        <button
          onClick={onCancel}
          className="px-4 py-2 border border-slate-300 rounded-md text-sm hover:bg-slate-50"
        >
          Cancel
        </button>
        {!isViewMode && (
          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
          >
            {mode === 'create' ? 'Create' : 'Save'}
          </button>
        )}
      </div>
    </div>
  )
}
