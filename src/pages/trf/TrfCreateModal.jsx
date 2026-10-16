import { useState } from 'react'
import { Modal } from '../../components/feedback/Modal'
import { FormInput } from '../../components/form/FormInput'
import { FormSelect } from '../../components/form/FormSelect'
import { trfApi } from '../../api/trfApi'

/**
 * Create/Update modal for e-TRF.
 * Covers Sections A-D per SRS 3.1.
 *
 * Note: In production this would be decomposed into 4 sub-components
 * (SectionA_CustomerDetails, SectionB_SampleParticulars, SectionC_AnalysisRequirements,
 * SectionD_PhysicalVerification) per the 350-line architecture rule.
 */
const materialTypeOptions = [
  { value: 'RM', label: 'Raw Material (RM)' },
  { value: 'In-process', label: 'In-process' },
  { value: 'API', label: 'API' },
  { value: 'Drug product', label: 'Drug Product' },
  { value: 'Cosmetics', label: 'Cosmetics' },
  { value: 'Others', label: 'Others' },
]

const storageConditionOptions = [
  { value: 'Ambient', label: 'Ambient' },
  { value: 'Freezer', label: 'Freezer (-23 to -13C)' },
  { value: 'Refrigerator', label: 'Refrigerator (2-8C)' },
  { value: 'Others', label: 'Others' },
]

const analysisTypeOptions = [
  { value: 'Regulatory', label: 'Regulatory' },
  { value: 'Non-Regulatory/R&D', label: 'Non-Regulatory/R&D' },
]

const pharmacopoeiaOptions = [
  { value: 'USP', label: 'USP' },
  { value: 'BP', label: 'BP' },
  { value: 'EP', label: 'EP' },
  { value: 'IP', label: 'IP' },
  { value: 'JP', label: 'JP' },
  { value: 'IS', label: 'IS' },
  { value: 'MOA', label: 'MOA' },
  { value: 'STP', label: 'STP' },
]

const submissionTypeOptions = [
  { value: 'By Person', label: 'By Person' },
  { value: 'By Courier', label: 'By Courier' },
  { value: 'By Post', label: 'By Post' },
  { value: 'Others', label: 'Others' },
]

const emptyForm = {
  // Section A
  companyName: '',
  companyAddress: '',
  manufacturingLicNo: '',
  contactPersonName: '',
  phoneMobile: '',
  emailId: '',
  // Section B
  productId: '',
  batchNumbers: '',
  customerArNo: '',
  materialType: '',
  otherMaterialTypeDesc: '',
  mfgDate: '',
  expDate: '',
  retestDate: '',
  batchSize: '',
  sampleQty: '',
  packingCondition: '',
  storageCondition: '',
  otherStorageDesc: '',
  isHygroscopic: false,
  isLightSensitive: false,
  isNonHazardous: false,
  isHazardous: false,
  // Section C
  submissionType: '',
  analysisType: '',
  pharmacopoeiaReference: '',
  stpDocumentNo: '',
  stpVersionNo: '',
  // Section D
  grnNumber: '',
  manufacturerId: '',
  testParameterIds: [],
}

