import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { eTrfApi } from '../api/qcRequests'
import { useToast } from '../components/Toast'
import Icon from '../components/Icon'
import ActionReasonModal from '../components/ActionReasonModal'
import useAuth from '../auth/useAuth'
import { Rights } from '../constants/rights'
import { downloadFileFromProxy, viewFile } from '../utils/fileDownload'
import { normalizeTrfStatus } from '../utils/trfStatus'
import TrfStatusBadge from '../components/TrfStatusBadge'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE_10_REGEX = /^[0-9]{10}$/
const ALLOWED_MIME_TYPES = ['application/pdf', 'image/jpeg', 'image/png']
const MAX_FILE_BYTES = 25 * 1024 * 1024

const VALIDATABLE_FIELDS = [
  'manufacturerName',
  'manufacturerLicenseNo',
  'manufacturerAddress',
  'contactPersonName',
  'contactPhone',
  'contactEmail',
  'customerArNumber',
  'productTypeSelect',
  'productTypeOther',
  'productStateSelect',
  'productStateOther',
  'batchSize',
  'sampleQuantity',
  'packingCondition',
  'storageCondition',
  'stpDocumentNumber',
  'versionNo',
  'testStandardsSelect',
  'testStandardsOther',
  'notes',
  'hazardousSample',
]

function getFieldValidationError(field, data) {
  const val = (data[field] ?? '').toString().trim()
  switch (field) {
    case 'manufacturerName':
      if (!val) return 'Enter the manufacturer name.'
      if (val.length > 255) return 'Manufacturer name cannot exceed 255 characters.'
      return ''
    case 'manufacturerLicenseNo':
      if (!val) return 'Enter the manufacturer license number.'
      if (val.length > 200) return 'License number cannot exceed 200 characters.'
      return ''
    case 'manufacturerAddress':
      if (!val) return 'Enter the full manufacturing address.'
      return ''
    case 'contactPersonName':
      if (!val) return 'Enter the contact person name.'
      if (val.length > 150) return 'Contact person name cannot exceed 150 characters.'
      return ''
    case 'contactPhone':
      if (!val) return 'Enter a 10-digit contact phone number.'
      if (!PHONE_10_REGEX.test(val)) return 'Contact phone must be exactly 10 numeric digits.'
      return ''
    case 'contactEmail':
      if (!val) return 'Enter the contact email address.'
      if (!EMAIL_REGEX.test(val)) return 'Enter a valid email address (e.g., name@domain.com).'
      if (val.length > 150) return 'Email address cannot exceed 150 characters.'
      return ''
    case 'customerArNumber':
      if (!val) return 'Enter the customer AR number.'
      if (val.length > 100) return 'Customer AR number cannot exceed 100 characters.'
      return ''
    case 'productTypeSelect':
      if (!val) return 'Select a product type.'
      return ''
    case 'productTypeOther':
      if (data.productTypeSelect === 'OTHER') {
        if (!val) return 'Specify the custom product type.'
        if (val.length > 100) return 'Product type cannot exceed 100 characters.'
      }
      return ''
    case 'productStateSelect':
      if (!val) return 'Select a product state.'
      return ''
    case 'productStateOther':
      if (data.productStateSelect === 'OTHER') {
        if (!val) return 'Specify the custom product state.'
        if (val.length > 100) return 'Product state cannot exceed 100 characters.'
      }
      return ''
    case 'batchSize':
      if (!val) return 'Enter the batch size.'
      if (val.length > 100) return 'Batch size cannot exceed 100 characters.'
      return ''
    case 'sampleQuantity':
      if (!val) return 'Enter the sample quantity.'
      if (val.length > 100) return 'Sample quantity cannot exceed 100 characters.'
      return ''
    case 'packingCondition':
      if (!val) return 'Enter the packing condition.'
      if (val.length > 255) return 'Packing condition cannot exceed 255 characters.'
      return ''
    case 'storageCondition':
      if (!val) return 'Enter the storage condition.'
      if (val.length > 255) return 'Storage condition cannot exceed 255 characters.'
      return ''
    case 'stpDocumentNumber':
      if (!val) return 'Enter the STP / document number.'
      if (val.length > 150) return 'STP document number cannot exceed 150 characters.'
      return ''
    case 'versionNo':
      if (!val) return 'Enter the version number.'
      if (val.length > 50) return 'Version number cannot exceed 50 characters.'
      return ''
    case 'testStandardsSelect':
      if (!val) return 'Select a test standard.'
      return ''
    case 'testStandardsOther':
      if (data.testStandardsSelect === 'OTHER') {
        if (!val) return 'Specify the custom test standard.'
        if (val.length > 100) return 'Test standard cannot exceed 100 characters.'
      }
      return ''
    case 'notes':
      if (!val) return 'Enter special instructions or notes.'
      return ''
    case 'hazardousSample':
      if (val !== 'YES' && val !== 'NO') return 'Select whether the sample is hazardous.'
      return ''
    default:
      return ''
  }
}

function validateAllFields(data) {
  const nextErrors = {}
  for (const field of VALIDATABLE_FIELDS) {
    const msg = getFieldValidationError(field, data)
    if (msg) nextErrors[field] = msg
  }
  return nextErrors
}

function extractFileNameFromUrl(url) {
  if (!url) return ''
  const pathPart = url.split('?')[0]
  try {
    return decodeURIComponent(pathPart.substring(pathPart.lastIndexOf('/') + 1) || 'Attached TRF Document')
  } catch {
    return 'Attached TRF Document'
  }
}

