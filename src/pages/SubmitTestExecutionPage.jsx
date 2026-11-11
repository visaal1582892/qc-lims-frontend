import { useEffect, useState, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useParams, useNavigate } from 'react-router-dom'
import {
  fetchSubmissionDetailsThunk,
  fetchPreviousAttemptFilesThunk,
  setMetricValue,
  submitTestResultsThunk,
  clearSubmissionState,
} from '../store/slices/testExecutionSlice'
import Icon from '../components/Icon'
import TestExecutionHeader from '../components/TestExecutionHeader'
import TestingRequestOverview from '../components/TestingRequestOverview'
import MetricInputList from '../components/MetricInputList'
import ExecutionFileUploadSection from '../components/ExecutionFileUploadSection'
import TestHistoryModal from '../components/TestHistoryModal'
import ActionReasonModal from '../components/ActionReasonModal'
import { useToast } from '../components/Toast'
import { downloadFileFromProxy } from '../utils/fileDownload'

export default function SubmitTestExecutionPage() {
  const { detailId } = useParams()
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const toast = useToast()

  const {
    testDetails,
    metricValues,
    uploadedFiles,
    previousAttemptFiles,
    selectedPreviousFileIds,
    linkedFileRemarks,
    loading,
    submitting,
  } = useSelector((state) => state.testExecution.submission)

  // History modal state
  const [historyOpen, setHistoryOpen] = useState(false)

  // Submission notes modal state
  const [submitModalOpen, setSubmitModalOpen] = useState(false)
  const [isManualIncident, setIsManualIncident] = useState(false)

  // Fetch initial submission form details
  useEffect(() => {
    if (detailId) {
      dispatch(fetchSubmissionDetailsThunk(detailId))
    }
    return () => {
      dispatch(clearSubmissionState())
    }
  }, [detailId, dispatch])

  // Load previous attempt files when testDetails is available
  useEffect(() => {
    if (testDetails?.execId && detailId) {
      dispatch(fetchPreviousAttemptFilesThunk({ detailId, execId: testDetails.execId }))
    }
  }, [detailId, testDetails?.execId, dispatch])

  // Handle metric input changes
  const handleValueChange = (specId, val) => {
    dispatch(setMetricValue({ specId, value: val }))
  }

  // Compute boundary status for each metric in realtime
  const specValidation = useMemo(() => {
    if (!testDetails?.specifications) return {}
    const result = {}

    testDetails.specifications.forEach((spec) => {
      const rawVal = metricValues[spec.metricSpecificationId]
      if (!rawVal || rawVal.trim() === '') {
        result[spec.metricSpecificationId] = { isFilled: false, isOob: false }
        return
      }

      const num = parseFloat(rawVal.trim())
      if (isNaN(num)) {
        // Qualitative / text value
        result[spec.metricSpecificationId] = { isFilled: true, isOob: false, isText: true }
        return
      }

      let isOob = false
      if (spec.lowerBound != null && num < spec.lowerBound) {
        isOob = true
      }
      if (spec.upperBound != null && num > spec.upperBound) {
        isOob = true
      }

      result[spec.metricSpecificationId] = { isFilled: true, isOob, isText: false }
    })

    return result
  }, [testDetails, metricValues])

  const hasAnyOob = useMemo(() => {
    return Object.values(specValidation).some((v) => v.isOob)
  }, [specValidation])

  const allFilled = useMemo(() => {
    if (!testDetails?.specifications || testDetails.specifications.length === 0) return false
    return testDetails.specifications.every((spec) => {
      const val = metricValues[spec.metricSpecificationId]
      return val != null && val.trim() !== ''
    })
  }, [testDetails, metricValues])

  // Click Submit (standard)
  const handleInitiateStandardSubmit = () => {
    if (!allFilled || hasAnyOob) return
    setIsManualIncident(false)
    setSubmitModalOpen(true)
  }

  // Click Submit & Raise Incident (manual override / OOS)
  const handleInitiateIncidentSubmit = () => {
    if (!allFilled) return
    setIsManualIncident(true)
    setSubmitModalOpen(true)
  }

  // Final confirmation in modal
  const handleConfirmSubmit = async (modalData) => {
    try {
      const submissionNotes = typeof modalData === 'object' ? modalData.notes : modalData
      const testsUsed = typeof modalData === 'object' && modalData.testsUsed ? modalData.testsUsed : 1

      const payloadValues = Object.entries(metricValues).map(([specId, val]) => ({
        metricSpecificationId: parseInt(specId, 10),
        value: val.trim(),
      }))

      // Prepare linked previous files with context-specific attempt remarks
      const linkedPreviousFiles = selectedPreviousFileIds.map((fileId) => ({
        fileId,
        remarks:
          linkedFileRemarks[fileId] !== undefined
            ? linkedFileRemarks[fileId]
            : previousAttemptFiles?.find((f) => f.fileId === fileId)?.remarks || '',
      }))

      const payload = {
        manualIncident: isManualIncident,
        submissionNotes,
        testsUsed,
        values: payloadValues,
        files: uploadedFiles.map((f) => ({
          url: f.url,
          originalName: f.originalName,
          remarks: f.remarks || null,
        })),
        linkedPreviousFileIds: selectedPreviousFileIds,
        linkedPreviousFiles,
      }

      await dispatch(submitTestResultsThunk({ detailId, payload })).unwrap()
      toast.success(
        isManualIncident || hasAnyOob
          ? 'Test submitted and Incident raised successfully'
          : 'Test submitted successfully'
      )
      setSubmitModalOpen(false)
      navigate('/assigned-tests')
    } catch (err) {
      toast.error(err || 'Failed to submit test results')
    }
  }

  // TRF Proxy Download
  const handleDownloadTrf = (trfUrl, fileName) => {
    downloadFileFromProxy(trfUrl, fileName, toast)
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center gap-2 text-slate-500">
        <Icon name="refreshCw" className="h-5 w-5 animate-spin text-brand-600" />
        <span className="text-sm">Loading test execution details...</span>
      </div>
    )
  }

  if (!testDetails) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 text-slate-500">
        <Icon name="alertTriangle" className="h-8 w-8 text-amber-500" />
        <p className="text-sm font-semibold">Test details could not be found.</p>
        <button
          onClick={() => navigate('/assigned-tests')}
          className="rounded-lg bg-brand-600 px-4 py-2 text-xs font-semibold text-white shadow-xs cursor-pointer hover:bg-brand-700"
        >
          Return to Assigned Tests
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-1 min-h-0 flex-col overflow-y-auto space-y-5 pb-8">
      {/* Top Header Bar */}
      <TestExecutionHeader
        title="Submit Test Execution"
        attemptNumber={testDetails.attemptNumber}
        parameterName={testDetails.parameterName}
        arNumber={testDetails.arNumber}
        onBack={() => navigate('/assigned-tests')}
        onOpenHistory={() => setHistoryOpen(true)}
      />

      {/* Test Overview Card (with Status and Circular TRF Buttons) */}
      <TestingRequestOverview
        details={{
          ...testDetails,
          status: testDetails.status || 'TESTING',
        }}
        onDownloadTrf={handleDownloadTrf}
      />

      {/* Out-Of-Spec Warning Banner if applicable */}
      {hasAnyOob && (
        <div className="flex items-center gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4 text-xs text-amber-900 animate-in fade-in duration-200">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-200 text-amber-800 shrink-0">
            <Icon name="alertTriangle" className="h-5 w-5" />
          </span>
          <div>
            <p className="font-bold">Out-Of-Specification Value(s) Detected</p>
            <p className="text-[11px] text-amber-800 mt-0.5">
              One or more entered values violate the configured tolerance range. Submitting will automatically raise a quality incident for supervisory investigation.
            </p>
          </div>
        </div>
      )}

      {/* Metric Input Form */}
      <MetricInputList
        specifications={testDetails.specifications || []}
        metricValues={metricValues}
        specValidation={specValidation}
        onValueChange={handleValueChange}
      />

      {/* Dual-Column File Management (Upload New & Link Previous) */}
      <ExecutionFileUploadSection />

      {/* Dual Submit Action Buttons */}
      <div className="flex flex-wrap items-center justify-end gap-3 rounded-xl border border-slate-200/80 bg-white p-4 shadow-xs">
        <button
          type="button"
          onClick={() => navigate('/assigned-tests')}
          className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition cursor-pointer"
        >
          Cancel
        </button>

        {/* Button 1: Submit (Standard) */}
        <button
          type="button"
          disabled={!allFilled || hasAnyOob || submitting}
          onClick={handleInitiateStandardSubmit}
          title={
            !allFilled
              ? 'Please fill all test results before submitting'
              : hasAnyOob
              ? 'One or more values exceed specification limits. Please submit and raise an incident.'
              : 'Submit test results'
          }
          className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-brand-700 transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          <Icon name="check" className="h-4 w-4" />
          Submit
        </button>

        {/* Button 2: Submit & Raise Incident */}
        <button
          type="button"
          disabled={!allFilled || submitting}
          onClick={handleInitiateIncidentSubmit}
          title={
            !allFilled
              ? 'Please fill all test results before submitting'
              : 'Submit results and raise a quality incident'
          }
          className="inline-flex items-center gap-2 rounded-xl bg-amber-600 px-5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-amber-700 transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          <Icon name="alertTriangle" className="h-4 w-4" />
          Submit & Raise Incident
        </button>
      </div>

      {/* Test History Modal */}
      <TestHistoryModal
        isOpen={historyOpen}
        onClose={() => setHistoryOpen(false)}
        detailId={detailId}
      />

      {/* Submission Notes Modal */}
      <ActionReasonModal
        isOpen={submitModalOpen}
        onClose={() => setSubmitModalOpen(false)}
        onSubmit={handleConfirmSubmit}
        title={isManualIncident ? 'Submit & Raise Quality Incident' : 'Submit Test Results'}
        subtitle={`AR #${testDetails.arNumber || '-'} — ${testDetails.parameterName}`}
        description={
          isManualIncident
            ? 'You are raising an incident along with your submission. Please provide comprehensive notes explaining the reason, root cause, or discrepancy observed.'
            : 'Enter any submission notes or observations regarding the execution of this test.'
        }
        placeholder={isManualIncident ? 'Detailed incident justification...' : 'Optional submission notes...'}
        confirmText={isManualIncident ? 'Submit & Raise Incident' : 'Confirm Submission'}
        confirmColor={isManualIncident ? 'amber' : 'brand'}
        icon={isManualIncident ? 'alertTriangle' : 'checkSquare'}
        loading={submitting}
        required={isManualIncident}
        showUnitsUsed={true}
        initialUnitsUsed={1}
      />
    </div>
  )
}