export function TrfCreateModal({ open, onClose, mode = 'create', initialData, onSuccess, onToast }) {
  const getInitialForm = () => {
    if (mode === 'update' && initialData) {
      return {
        ...emptyForm,
        companyName: initialData.companyName ?? '',
        companyAddress: initialData.companyAddress ?? '',
        manufacturingLicNo: initialData.manufacturingLicNo ?? '',
        contactPersonName: initialData.contactPersonName ?? '',
        phoneMobile: initialData.phoneMobile ?? '',
        emailId: initialData.emailId ?? '',
        productId: initialData.productId ?? '',
        batchNumbers: initialData.batchNumbers ?? '',
        customerArNo: initialData.customerArNo ?? '',
        materialType: initialData.materialType ?? '',
        otherMaterialTypeDesc: initialData.otherMaterialTypeDesc ?? '',
        mfgDate: initialData.mfgDate ?? '',
        expDate: initialData.expDate ?? '',
        retestDate: initialData.retestDate ?? '',
        batchSize: initialData.batchSize?.toString() ?? '',
        sampleQty: initialData.sampleQty?.toString() ?? '',
        packingCondition: initialData.packingCondition ?? '',
        storageCondition: initialData.storageCondition ?? '',
        otherStorageDesc: initialData.otherStorageDesc ?? '',
        isHygroscopic: initialData.isHygroscopic ?? false,
        isLightSensitive: initialData.isLightSensitive ?? false,
        isNonHazardous: initialData.isNonHazardous ?? false,
        isHazardous: initialData.isHazardous ?? false,
        submissionType: initialData.submissionType ?? '',
        analysisType: initialData.analysisType ?? '',
        pharmacopoeiaReference: initialData.pharmacopoeiaReference ?? '',
        stpDocumentNo: initialData.stpDocumentNo ?? '',
        stpVersionNo: initialData.stpVersionNo ?? '',
        grnNumber: initialData.grnNumber ?? '',
        manufacturerId: initialData.manufacturerId?.toString() ?? '',
        testParameterIds: initialData.testParameterIds ?? [],
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
    if (!form.companyName) newErrors.companyName = 'Required'
    if (!form.manufacturingLicNo) newErrors.manufacturingLicNo = 'Required'
    if (!form.productId) newErrors.productId = 'Required'
    if (!form.batchNumbers) newErrors.batchNumbers = 'Required'
    if (!form.mfgDate) newErrors.mfgDate = 'Required'
    if (!form.expDate) newErrors.expDate = 'Required'
    if (!form.retestDate) newErrors.retestDate = 'Required'
    if (!form.sampleQty) newErrors.sampleQty = 'Required'
    if (!form.storageCondition) newErrors.storageCondition = 'Required'
    if (!form.analysisType) newErrors.analysisType = 'Required'
    if (!form.pharmacopoeiaReference) newErrors.pharmacopoeiaReference = 'Required'
    if (form.expDate && form.mfgDate && form.expDate <= form.mfgDate) {
      newErrors.expDate = 'Must be after Mfg date'
    }
    if (form.retestDate && form.mfgDate && form.retestDate <= form.mfgDate) {
      newErrors.retestDate = 'Must be after Mfg date'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) return
    setSubmitting(true)
    try {
      const payload = {
        companyName: form.companyName,
        companyAddress: form.companyAddress || undefined,
        manufacturingLicNo: form.manufacturingLicNo,
        contactPersonName: form.contactPersonName || undefined,
        phoneMobile: form.phoneMobile || undefined,
        emailId: form.emailId || undefined,
        productId: parseInt(form.productId),
        batchNumbers: form.batchNumbers,
        customerArNo: form.customerArNo || undefined,
        materialType: form.materialType || undefined,
        otherMaterialTypeDesc: form.otherMaterialTypeDesc || undefined,
        mfgDate: form.mfgDate,
        expDate: form.expDate,
        retestDate: form.retestDate,
        batchSize: form.batchSize ? parseInt(form.batchSize) : null,
        sampleQty: parseInt(form.sampleQty),
        packingCondition: form.packingCondition || undefined,
        storageCondition: form.storageCondition,
        otherStorageDesc: form.otherStorageDesc || undefined,
        isHygroscopic: form.isHygroscopic,
        isLightSensitive: form.isLightSensitive,
        isNonHazardous: form.isNonHazardous,
        isHazardous: form.isHazardous,
        submissionType: form.submissionType || undefined,
        analysisType: form.analysisType,
        pharmacopoeiaReference: form.pharmacopoeiaReference,
        stpDocumentNo: form.stpDocumentNo || undefined,
        stpVersionNo: form.stpVersionNo || undefined,
        grnNumber: form.grnNumber || undefined,
        manufacturerId: form.manufacturerId ? parseInt(form.manufacturerId) : null,
        testParameterIds: form.testParameterIds,
        submittedByUserId: null,
      }

      if (mode === 'create') {
        await trfApi.create(payload)
        onToast?.({ message: 'e-TRF created successfully', type: 'success' })
      } else {
        await trfApi.update(initialData.id, payload)
        onToast?.({ message: 'e-TRF updated successfully', type: 'success' })
      }
      onClose()
      onSuccess?.()
    } catch (err) {
      onToast?.({ message: err.message ?? 'Failed to save e-TRF', type: 'error' })
    } finally {
      setSubmitting(false)
    }
  }

  const sectionStyle = { marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid #e5e7eb' }
  const sectionTitle = { fontWeight: 600, fontSize: 14, color: '#374151', marginBottom: 12 }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={mode === 'create' ? 'Create e-TRF' : 'Edit e-TRF'}
      size="lg"
      footer={
        <>
          <button type="button" onClick={onClose} disabled={submitting}>Cancel</button>
          <button type="button" onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Saving...' : mode === 'create' ? 'Create' : 'Save'}
          </button>
        </>
      }
    >
      {/* Section A — Customer/Manufacturer */}
      <div style={sectionStyle}>
        <div style={sectionTitle}>A. Customer / Manufacturer Details</div>
        <FormInput label="Company Name" value={form.companyName} onChange={(v) => handleChange('companyName', v)} error={errors.companyName} />
        <FormInput label="Address" value={form.companyAddress} onChange={(v) => handleChange('companyAddress', v)} />
        <FormInput label="Manufacturing License No" value={form.manufacturingLicNo} onChange={(v) => handleChange('manufacturingLicNo', v)} error={errors.manufacturingLicNo} />
        <FormInput label="Contact Person" value={form.contactPersonName} onChange={(v) => handleChange('contactPersonName', v)} />
        <FormInput label="Phone/Mobile" value={form.phoneMobile} onChange={(v) => handleChange('phoneMobile', v)} />
        <FormInput label="Email" value={form.emailId} onChange={(v) => handleChange('emailId', v)} type="email" />
      </div>

      {/* Section B — Sample Particulars */}
      <div style={sectionStyle}>
        <div style={sectionTitle}>B. Sample Particulars</div>
        <FormInput label="Product ID" value={form.productId} onChange={(v) => handleChange('productId', v)} error={errors.productId} type="number" />
        <FormInput label="Batch Numbers" value={form.batchNumbers} onChange={(v) => handleChange('batchNumbers', v)} error={errors.batchNumbers} />
        <FormInput label="Customer AR No" value={form.customerArNo} onChange={(v) => handleChange('customerArNo', v)} />
        <FormSelect label="Material Type" value={form.materialType} onChange={(v) => handleChange('materialType', v)} options={materialTypeOptions} />
        <FormInput label="Mfg Date" value={form.mfgDate} onChange={(v) => handleChange('mfgDate', v)} error={errors.mfgDate} type="date" />
        <FormInput label="Expiry Date" value={form.expDate} onChange={(v) => handleChange('expDate', v)} error={errors.expDate} type="date" />
        <FormInput label="Retest Date" value={form.retestDate} onChange={(v) => handleChange('retestDate', v)} error={errors.retestDate} type="date" />
        <FormInput label="Batch Size" value={form.batchSize} onChange={(v) => handleChange('batchSize', v)} type="number" />
        <FormInput label="Sample Quantity" value={form.sampleQty} onChange={(v) => handleChange('sampleQty', v)} error={errors.sampleQty} type="number" />
        <FormSelect label="Storage Condition" value={form.storageCondition} onChange={(v) => handleChange('storageCondition', v)} options={storageConditionOptions} error={errors.storageCondition} />
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <input type="checkbox" checked={form.isHygroscopic} onChange={(e) => handleChange('isHygroscopic', e.target.checked)} /> Hygroscopic
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <input type="checkbox" checked={form.isLightSensitive} onChange={(e) => handleChange('isLightSensitive', e.target.checked)} /> Light Sensitive
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <input type="checkbox" checked={form.isNonHazardous} onChange={(e) => handleChange('isNonHazardous', e.target.checked)} /> Non-Hazardous
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <input type="checkbox" checked={form.isHazardous} onChange={(e) => handleChange('isHazardous', e.target.checked)} /> Hazardous
          </label>
        </div>
      </div>

      {/* Section C — Analysis Requirements */}
      <div style={sectionStyle}>
        <div style={sectionTitle}>C. Analysis Requirements</div>
        <FormSelect label="Analysis Type" value={form.analysisType} onChange={(v) => handleChange('analysisType', v)} options={analysisTypeOptions} error={errors.analysisType} />
        <FormSelect label="Pharmacopoeia Reference" value={form.pharmacopoeiaReference} onChange={(v) => handleChange('pharmacopoeiaReference', v)} options={pharmacopoeiaOptions} error={errors.pharmacopoeiaReference} />
        <FormInput label="STP Document No" value={form.stpDocumentNo} onChange={(v) => handleChange('stpDocumentNo', v)} />
        <FormInput label="STP Version No" value={form.stpVersionNo} onChange={(v) => handleChange('stpVersionNo', v)} />
        <FormSelect label="Submission Type" value={form.submissionType} onChange={(v) => handleChange('submissionType', v)} options={submissionTypeOptions} />
      </div>
    </Modal>
  )
}