function buildInitialFormState(p) {
  const saved = p?.savedDetails || p?.existingTrf
  if (saved) {
    const isStandardType = ['COSMETICS', 'DRUGS'].includes(saved.productType)
    const isStandardState = ['RM', 'FINISHED_PRODUCT', 'IN_PROCESS'].includes(saved.productState)
    const isStandardStandard = ['IS', 'USP', 'BP', 'EP', 'IP', 'JP', 'MOA'].includes(saved.testStandards)
    const resolvedUrl = saved.trfUrl ?? p?.trfUrl ?? ''

    return {
      nextFormData: {
        manufacturerName: saved.manufacturerName ?? '',
        manufacturerAddress: saved.manufacturerAddress ?? '',
        manufacturerLicenseNo: saved.manufacturerLicenseNo ?? '',
        contactPersonName: saved.contactPersonName ?? '',
        contactPhone: (saved.contactPhone ?? '').replace(/\D/g, '').slice(0, 10),
        contactEmail: saved.contactEmail ?? '',

        customerArNumber: saved.customerArNumber ?? '',
        productTypeSelect: isStandardType ? saved.productType : saved.productType ? 'OTHER' : 'DRUGS',
        productTypeOther: isStandardType ? '' : saved.productType ?? '',
        productStateSelect: isStandardState ? saved.productState : saved.productState ? 'OTHER' : 'FINISHED_PRODUCT',
        productStateOther: isStandardState ? '' : saved.productState ?? '',
        batchSize: saved?.batchSize ?? p?.batchSize ?? '',
        sampleQuantity: saved?.sampleQuantity ?? p?.sampleQuantity ?? '',
        packingCondition: saved.packingCondition ?? '',
        storageCondition: saved.storageCondition ?? '',

        stpDocumentNumber: saved.stpDocumentNumber ?? '',
        versionNo: saved.versionNo ?? '',
        testStandardsSelect: isStandardStandard ? saved.testStandards : saved.testStandards ? 'OTHER' : 'IP',
        testStandardsOther: isStandardStandard ? '' : saved.testStandards ?? '',

        notes: saved.notes ?? '',
        hazardousSample: saved.hazardousSample ?? 'NO',
        trfUrl: resolvedUrl,
      },
      fileName: extractFileNameFromUrl(resolvedUrl),
    }
  }

  const resolvedUrl = p?.trfUrl ?? ''
  return {
    nextFormData: {
      manufacturerName: '',
      manufacturerAddress: '',
      manufacturerLicenseNo: '',
      contactPersonName: '',
      contactPhone: '',
      contactEmail: '',
      customerArNumber: '',
      productTypeSelect: 'DRUGS',
      productTypeOther: '',
      productStateSelect: 'FINISHED_PRODUCT',
      productStateOther: '',
      batchSize: p?.batchSize ?? '',
      sampleQuantity: p?.sampleQuantity ?? '',
      packingCondition: '',
      storageCondition: '',
      stpDocumentNumber: '',
      versionNo: '',
      testStandardsSelect: 'IP',
      testStandardsOther: '',
      notes: '',
      hazardousSample: 'NO',
      trfUrl: resolvedUrl,
    },
    fileName: extractFileNameFromUrl(resolvedUrl),
  }
}

