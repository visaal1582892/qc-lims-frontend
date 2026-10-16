import { useState } from 'react'
import { Modal } from '../../components/feedback/Modal'
import { FormInput } from '../../components/form/FormInput'
import { FormSelect } from '../../components/form/FormSelect'
import { testParameterApi } from '../../api/testParameterApi'

/**
 * Create/Update modal form for Test Parameters.
 *
 * Tier 2 feature sub-component — uses Modal primitive from Phase 0.
 * All SRS Module 1 fields mapped with client-side validation.
 */
const standardRefOptions = [
  { value: 'IP', label: 'IP' },
  { value: 'BP', label: 'BP' },
  { value: 'USP', label: 'USP' },
  { value: 'EP', label: 'EP' },
  { value: 'JP', label: 'JP' },
  { value: 'IS', label: 'IS' },
  { value: 'MOA', label: 'MOA' },
  { value: 'STP', label: 'STP' },
]

const emptyForm = {
  productId: '',
  parameterName: '',
  standardReference: '',
  stpDocumentNumber: '',
  stpVersionNumber: '',
  minLimit: '',
  maxLimit: '',
  textSpecification: '',
  isCritical: true,
}

export function TestParameterCreateModal({ open, onClose, mode = 'create', initialData, onSuccess, onToast }) {
  // Initialize form from initialData (update mode) or empty (create mode)
  const getInitialForm = () => {
    if (mode === 'update' && initialData) {
      return {
        productId: initialData.productId ?? '',
        parameterName: initialData.parameterName ?? '',
        standardReference: initialData.standardReference ?? '',
        stpDocumentNumber: initialData.stpDocumentNumber ?? '',
        stpVersionNumber: initialData.stpVersionNumber ?? '',
        minLimit: initialData.minLimit?.toString() ?? '',
        maxLimit: initialData.maxLimit?.toString() ?? '',
        textSpecification: initialData.textSpecification ?? '',
        isCritical: initialData.isCritical ?? true,
      }
    }
    return emptyForm
  }

  const [form, setForm] = useState(getInitialForm)
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  const handleChange = (field) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setForm((prev) => ({ ...prev, [field]: value }))
    // Clear error on change
    if (errors[field]) {
      setErrors((prev) => { const next = { ...prev }; delete next[field]; return next })
    }
  }

  const validate = () => {
    const errs = {}
    if (!form.productId) errs.productId = 'Product ID is required'
    if (!form.parameterName?.trim()) errs.parameterName = 'Parameter name is required'
    else if (form.parameterName.length > 150) errs.parameterName = 'Parameter name must be 1-150 characters'
    if (!form.standardReference) errs.standardReference = 'Standard reference is required'

    // Cross-field: min < max if both provided
    const min = form.minLimit ? parseFloat(form.minLimit) : null
    const max = form.maxLimit ? parseFloat(form.maxLimit) : null
    if (min !== null && max !== null && min >= max) {
      errs.minLimit = 'Min limit must be less than max limit'
    }

    // At least one of limits or text spec
    if ((min === null && max === null) && !form.textSpecification?.trim()) {
      errs.textSpecification = 'At least one of min limit, max limit, or text specification is required'
    }

    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return

    const payload = {
      productId: parseInt(form.productId, 10),
      parameterName: form.parameterName.trim(),
      standardReference: form.standardReference,
      stpDocumentNumber: form.stpDocumentNumber || null,
      stpVersionNumber: form.stpVersionNumber || null,
      minLimit: form.minLimit ? parseFloat(form.minLimit) : null,
      maxLimit: form.maxLimit ? parseFloat(form.maxLimit) : null,
      textSpecification: form.textSpecification || null,
      isCritical: form.isCritical,
    }

    setSubmitting(true)
    try {
      let response
      if (mode === 'create') {
        response = await testParameterApi.create(payload)
        onToast?.({ message: 'Test parameter created successfully', type: 'success' })
      } else {
        response = await testParameterApi.update(initialData.id, payload)
        onToast?.({ message: 'Test parameter updated successfully', type: 'success' })
      }
      onClose()
      onSuccess?.(response.data?.data ?? response.data)
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.error || 'Failed to save test parameter'
      onToast?.({ message: msg, type: 'error' })
    } finally {
      setSubmitting(false)
    }
  }

  const title = mode === 'create' ? 'Add Test Parameter' : 'Edit Test Parameter'

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="lg"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition"
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            form="test-parameter-form"
            className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={submitting}
          >
            {submitting ? 'Saving...' : mode === 'create' ? 'Create' : 'Update'}
          </button>
        </>
      }
    >
      <form id="test-parameter-form" onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormInput
            label="Product ID"
            name="productId"
            type="number"
            value={form.productId}
            onChange={handleChange('productId')}
            error={errors.productId}
            required
            placeholder="e.g. 1001"
          />

          <FormSelect
            label="Standard Reference"
            name="standardReference"
            value={form.standardReference}
            onChange={handleChange('standardReference')}
            options={standardRefOptions}
            error={errors.standardReference}
            required
            placeholder="Select standard..."
          />
        </div>

        <FormInput
          label="Parameter Name"
          name="parameterName"
          value={form.parameterName}
          onChange={handleChange('parameterName')}
          error={errors.parameterName}
          required
          placeholder="e.g. HPLC Assay"
          maxLength={150}
        />

        {form.standardReference === 'STP' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormInput
              label="STP Document Number"
              name="stpDocumentNumber"
              value={form.stpDocumentNumber}
              onChange={handleChange('stpDocumentNumber')}
              placeholder="e.g. STP/QC/045"
              helperText="Recommended when standard is STP"
            />

            <FormInput
              label="STP Version Number"
              name="stpVersionNumber"
              value={form.stpVersionNumber}
              onChange={handleChange('stpVersionNumber')}
              placeholder="e.g. v2.0"
            />
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormInput
            label="Min Limit"
            name="minLimit"
            type="number"
            step="any"
            value={form.minLimit}
            onChange={handleChange('minLimit')}
            error={errors.minLimit}
            placeholder="e.g. 98.0000"
            helperText="Lower acceptance bound (optional)"
          />

          <FormInput
            label="Max Limit"
            name="maxLimit"
            type="number"
            step="any"
            value={form.maxLimit}
            onChange={handleChange('maxLimit')}
            placeholder="e.g. 102.0000"
            helperText="Upper acceptance bound (optional)"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">
            Text Specification
            {(!form.minLimit && !form.maxLimit) && <span className="text-rose-500">*</span>}
          </label>
          <textarea
            name="textSpecification"
            value={form.textSpecification}
            onChange={handleChange('textSpecification')}
            rows={3}
            placeholder="e.g. White crystalline powder"
            aria-invalid={!!errors.textSpecification}
            className={`w-full rounded-lg border px-3 py-2 text-sm text-slate-800 placeholder-slate-400 shadow-sm outline-none transition resize-y
              focus:ring-2 focus:border-primary-500 focus:ring-primary-100
              ${errors.textSpecification ? 'border-rose-300 bg-rose-50/30' : 'border-slate-200 bg-white'}`}
          />
          {errors.textSpecification && (
            <p className="text-[11px] text-rose-600 mt-1">{errors.textSpecification}</p>
          )}
        </div>

        <div className="flex items-center gap-2 pt-1">
          <input
            type="checkbox"
            id="field-isCritical"
            name="isCritical"
            checked={form.isCritical}
            onChange={handleChange('isCritical')}
            className="rounded border-slate-300 text-primary-600 focus:ring-primary-100"
          />
          <label htmlFor="field-isCritical" className="text-sm text-slate-700">
            Is Critical Quality Attribute
          </label>
        </div>
      </form>
    </Modal>
  )
}
