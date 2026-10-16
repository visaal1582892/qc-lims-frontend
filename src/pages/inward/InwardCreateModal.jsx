import { useState } from 'react'
import { Modal } from '../../components/feedback/Modal'
import { FormInput } from '../../components/form/FormInput'
import { FormSelect } from '../../components/form/FormSelect'
import { inwardApi } from '../../api/inwardApi'

/**
 * Create/Update modal for Inward Registration.
 */
const storageLocationOptions = [
  { value: 'Ambient', label: 'Ambient' },
  { value: 'Freezer', label: 'Freezer (-23 to -13C)' },
  { value: 'Refrigerator', label: 'Refrigerator (2-8C)' },
  { value: 'Others', label: 'Others' },
]

const emptyForm = {
  productId: '',
  batchNo: '',
  receivedQuantityPacks: '',
  totalReceivedUnits: '',
  trfId: '',
  storageLocation: '',
  isSubcontracted: false,
  subcontractRemarks: '',
}

export function InwardCreateModal({ open, onClose, mode = 'create', initialData, onSuccess, onToast }) {
  const getInitialForm = () => {
    if (mode === 'update' && initialData) {
      return {
        productId: initialData.productId ?? '',
        batchNo: initialData.batchNo ?? '',
        receivedQuantityPacks: initialData.receivedQuantityPacks?.toString() ?? '',
        totalReceivedUnits: initialData.totalReceivedUnits?.toString() ?? '',
        trfId: initialData.trfId?.toString() ?? '',
        storageLocation: initialData.storageLocation ?? '',
        isSubcontracted: initialData.isSubcontracted ?? false,
        subcontractRemarks: initialData.subcontractRemarks ?? '',
      }
    }
    return { ...emptyForm }
  }

  const [form, setForm] = useState(getInitialForm())
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }))
    }
  }

  const validate = () => {
    const newErrors = {}
    if (!form.productId) newErrors.productId = 'Product ID is required'
    if (!form.batchNo) newErrors.batchNo = 'Batch number is required'
    if (!form.receivedQuantityPacks) newErrors.receivedQuantityPacks = 'Required'
    if (!form.totalReceivedUnits) newErrors.totalReceivedUnits = 'Required'
    if (form.receivedQuantityPacks && form.totalReceivedUnits &&
        parseInt(form.totalReceivedUnits) < parseInt(form.receivedQuantityPacks)) {
      newErrors.totalReceivedUnits = 'Must be >= packs'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) return
    setSubmitting(true)
    try {
      const payload = {
        productId: parseInt(form.productId),
        batchNo: form.batchNo,
        receivedQuantityPacks: parseInt(form.receivedQuantityPacks),
        totalReceivedUnits: parseInt(form.totalReceivedUnits),
        trfId: form.trfId ? parseInt(form.trfId) : null,
        storageLocation: form.storageLocation || undefined,
        isSubcontracted: form.isSubcontracted,
        subcontractRemarks: form.subcontractRemarks || undefined,
      }

      if (mode === 'create') {
        await inwardApi.create(payload)
        onToast?.({ message: 'Inward created successfully', type: 'success' })
      } else {
        await inwardApi.update(initialData.id, payload)
        onToast?.({ message: 'Inward updated successfully', type: 'success' })
      }
      onClose()
      onSuccess?.()
    } catch (err) {
      onToast?.({ message: err.message ?? 'Failed to save', type: 'error' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={mode === 'create' ? 'Create Inward Registration' : 'Edit Inward Registration'}
      footer={
        <>
          <button type="button" onClick={onClose} disabled={submitting}>Cancel</button>
          <button type="button" onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Saving...' : mode === 'create' ? 'Create' : 'Save'}
          </button>
        </>
      }
    >
      <FormInput
        label="Product ID"
        value={form.productId}
        onChange={(v) => handleChange('productId', v)}
        error={errors.productId}
        type="number"
      />
      <FormInput
        label="Batch Number"
        value={form.batchNo}
        onChange={(v) => handleChange('batchNo', v)}
        error={errors.batchNo}
      />
      <FormInput
        label="Received Quantity (Packs)"
        value={form.receivedQuantityPacks}
        onChange={(v) => handleChange('receivedQuantityPacks', v)}
        error={errors.receivedQuantityPacks}
        type="number"
      />
      <FormInput
        label="Total Received Units"
        value={form.totalReceivedUnits}
        onChange={(v) => handleChange('totalReceivedUnits', v)}
        error={errors.totalReceivedUnits}
        type="number"
      />
      <FormInput
        label="TRF ID (optional)"
        value={form.trfId}
        onChange={(v) => handleChange('trfId', v)}
        error={errors.trfId}
        type="number"
      />
      <FormSelect
        label="Storage Location"
        value={form.storageLocation}
        onChange={(v) => handleChange('storageLocation', v)}
        options={storageLocationOptions}
      />
      <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <input
          type="checkbox"
          checked={form.isSubcontracted}
          onChange={(e) => handleChange('isSubcontracted', e.target.checked)}
        />
        Subcontracted
      </label>
      {form.isSubcontracted && (
        <FormInput
          label="Subcontract Remarks"
          value={form.subcontractRemarks}
          onChange={(v) => handleChange('subcontractRemarks', v)}
        />
      )}
    </Modal>
  )
}