export default function ETrfPage({ readOnlyMode = false }) {
  const { requestId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const toast = useToast()
  const { hasRight } = useAuth()

  const canEditTrf =
    hasRight(Rights.ROLE_SYSTEM_ADMIN) ||
    hasRight(Rights.ROLE_E_TRF_WRITE) ||
    hasRight(Rights.ROLE_TRF_UPLOAD)
  const canApproveTrf =
    hasRight(Rights.ROLE_SYSTEM_ADMIN) ||
    hasRight(Rights.ROLE_TRF_APPROVE)
  const canReviseTrf =
    hasRight(Rights.ROLE_SYSTEM_ADMIN) ||
    hasRight(Rights.ROLE_TRF_REVISE)
  const canDownloadTrf =
    hasRight(Rights.ROLE_SYSTEM_ADMIN) ||
    hasRight(Rights.ROLE_TRF_DOWNLOAD) ||
    hasRight(Rights.ROLE_TRF_READ)

  const [reloadSeq, setReloadSeq] = useState(0)
  const currentKey = `${requestId}:${reloadSeq}`
  const [loadedKey, setLoadedKey] = useState('')
  const loading = loadedKey !== currentKey
  const [loadError, setLoadError] = useState(null)
  const [saving, setSaving] = useState(false)
  const [prefill, setPrefill] = useState(null)
  const toastRef = useRef(toast)
  useEffect(() => {
    toastRef.current = toast
  }, [toast])

  // File upload state (held in React state until atomic form submission)
  const [uploadingFile, setUploadingFile] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [uploadedFileName, setUploadedFileName] = useState('')
  const fileInputRef = useRef(null)

  // Reviewer actions in view mode
  const [approveConfirmOpen, setApproveConfirmOpen] = useState(false)
  const [reviseModalOpen, setReviseModalOpen] = useState(false)
  const [reviewActionLoading, setReviewActionLoading] = useState(false)

  // Validation & interaction state
  const [touched, setTouched] = useState({})
  const [errors, setErrors] = useState({})
  const [submitAttempted, setSubmitAttempted] = useState(false)
  const [liveErrorAnnouncement, setLiveErrorAnnouncement] = useState('')
  const formRef = useRef(null)

  const [formData, setFormData] = useState({
    // Section 1: Manufacturer & Customer Details
    manufacturerName: '',
    manufacturerAddress: '',
    manufacturerLicenseNo: '',
    contactPersonName: '',
    contactPhone: '',
    contactEmail: '',

    // Section 2: Product Sample Details
    customerArNumber: '',
    productTypeSelect: 'DRUGS',
    productTypeOther: '',
    productStateSelect: 'FINISHED_PRODUCT',
    productStateOther: '',
    batchSize: '',
    sampleQuantity: '',
    packingCondition: '',
    storageCondition: '',

    // Section 3: Test Method / Pharmacopoeial Reference
    stpDocumentNumber: '',
    versionNo: '',
    testStandardsSelect: 'IP',
    testStandardsOther: '',

    // Section 4: Notes & Instructions
    notes: '',
    hazardousSample: 'NO',

    // Section 5: Optional TRF File URL
    trfUrl: '',
  })

  useEffect(() => {
    let active = true
    const targetKey = `${requestId}:${reloadSeq}`

    eTrfApi
      .getPrefill(requestId)
      .then((res) => {
        if (!active) return
        const p = res.data
        const { nextFormData, fileName } = buildInitialFormState(p)
        setPrefill(p)
        setFormData(nextFormData)
        setUploadedFileName(fileName)
        setTouched({})
        setErrors({})
        setSubmitAttempted(false)
        setLoadError(null)
        setLoadedKey(targetKey)
      })
      .catch((err) => {
        if (!active) return
        const msg = err.response?.data?.message || err.message || 'Failed to load Electronic TRF details.'
        setLoadError(msg)
        setLoadedKey(targetKey)
        toastRef.current?.error(msg)
      })

    return () => {
      active = false
    }
  }, [requestId, reloadSeq])

  const handleRetry = () => {
    setLoadError(null)
    setReloadSeq((prev) => prev + 1)
  }

  const currentStatus = normalizeTrfStatus(prefill?.status)
  const isEditableStatus = currentStatus === 'PENDING_DETAILS' || currentStatus === 'NEEDS_REVISION'
  const isReadOnly = Boolean(readOnlyMode || location.pathname.endsWith('/view') || !canEditTrf || !isEditableStatus)
  const revisionRemarks = prefill?.revisionRemarks || prefill?.existingTrf?.revisionRemarks || ''
  const backTo = location.state?.backTo || '/trf-requests'
  const backLabel = location.state?.backLabel || 'Back to TRF Requests'

  const handleChange = (e) => {
    if (isReadOnly) return
    const { name } = e.target
    let { value } = e.target

    // Enforce max 10 digits for contactPhone
    if (name === 'contactPhone') {
      value = value.replace(/\D/g, '').slice(0, 10)
    }

    const updatedData = { ...formData, [name]: value }
    setFormData(updatedData)

    // Clear or re-check error on input if field already had an error or form was submitted
    if (errors[name] || submitAttempted) {
      const errMsg = getFieldValidationError(name, updatedData)
      setErrors((prev) => {
        const next = { ...prev }
        if (errMsg) next[name] = errMsg
        else delete next[name]
        if (name === 'productTypeSelect' && value !== 'OTHER') delete next.productTypeOther
        if (name === 'productStateSelect' && value !== 'OTHER') delete next.productStateOther
        if (name === 'testStandardsSelect' && value !== 'OTHER') delete next.testStandardsOther
        return next
      })
    }
  }

  const handleBlur = (e) => {
    if (isReadOnly) return
    const { name } = e.target
    if (!VALIDATABLE_FIELDS.includes(name)) return

    setTouched((prev) => ({ ...prev, [name]: true }))
    const errMsg = getFieldValidationError(name, formData)
    setErrors((prev) => {
      const next = { ...prev }
      if (errMsg) next[name] = errMsg
      else delete next[name]
      return next
    })
  }

  const handleFileUpload = async (file) => {
    if (isReadOnly || !file) return
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      toast.error('Only PDF, JPEG, and PNG files are accepted.')
      return
    }
    if (file.size > MAX_FILE_BYTES) {
      toast.error('File size exceeds the 25MB limit.')
      return
    }

    setUploadingFile(true)
    try {
      const res = await eTrfApi.uploadFile(file)
      const url = res.data?.url
      if (!url) {
        throw new Error('Upload response did not return a document URL.')
      }
      setFormData((prev) => ({ ...prev, trfUrl: url }))
      setUploadedFileName(file.name)
      toast.success('TRF document uploaded. Remember to Save & Submit the form to apply.')
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to upload TRF document.')
    } finally {
      setUploadingFile(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleFileInputChange = (e) => {
    const file = e.target.files?.[0]
    if (file) handleFileUpload(file)
  }

  const handleFileDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    if (isReadOnly) return
    const file = e.dataTransfer.files?.[0]
    if (file) handleFileUpload(file)
  }

  const handleRemoveFile = () => {
    if (isReadOnly) return
    setFormData((prev) => ({ ...prev, trfUrl: '' }))
    setUploadedFileName('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (isReadOnly) return

    setSubmitAttempted(true)
    const validationErrors = validateAllFields(formData)
    setErrors(validationErrors)

    const allTouched = {}
    for (const f of VALIDATABLE_FIELDS) allTouched[f] = true
    setTouched(allTouched)

    const errorKeys = Object.keys(validationErrors)
    if (errorKeys.length > 0) {
      const firstKey = errorKeys[0]
      const firstMessage = validationErrors[firstKey]
      setLiveErrorAnnouncement(`Form contains ${errorKeys.length} validation error(s). First error: ${firstMessage}`)
      toast.error(firstMessage)

      // Move focus directly to the first invalid control
      const targetEl = formRef.current?.querySelector(`[name="${firstKey}"]`)
      if (targetEl && typeof targetEl.focus === 'function') {
        targetEl.focus()
        targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
      return
    }

    setLiveErrorAnnouncement('')

    const resolvedProductType =
      formData.productTypeSelect === 'OTHER'
        ? formData.productTypeOther.trim()
        : formData.productTypeSelect

    const resolvedProductState =
      formData.productStateSelect === 'OTHER'
        ? formData.productStateOther.trim()
        : formData.productStateSelect

    const resolvedTestStandards =
      formData.testStandardsSelect === 'OTHER'
        ? formData.testStandardsOther.trim()
        : formData.testStandardsSelect

    const payload = {
      manufacturerName: formData.manufacturerName.trim(),
      manufacturerAddress: formData.manufacturerAddress.trim(),
      manufacturerLicenseNo: formData.manufacturerLicenseNo.trim(),
      contactPersonName: formData.contactPersonName.trim(),
      contactPhone: formData.contactPhone.trim(),
      contactEmail: formData.contactEmail.trim(),

      customerArNumber: formData.customerArNumber.trim(),
      productType: resolvedProductType,
      productState: resolvedProductState,
      mfgDate: prefill?.mfgDate ?? null,
      expDate: prefill?.expDate ?? null,
      batchSize: formData.batchSize.trim(),
      sampleQuantity: formData.sampleQuantity.trim(),
      packingCondition: formData.packingCondition.trim(),
      storageCondition: formData.storageCondition.trim(),

      stpDocumentNumber: formData.stpDocumentNumber.trim(),
      versionNo: formData.versionNo.trim(),
      testStandards: resolvedTestStandards,

      notes: formData.notes.trim(),
      hazardousSample: formData.hazardousSample || 'NO',
      trfUrl: formData.trfUrl?.trim() ? formData.trfUrl.trim() : null,
    }

    setSaving(true)
    try {
      await eTrfApi.saveDetails(requestId, payload)
      toast.success('E-TRF submitted for approval!')
      navigate('/trf-requests')
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to save E-TRF.')
    } finally {
      setSaving(false)
    }
  }

  const handleApproveInView = async () => {
    setReviewActionLoading(true)
    try {
      await eTrfApi.approveTrf(requestId)
      toast.success(`TRF for Request #${requestId} approved successfully!`)
      setApproveConfirmOpen(false)
      navigate('/trf-requests')
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to approve TRF.')
    } finally {
      setReviewActionLoading(false)
    }
  }

  const handleReviseInView = async (remarks) => {
    setReviewActionLoading(true)
    try {
      await eTrfApi.reviseTrf(requestId, remarks)
      toast.success(`TRF for Request #${requestId} marked as NEEDS REVISION.`)
      setReviseModalOpen(false)
      navigate('/trf-requests')
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to submit revision.')
    } finally {
      setReviewActionLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center gap-2 text-slate-500">
        <Icon name="refreshCw" className="h-5 w-5 animate-spin text-brand-600" />
        <span className="text-sm">Loading Electronic TRF details…</span>
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="mx-auto flex h-full max-w-lg flex-col items-center justify-center gap-4 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 text-rose-600 ring-1 ring-rose-200">
          <Icon name="alertTriangle" className="h-6 w-6" />
        </span>
        <div>
          <h2 className="text-base font-bold text-slate-900">Unable to load Electronic TRF</h2>
          <p className="mt-1 text-xs text-slate-500">{loadError}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate('/trf-requests')}
            className="rounded-md border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
          >
            Back to TRF Requests
          </button>
          <button
            type="button"
            onClick={handleRetry}
            className="inline-flex items-center gap-1.5 rounded-md bg-brand-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-brand-700 cursor-pointer"
          >
            <Icon name="refreshCw" className="h-3.5 w-3.5" />
            Retry
          </button>
        </div>
      </div>
    )
  }

  const inputBaseClass = (fieldName) => {
    const hasErr = Boolean(errors[fieldName] && (touched[fieldName] || submitAttempted))
    if (isReadOnly) {
      return 'w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700 cursor-not-allowed'
    }
    if (hasErr) {
      return 'w-full rounded-md border border-rose-400 bg-rose-50/40 px-3 py-2 text-xs text-slate-900 shadow-2xs placeholder:text-slate-400 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-200'
    }
    return 'w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 shadow-2xs placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100'
  }

  const getShownError = (fieldName) =>
    errors[fieldName] && (touched[fieldName] || submitAttempted) ? errors[fieldName] : ''

  return (
    <div className="mx-auto flex h-full min-h-0 w-full flex-1 flex-col gap-4 overflow-y-auto pr-1">
      {/* Live region for polite screen reader announcement */}
      <div aria-live="polite" className="sr-only">
        {liveErrorAnnouncement}
      </div>

      {/* Page Header */}
      <header className="shrink-0 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 pb-3">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={() => navigate(backTo)}
            className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-xs transition hover:bg-slate-50 cursor-pointer shrink-0"
          >
            <Icon name="arrowLeft" className="h-3.5 w-3.5" />
            {backLabel}
          </button>
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-teal-600 ring-1 ring-teal-100">
            <Icon name="fileText" className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="truncate text-lg font-semibold text-slate-900">
                Electronic Test Request Form (E-TRF)
              </h1>
              <TrfStatusBadge status={currentStatus} />
              {isReadOnly && (
                <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600 ring-1 ring-slate-200">
                  VIEW ONLY
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500">
              Testing Request #{requestId} • Product:{' '}
              <span className="font-semibold text-slate-800">{prefill?.productId}</span>
              {prefill?.productName ? ` (${prefill.productName})` : ''}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!isReadOnly ? (
            <button
              type="submit"
              form="etrf-form"
              disabled={saving || uploadingFile}
              className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-brand-700 active:scale-[0.98] transition disabled:opacity-50 cursor-pointer"
            >
              {saving ? (
                <>
                  <Icon name="refreshCw" className="h-3.5 w-3.5 animate-spin" />
                  Submitting…
                </>
              ) : (
                <>
                  <Icon name="save" className="h-3.5 w-3.5" />
                  Save &amp; Submit for Approval
                </>
              )}
            </button>
          ) : (
            currentStatus === 'PENDING_APPROVAL' && (
              <>
                {canReviseTrf && (
                  <button
                    type="button"
                    onClick={() => setReviseModalOpen(true)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-amber-300 bg-amber-50 px-3.5 py-2 text-xs font-semibold text-amber-800 shadow-xs hover:bg-amber-100 transition cursor-pointer"
                  >
                    <Icon name="refreshCw" className="h-3.5 w-3.5" />
                    Revise TRF
                  </button>
                )}
                {canApproveTrf && (
                  <button
                    type="button"
                    onClick={() => setApproveConfirmOpen(true)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700 transition cursor-pointer"
                  >
                    <Icon name="checkCircle2" className="h-3.5 w-3.5" />
                    Approve TRF
                  </button>
                )}
              </>
            )
          )}
        </div>
      </header>

      {/* Reviewer Revision Remarks Banner */}
      {currentStatus === 'NEEDS_REVISION' && revisionRemarks && (
        <div
          role="alert"
          className="shrink-0 rounded-xl border border-amber-300 bg-amber-50/90 p-4 shadow-xs"
        >
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-700 ring-1 ring-amber-200">
              <Icon name="alertTriangle" className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="text-xs font-bold uppercase tracking-wide text-amber-900">
                Revision Required — Reviewer Remarks
              </h2>
              <p className="mt-1 text-xs text-amber-950 leading-relaxed whitespace-pre-wrap">
                {revisionRemarks}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Form Sections */}
      <form
        id="etrf-form"
        ref={formRef}
        noValidate
        onSubmit={handleSubmit}
        className="space-y-4 pb-8"
      >
        {/* Section 1: Manufacturer & Customer Details */}
        <section className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-brand-50 text-brand-700 font-bold text-xs ring-1 ring-brand-100">
              1
            </div>
            <h2 className="text-sm font-bold text-slate-900">Manufacturer &amp; Customer Details</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              id="etrf-manufacturerName"
              label="Manufacturer Name"
              required={!isReadOnly}
              error={getShownError('manufacturerName')}
            >
              <input
                id="etrf-manufacturerName"
                type="text"
                name="manufacturerName"
                value={formData.manufacturerName}
                onChange={handleChange}
                onBlur={handleBlur}
                disabled={isReadOnly}
                required
                maxLength={255}
                aria-invalid={getShownError('manufacturerName') ? 'true' : 'false'}
                aria-describedby={getShownError('manufacturerName') ? 'etrf-manufacturerName-error' : undefined}
                placeholder="e.g. Medplus Health Services Ltd."
                className={inputBaseClass('manufacturerName')}
              />
            </FormField>

            <FormField
              id="etrf-manufacturerLicenseNo"
              label="Manufacturer License Number"
              required={!isReadOnly}
              error={getShownError('manufacturerLicenseNo')}
            >
              <input
                id="etrf-manufacturerLicenseNo"
                type="text"
                name="manufacturerLicenseNo"
                value={formData.manufacturerLicenseNo}
                onChange={handleChange}
                onBlur={handleBlur}
                disabled={isReadOnly}
                required
                maxLength={200}
                autoCorrect="off"
                spellCheck={false}
                aria-invalid={getShownError('manufacturerLicenseNo') ? 'true' : 'false'}
                aria-describedby={getShownError('manufacturerLicenseNo') ? 'etrf-manufacturerLicenseNo-error' : undefined}
                placeholder="e.g. 25/MD/2021"
                className={inputBaseClass('manufacturerLicenseNo')}
              />
            </FormField>

            <div className="md:col-span-2">
              <FormField
                id="etrf-manufacturerAddress"
                label="Manufacturer Address"
                required={!isReadOnly}
                error={getShownError('manufacturerAddress')}
              >
                <textarea
                  id="etrf-manufacturerAddress"
                  name="manufacturerAddress"
                  rows={2}
                  value={formData.manufacturerAddress}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  disabled={isReadOnly}
                  required
                  autoComplete="street-address"
                  aria-invalid={getShownError('manufacturerAddress') ? 'true' : 'false'}
                  aria-describedby={getShownError('manufacturerAddress') ? 'etrf-manufacturerAddress-error' : undefined}
                  placeholder="Full manufacturing site address…"
                  className={inputBaseClass('manufacturerAddress')}
                />
              </FormField>
            </div>

            <FormField
              id="etrf-contactPersonName"
              label="Contact Person Name"
              required={!isReadOnly}
              error={getShownError('contactPersonName')}
            >
              <input
                id="etrf-contactPersonName"
                type="text"
                name="contactPersonName"
                value={formData.contactPersonName}
                onChange={handleChange}
                onBlur={handleBlur}
                disabled={isReadOnly}
                required
                maxLength={150}
                autoComplete="name"
                aria-invalid={getShownError('contactPersonName') ? 'true' : 'false'}
                aria-describedby={getShownError('contactPersonName') ? 'etrf-contactPersonName-error' : undefined}
                placeholder="Contact person name"
                className={inputBaseClass('contactPersonName')}
              />
            </FormField>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FormField
                id="etrf-contactPhone"
                label="Contact Phone"
                hint="10 numeric digits"
                required={!isReadOnly}
                error={getShownError('contactPhone')}
              >
                <input
                  id="etrf-contactPhone"
                  type="text"
                  name="contactPhone"
                  value={formData.contactPhone}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  disabled={isReadOnly}
                  required
                  maxLength={10}
                  inputMode="numeric"
                  pattern="\d{10}"
                  autoComplete="tel-national"
                  aria-invalid={getShownError('contactPhone') ? 'true' : 'false'}
                  aria-describedby={
                    getShownError('contactPhone')
                      ? 'etrf-contactPhone-hint etrf-contactPhone-error'
                      : 'etrf-contactPhone-hint'
                  }
                  placeholder="10-digit number"
                  className={inputBaseClass('contactPhone')}
                />
              </FormField>

              <FormField
                id="etrf-contactEmail"
                label="Contact Email"
                hint="Format: name@domain.com"
                required={!isReadOnly}
                error={getShownError('contactEmail')}
              >
                <input
                  id="etrf-contactEmail"
                  type="email"
                  name="contactEmail"
                  value={formData.contactEmail}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  disabled={isReadOnly}
                  required
                  maxLength={150}
                  autoComplete="email"
                  autoCorrect="off"
                  autoCapitalize="none"
                  spellCheck={false}
                  aria-invalid={getShownError('contactEmail') ? 'true' : 'false'}
                  aria-describedby={
                    getShownError('contactEmail')
                      ? 'etrf-contactEmail-hint etrf-contactEmail-error'
                      : 'etrf-contactEmail-hint'
                  }
                  placeholder="contact@example.com"
                  className={inputBaseClass('contactEmail')}
                />
              </FormField>
            </div>
          </div>
        </section>

        {/* Section 2: Product Sample Details */}
        <section className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-brand-50 text-brand-700 font-bold text-xs ring-1 ring-brand-100">
              2
            </div>
            <h2 className="text-sm font-bold text-slate-900">Product Sample Details</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Auto-filled & Read-only */}
            <div>
              <label htmlFor="etrf-productId" className="block text-xs font-semibold text-slate-500 mb-1">
                Product ID (Auto-filled)
              </label>
              <input
                id="etrf-productId"
                type="text"
                value={prefill?.productId || ''}
                disabled
                className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-mono text-slate-600 cursor-not-allowed"
              />
            </div>

            <div className="md:col-span-2">
              <label htmlFor="etrf-productName" className="block text-xs font-semibold text-slate-500 mb-1">
                Product Name (Auto-filled)
              </label>
              <input
                id="etrf-productName"
                type="text"
                value={prefill?.productName || ''}
                disabled
                className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600 cursor-not-allowed"
              />
            </div>

            <div>
              <label htmlFor="etrf-batchInfo" className="block text-xs font-semibold text-slate-500 mb-1">
                Batch ID / Batch No (Auto-filled)
              </label>
              <input
                id="etrf-batchInfo"
                type="text"
                value={`${prefill?.batchId || ''} (${prefill?.batch || ''})`}
                disabled
                className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-mono text-slate-600 cursor-not-allowed"
              />
            </div>

            <div>
              <label htmlFor="etrf-mfgDate" className="block text-xs font-semibold text-slate-500 mb-1">
                Manufacturing Date (Auto-filled)
              </label>
              <input
                id="etrf-mfgDate"
                type="text"
                value={prefill?.mfgDate || '—'}
                disabled
                className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600 cursor-not-allowed"
              />
            </div>

            <div>
              <label htmlFor="etrf-expDate" className="block text-xs font-semibold text-slate-500 mb-1">
                Expiry Date (Auto-filled)
              </label>
              <input
                id="etrf-expDate"
                type="text"
                value={prefill?.expDate || '—'}
                disabled
                className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600 cursor-not-allowed"
              />
            </div>

            {/* Editable mandatory fields */}
            <FormField
              id="etrf-customerArNumber"
              label="Customer AR Number"
              required={!isReadOnly}
              error={getShownError('customerArNumber')}
            >
              <input
                id="etrf-customerArNumber"
                type="text"
                name="customerArNumber"
                value={formData.customerArNumber}
                onChange={handleChange}
                onBlur={handleBlur}
                disabled={isReadOnly}
                required
                maxLength={100}
                autoCorrect="off"
                spellCheck={false}
                aria-invalid={getShownError('customerArNumber') ? 'true' : 'false'}
                aria-describedby={getShownError('customerArNumber') ? 'etrf-customerArNumber-error' : undefined}
                placeholder="e.g. AR-CUST-2026-001"
                className={inputBaseClass('customerArNumber')}
              />
            </FormField>

            <FormField
              id="etrf-productTypeSelect"
              label="Product Type"
              required={!isReadOnly}
              error={getShownError('productTypeSelect') || getShownError('productTypeOther')}
            >
              <select
                id="etrf-productTypeSelect"
                name="productTypeSelect"
                value={formData.productTypeSelect}
                onChange={handleChange}
                onBlur={handleBlur}
                disabled={isReadOnly}
                required
                aria-invalid={getShownError('productTypeSelect') ? 'true' : 'false'}
                className={`${inputBaseClass('productTypeSelect')} ${!isReadOnly ? 'cursor-pointer' : ''}`}
              >
                <option value="DRUGS">DRUGS</option>
                <option value="COSMETICS">COSMETICS</option>
                <option value="OTHER">OTHER (Specify below)</option>
              </select>
              {formData.productTypeSelect === 'OTHER' && (
                <input
                  id="etrf-productTypeOther"
                  type="text"
                  name="productTypeOther"
                  value={formData.productTypeOther}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  disabled={isReadOnly}
                  required
                  maxLength={100}
                  aria-label="Custom Product Type"
                  aria-invalid={getShownError('productTypeOther') ? 'true' : 'false'}
                  aria-describedby={getShownError('productTypeOther') ? 'etrf-productTypeSelect-error' : undefined}
                  placeholder="Specify product type…"
                  className={`w-full mt-2 rounded-md border px-3 py-1.5 text-xs focus:outline-none focus:ring-2 disabled:bg-slate-50 disabled:text-slate-600 disabled:border-slate-200 ${
                    getShownError('productTypeOther') && !isReadOnly
                      ? 'border-rose-400 bg-rose-50/40 text-slate-900 focus:border-rose-500 focus:ring-rose-200'
                      : 'border-brand-300 bg-brand-50/40 text-brand-900 focus:border-brand-500 focus:ring-brand-200'
                  }`}
                />
              )}
            </FormField>

            <FormField
              id="etrf-productStateSelect"
              label="Product State"
              required={!isReadOnly}
              error={getShownError('productStateSelect') || getShownError('productStateOther')}
            >
              <select
                id="etrf-productStateSelect"
                name="productStateSelect"
                value={formData.productStateSelect}
                onChange={handleChange}
                onBlur={handleBlur}
                disabled={isReadOnly}
                required
                aria-invalid={getShownError('productStateSelect') ? 'true' : 'false'}
                className={`${inputBaseClass('productStateSelect')} ${!isReadOnly ? 'cursor-pointer' : ''}`}
              >
                <option value="FINISHED_PRODUCT">FINISHED_PRODUCT</option>
                <option value="RM">RM (Raw Material)</option>
                <option value="IN_PROCESS">IN_PROCESS</option>
                <option value="OTHER">OTHER (Specify below)</option>
              </select>
              {formData.productStateSelect === 'OTHER' && (
                <input
                  id="etrf-productStateOther"
                  type="text"
                  name="productStateOther"
                  value={formData.productStateOther}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  disabled={isReadOnly}
                  required
                  maxLength={100}
                  aria-label="Custom Product State"
                  aria-invalid={getShownError('productStateOther') ? 'true' : 'false'}
                  aria-describedby={getShownError('productStateOther') ? 'etrf-productStateSelect-error' : undefined}
                  placeholder="Specify product state…"
                  className={`w-full mt-2 rounded-md border px-3 py-1.5 text-xs focus:outline-none focus:ring-2 disabled:bg-slate-50 disabled:text-slate-600 disabled:border-slate-200 ${
                    getShownError('productStateOther') && !isReadOnly
                      ? 'border-rose-400 bg-rose-50/40 text-slate-900 focus:border-rose-500 focus:ring-rose-200'
                      : 'border-brand-300 bg-brand-50/40 text-brand-900 focus:border-brand-500 focus:ring-brand-200'
                  }`}
                />
              )}
            </FormField>

            <FormField
              id="etrf-batchSize"
              label="Batch Size (Auto-fetched)"
              required={!isReadOnly}
              error={getShownError('batchSize')}
            >
              <input
                id="etrf-batchSize"
                type="text"
                name="batchSize"
                value={formData.batchSize}
                onChange={handleChange}
                onBlur={handleBlur}
                disabled={isReadOnly}
                required
                maxLength={100}
                aria-invalid={getShownError('batchSize') ? 'true' : 'false'}
                aria-describedby={getShownError('batchSize') ? 'etrf-batchSize-error' : undefined}
                placeholder="e.g. 100000 Tablets"
                className={inputBaseClass('batchSize')}
              />
            </FormField>

            <FormField
              id="etrf-sampleQuantity"
              label="Sample Quantity (Auto-fetched)"
              required={!isReadOnly}
              error={getShownError('sampleQuantity')}
            >
              <input
                id="etrf-sampleQuantity"
                type="text"
                name="sampleQuantity"
                value={formData.sampleQuantity}
                onChange={handleChange}
                onBlur={handleBlur}
                disabled={isReadOnly}
                required
                maxLength={100}
                aria-invalid={getShownError('sampleQuantity') ? 'true' : 'false'}
                aria-describedby={getShownError('sampleQuantity') ? 'etrf-sampleQuantity-error' : undefined}
                placeholder="e.g. 50 Units"
                className={inputBaseClass('sampleQuantity')}
              />
            </FormField>

            <FormField
              id="etrf-packingCondition"
              label="Packing Condition"
              required={!isReadOnly}
              error={getShownError('packingCondition')}
            >
              <input
                id="etrf-packingCondition"
                type="text"
                name="packingCondition"
                value={formData.packingCondition}
                onChange={handleChange}
                onBlur={handleBlur}
                disabled={isReadOnly}
                required
                maxLength={255}
                aria-invalid={getShownError('packingCondition') ? 'true' : 'false'}
                aria-describedby={getShownError('packingCondition') ? 'etrf-packingCondition-error' : undefined}
                placeholder="e.g. Sealed Alu-Alu Blister"
                className={inputBaseClass('packingCondition')}
              />
            </FormField>

            <div className="md:col-span-3">
              <FormField
                id="etrf-storageCondition"
                label="Storage Condition"
                required={!isReadOnly}
                error={getShownError('storageCondition')}
              >
                <input
                  id="etrf-storageCondition"
                  type="text"
                  name="storageCondition"
                  value={formData.storageCondition}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  disabled={isReadOnly}
                  required
                  maxLength={255}
                  aria-invalid={getShownError('storageCondition') ? 'true' : 'false'}
                  aria-describedby={getShownError('storageCondition') ? 'etrf-storageCondition-error' : undefined}
                  placeholder="e.g. Store below 25°C protected from moisture and direct sunlight"
                  className={inputBaseClass('storageCondition')}
                />
              </FormField>
            </div>
          </div>
        </section>

        {/* Section 3: Test Method / Pharmacopoeial Reference */}
        <section className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-brand-50 text-brand-700 font-bold text-xs ring-1 ring-brand-100">
              3
            </div>
            <h2 className="text-sm font-bold text-slate-900">
              Test Method &amp; Pharmacopoeial Reference
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField
              id="etrf-stpDocumentNumber"
              label="STP / Document Number"
              required={!isReadOnly}
              error={getShownError('stpDocumentNumber')}
            >
              <input
                id="etrf-stpDocumentNumber"
                type="text"
                name="stpDocumentNumber"
                value={formData.stpDocumentNumber}
                onChange={handleChange}
                onBlur={handleBlur}
                disabled={isReadOnly}
                required
                maxLength={150}
                autoCorrect="off"
                spellCheck={false}
                aria-invalid={getShownError('stpDocumentNumber') ? 'true' : 'false'}
                aria-describedby={getShownError('stpDocumentNumber') ? 'etrf-stpDocumentNumber-error' : undefined}
                placeholder="e.g. STP-QC-2026-445"
                className={inputBaseClass('stpDocumentNumber')}
              />
            </FormField>

            <FormField
              id="etrf-versionNo"
              label="Version Number"
              required={!isReadOnly}
              error={getShownError('versionNo')}
            >
              <input
                id="etrf-versionNo"
                type="text"
                name="versionNo"
                value={formData.versionNo}
                onChange={handleChange}
                onBlur={handleBlur}
                disabled={isReadOnly}
                required
                maxLength={50}
                autoCorrect="off"
                spellCheck={false}
                aria-invalid={getShownError('versionNo') ? 'true' : 'false'}
                aria-describedby={getShownError('versionNo') ? 'etrf-versionNo-error' : undefined}
                placeholder="e.g. v2.1"
                className={inputBaseClass('versionNo')}
              />
            </FormField>

            <FormField
              id="etrf-testStandardsSelect"
              label="Test Standards"
              required={!isReadOnly}
              error={getShownError('testStandardsSelect') || getShownError('testStandardsOther')}
            >
              <select
                id="etrf-testStandardsSelect"
                name="testStandardsSelect"
                value={formData.testStandardsSelect}
                onChange={handleChange}
                onBlur={handleBlur}
                disabled={isReadOnly}
                required
                aria-invalid={getShownError('testStandardsSelect') ? 'true' : 'false'}
                className={`${inputBaseClass('testStandardsSelect')} ${!isReadOnly ? 'cursor-pointer' : ''}`}
              >
                <option value="IP">IP (Indian Pharmacopoeia)</option>
                <option value="USP">USP (US Pharmacopeia)</option>
                <option value="BP">BP (British Pharmacopoeia)</option>
                <option value="EP">EP (European Pharmacopoeia)</option>
                <option value="JP">JP (Japanese Pharmacopoeia)</option>
                <option value="IS">IS (Indian Standard)</option>
                <option value="MOA">MOA (Method of Analysis)</option>
                <option value="OTHER">OTHER (Specify below)</option>
              </select>
              {formData.testStandardsSelect === 'OTHER' && (
                <input
                  id="etrf-testStandardsOther"
                  type="text"
                  name="testStandardsOther"
                  value={formData.testStandardsOther}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  disabled={isReadOnly}
                  required
                  maxLength={100}
                  aria-label="Custom Test Standard"
                  aria-invalid={getShownError('testStandardsOther') ? 'true' : 'false'}
                  aria-describedby={getShownError('testStandardsOther') ? 'etrf-testStandardsSelect-error' : undefined}
                  placeholder="Specify standard…"
                  className={`w-full mt-2 rounded-md border px-3 py-1.5 text-xs focus:outline-none focus:ring-2 disabled:bg-slate-50 disabled:text-slate-600 disabled:border-slate-200 ${
                    getShownError('testStandardsOther') && !isReadOnly
                      ? 'border-rose-400 bg-rose-50/40 text-slate-900 focus:border-rose-500 focus:ring-rose-200'
                      : 'border-brand-300 bg-brand-50/40 text-brand-900 focus:border-brand-500 focus:ring-brand-200'
                  }`}
                />
              )}
            </FormField>
          </div>
        </section>

        {/* Section 4: Notes & Safety Instructions */}
        <section className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-brand-50 text-brand-700 font-bold text-xs ring-1 ring-brand-100">
              4
            </div>
            <h2 className="text-sm font-bold text-slate-900">Notes &amp; Safety Instructions</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <FormField
                id="etrf-notes"
                label="Special Instructions / Notes"
                required={!isReadOnly}
                error={getShownError('notes')}
              >
                <textarea
                  id="etrf-notes"
                  name="notes"
                  rows={3}
                  value={formData.notes}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  disabled={isReadOnly}
                  required
                  aria-invalid={getShownError('notes') ? 'true' : 'false'}
                  aria-describedby={getShownError('notes') ? 'etrf-notes-error' : undefined}
                  placeholder="Special analytical instructions, handling precautions, or analyst notes…"
                  className={inputBaseClass('notes')}
                />
              </FormField>
            </div>

            <FormField
              id="etrf-hazardousSample"
              label="Hazardous Sample"
              hint="Select 'YES' if sample requires fume hood or PPE precautions."
              required={!isReadOnly}
              error={getShownError('hazardousSample')}
            >
              <select
                id="etrf-hazardousSample"
                name="hazardousSample"
                value={formData.hazardousSample}
                onChange={handleChange}
                onBlur={handleBlur}
                disabled={isReadOnly}
                required
                aria-invalid={getShownError('hazardousSample') ? 'true' : 'false'}
                aria-describedby="etrf-hazardousSample-hint"
                className={`${inputBaseClass('hazardousSample')} ${!isReadOnly ? 'cursor-pointer' : ''}`}
              >
                <option value="NO">NO (Standard Handling)</option>
                <option value="YES">YES (Hazardous / Toxic)</option>
              </select>
            </FormField>
          </div>
        </section>

        {/* Section 5: Supporting TRF Document (Optional) */}
        <section className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-teal-50 text-teal-700 font-bold text-xs ring-1 ring-teal-100">
                5
              </div>
              <h2 className="text-sm font-bold text-slate-900">
                TRF Document Attachment{' '}
                <span className="font-normal text-xs text-slate-500">(Optional)</span>
              </h2>
            </div>
            <span className="text-[11px] text-slate-400">
              PDF, JPEG, PNG • Max 25MB
            </span>
          </div>

          {/* Attached document card */}
          {formData.trfUrl && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-teal-200 bg-teal-50/40 p-3 text-xs">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-100 text-teal-700 shrink-0">
                  <Icon name="fileText" className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <p className="font-semibold text-slate-800 truncate">
                    {uploadedFileName || 'Attached TRF Document'}
                  </p>
                  <p className="text-[10.5px] text-teal-700 truncate">{formData.trfUrl}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => viewFile(formData.trfUrl)}
                  className="inline-flex items-center gap-1 rounded-md bg-white px-2.5 py-1 text-[11px] font-semibold text-teal-700 ring-1 ring-teal-200 hover:bg-teal-600 hover:text-white transition cursor-pointer"
                >
                  <Icon name="eye" className="h-3.5 w-3.5" />
                  View
                </button>
                {canDownloadTrf && (
                  <button
                    type="button"
                    onClick={() => downloadFileFromProxy(formData.trfUrl, `TRF_Req_${requestId}`, toast)}
                    className="inline-flex items-center gap-1 rounded-md bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-700 hover:text-white transition cursor-pointer"
                  >
                    <Icon name="download" className="h-3.5 w-3.5" />
                    Download
                  </button>
                )}
                {!isReadOnly && (
                  <button
                    type="button"
                    onClick={handleRemoveFile}
                    className="inline-flex items-center gap-1 rounded-md bg-white px-2.5 py-1 text-[11px] font-semibold text-rose-600 ring-1 ring-rose-200 hover:bg-rose-600 hover:text-white transition cursor-pointer"
                    title="Remove attached TRF file"
                  >
                    <Icon name="trash2" className="h-3.5 w-3.5" />
                    Remove
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Upload zone (hidden in read-only mode unless empty indicator needed) */}
          {!isReadOnly ? (
            <div
              onDragOver={(e) => {
                e.preventDefault()
                setDragOver(true)
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleFileDrop}
              className={`relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-5 transition ${
                dragOver
                  ? 'border-teal-500 bg-teal-50/60'
                  : 'border-slate-300 bg-slate-50/40 hover:border-slate-400 hover:bg-slate-50'
              }`}
            >
              <input
                id="etrf-file-upload"
                ref={fileInputRef}
                type="file"
                accept="application/pdf,image/jpeg,image/png"
                onChange={handleFileInputChange}
                disabled={uploadingFile}
                className="sr-only"
              />
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-50 text-teal-600 mb-2 ring-4 ring-teal-50/60">
                <Icon
                  name={uploadingFile ? 'refreshCw' : 'cloudUpload'}
                  className={`h-5 w-5 ${uploadingFile ? 'animate-spin' : ''}`}
                />
              </span>
              <p className="text-xs font-semibold text-slate-700">
                {uploadingFile
                  ? 'Uploading TRF document…'
                  : formData.trfUrl
                    ? 'Drag & drop a replacement TRF file or browse'
                    : 'Drag & drop optional TRF file or browse'}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5 mb-3">
                Document is saved only when you click &ldquo;Save &amp; Submit for Approval&rdquo;.
              </p>
              <label
                htmlFor="etrf-file-upload"
                className={`inline-flex items-center gap-1.5 rounded-md border border-teal-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-teal-700 shadow-2xs transition hover:bg-teal-600 hover:text-white ${
                  uploadingFile ? 'pointer-events-none opacity-50' : 'cursor-pointer'
                }`}
              >
                <Icon name="upload" className="h-3.5 w-3.5" />
                {formData.trfUrl ? 'Replace File' : 'Browse File'}
              </label>
            </div>
          ) : !formData.trfUrl ? (
            <p className="text-xs text-slate-400 italic">No external TRF document attached.</p>
          ) : null}
        </section>

        {/* Form Bottom Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => navigate(backTo)}
            className="rounded-lg bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-2xs ring-1 ring-slate-300 ring-inset hover:bg-slate-50 transition cursor-pointer"
          >
            {isReadOnly ? backLabel : 'Cancel'}
          </button>

          {!isReadOnly && (
            <button
              type="submit"
              disabled={saving || uploadingFile}
              className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-brand-700 active:scale-[0.98] transition disabled:opacity-50 cursor-pointer"
            >
              {saving ? (
                <>
                  <Icon name="refreshCw" className="h-3.5 w-3.5 animate-spin" />
                  Submitting…
                </>
              ) : (
                <>
                  <Icon name="save" className="h-3.5 w-3.5" />
                  Save &amp; Submit for Approval
                </>
              )}
            </button>
          )}
        </div>
      </form>

      {/* Approve Confirmation Modal (View mode for reviewers) */}
      {approveConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl ring-1 ring-slate-900/10">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                  <Icon name="checkCircle2" className="h-4 w-4" />
                </span>
                <h3 className="text-sm font-bold text-slate-900">Approve TRF Request #{requestId}</h3>
              </div>
              <button
                type="button"
                onClick={() => setApproveConfirmOpen(false)}
                disabled={reviewActionLoading}
                className="text-slate-400 hover:text-slate-600 rounded-lg p-1"
              >
                <Icon name="x" className="h-4 w-4" />
              </button>
            </div>

            <p className="mt-4 text-xs text-slate-600 leading-relaxed">
              Approve this E-TRF request to mark it <strong className="text-emerald-700">APPROVED</strong> and enable AR number generation?
            </p>

            <div className="mt-6 flex justify-end gap-2 border-t border-slate-100 pt-3">
              <button
                type="button"
                onClick={() => setApproveConfirmOpen(false)}
                disabled={reviewActionLoading}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApproveInView}
                disabled={reviewActionLoading}
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50"
              >
                {reviewActionLoading ? 'Approving…' : 'Confirm Approval'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Revise TRF Modal (View mode for reviewers) */}
      <ActionReasonModal
        isOpen={reviseModalOpen}
        onClose={() => setReviseModalOpen(false)}
        onSubmit={handleReviseInView}
        title="Request TRF Revision"
        subtitle={`Request #${requestId} — ${prefill?.productName || prefill?.productId}`}
        description="Provide clear remarks explaining what needs to be corrected. Status will return to NEEDS REVISION."
        placeholder="e.g., Missing license details, incorrect sample quantity, or document discrepancy…"
        confirmText="Submit Revision"
        confirmColor="amber"
        icon="refreshCw"
        loading={reviewActionLoading}
        required={true}
        maxLength={1000}
      />
    </div>
  )
}

function FormField({ id, label, hint, required = false, error = '', children }) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="block text-xs font-semibold text-slate-700">
        {label}{' '}
        {required && (
          <span className="text-rose-500" aria-hidden="true">
            *
          </span>
        )}
      </label>
      {hint && (
        <span id={`${id}-hint`} className="text-[10.5px] text-slate-400 leading-tight">
          {hint}
        </span>
      )}
      {children}
      {error && (
        <div id={`${id}-error`} className="flex items-start gap-1 text-[11px] font-medium text-rose-600 mt-0.5">
          <Icon name="alertCircle" className="h-3.5 w-3.5 shrink-0 mt-0.5" aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}
    </div>
  )
}
