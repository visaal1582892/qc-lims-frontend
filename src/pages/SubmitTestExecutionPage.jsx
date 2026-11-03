import { useEffect, useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { assignedTestsApi } from '../api/assignedTests'
import { qcRequestsApi } from '../api/qcRequests'
import Icon from '../components/Icon'
import TestHistoryModal from '../components/TestHistoryModal'
import ActionReasonModal from '../components/ActionReasonModal'
import { useToast } from '../components/Toast'

export default function SubmitTestExecutionPage() {
  const { detailId } = useParams()
  const navigate = useNavigate()
  const toast = useToast()

  const [loading, setLoading] = useState(true)
  const [testDetails, setTestDetails] = useState(null)
  const [metricValues, setMetricValues] = useState({}) // { [metricSpecId]: valueString }
  
  // History modal state
  const [historyOpen, setHistoryOpen] = useState(false)
  const [historyLoading, setHistoryLoading] = useState(false)
  const [testHistory, setTestHistory] = useState(null)

  // Submission notes modal state
  const [submitModalOpen, setSubmitModalOpen] = useState(false)
  const [isManualIncident, setIsManualIncident] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Fetch initial submission form details
  useEffect(() => {
    async function loadDetails() {
      try {
        setLoading(true)
        const res = await assignedTestsApi.getSubmissionDetails(detailId)
        setTestDetails(res.data)
        
        // Initialize empty values map
        const initialVals = {}
        if (res.data?.specifications) {
          res.data.specifications.forEach((spec) => {
            initialVals[spec.metricSpecificationId] = ''
          })
        }
        setMetricValues(initialVals)
      } catch (err) {
        toast.error(err.response?.data?.message || err.message || 'Failed to load test details')
      } finally {
        setLoading(false)
      }
    }
    if (detailId) {
      loadDetails()
    }
  }, [detailId, toast])

  // Open Test History Modal
  const handleOpenHistory = async () => {
    setHistoryOpen(true)
    try {
      setHistoryLoading(true)
      const res = await assignedTestsApi.getTestHistory(detailId)
      setTestHistory(res.data)
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to load test history')
    } finally {
      setHistoryLoading(false)
    }
  }

  // Handle metric input changes
  const handleValueChange = (specId, val) => {
    setMetricValues((prev) => ({
      ...prev,
      [specId]: val,
    }))
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
  const handleConfirmSubmit = async (submissionNotes) => {
    try {
      setSubmitting(true)
      const payloadValues = Object.entries(metricValues).map(([specId, val]) => ({
        metricSpecificationId: parseInt(specId, 10),
        value: val.trim(),
      }))

      const payload = {
        manualIncident: isManualIncident,
        submissionNotes,
        values: payloadValues,
      }

      await assignedTestsApi.submitTestResults(detailId, payload)
      toast.success(
        isManualIncident || hasAnyOob
          ? 'Test submitted and Incident raised successfully'
          : 'Test submitted successfully'
      )
      setSubmitModalOpen(false)
      navigate('/assigned-tests')
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to submit test results')
    } finally {
      setSubmitting(false)
    }
  }

  // TRF Proxy Download
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

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center gap-2 text-slate-500">
        <Icon name="refreshCw" className="h-5 w-5 animate-spin" />
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
          className="rounded-lg bg-brand-600 px-4 py-2 text-xs font-semibold text-white shadow-xs"
        >
          Return to Assigned Tests
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-1 min-h-0 flex-col overflow-y-auto space-y-5 pb-8">
      {/* Top Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200/80 bg-white p-4 sm:px-6 rounded-xl shadow-xs">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/assigned-tests')}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 transition"
          >
            <Icon name="chevronLeft" className="h-4 w-4" />
          </button>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-base font-bold text-slate-900 tracking-tight">
                Submit Test Execution
              </h1>
              <span className="inline-flex items-center rounded-md bg-brand-50 px-2 py-0.5 text-xs font-bold text-brand-700 ring-1 ring-brand-200">
                Attempt #{testDetails.attemptNumber}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              {testDetails.parameterName} • AR: <span className="font-mono font-semibold text-slate-700">{testDetails.arNumber || 'Pending'}</span>
            </p>
          </div>
        </div>

        {/* Top Action Button: Test History */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleOpenHistory}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition"
          >
            <Icon name="clock" className="h-4 w-4 text-brand-600" />
            Test History
          </button>
        </div>
      </div>

      {/* Test Overview Card */}
      <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
          Testing Request Overview
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 text-xs">
          <div>
            <span className="text-[11px] text-slate-400 block">AR Number</span>
            <span className="font-mono font-bold text-slate-800">{testDetails.arNumber || '-'}</span>
          </div>
          <div>
            <span className="text-[11px] text-slate-400 block">Product ID / Name</span>
            <span className="font-semibold text-slate-800">{testDetails.productId}</span>
            {testDetails.productName && (
              <span className="block text-[11px] text-slate-500 truncate">{testDetails.productName}</span>
            )}
          </div>
          <div>
            <span className="text-[11px] text-slate-400 block">Batch ID</span>
            <span className="font-medium text-slate-700">{testDetails.batch || testDetails.batchId}</span>
          </div>
          <div>
            <span className="text-[11px] text-slate-400 block">Test Parameter</span>
            <span className="font-bold text-brand-700">{testDetails.parameterName}</span>
          </div>
          <div>
            <span className="text-[11px] text-slate-400 block">Assigned Analyst</span>
            <span className="font-medium text-slate-700">{testDetails.userId}</span>
          </div>
          <div>
            <span className="text-[11px] text-slate-400 block">TRF Document</span>
            {testDetails.trfUrl ? (
              <div className="flex items-center gap-2 mt-0.5">
                <button
                  type="button"
                  onClick={() => window.open(testDetails.trfUrl, '_blank', 'noopener,noreferrer')}
                  className="inline-flex items-center gap-1 text-teal-600 hover:text-teal-700 font-semibold text-[11px]"
                >
                  <Icon name="eye" className="h-3 w-3" />
                  View
                </button>
                <button
                  type="button"
                  onClick={() => handleDownloadTrf(testDetails.trfUrl, `TRF_${testDetails.requestId}.pdf`)}
                  className="inline-flex items-center gap-1 text-slate-600 hover:text-slate-800 font-semibold text-[11px]"
                >
                  <Icon name="download" className="h-3 w-3" />
                  Download
                </button>
              </div>
            ) : (
              <span className="text-slate-400">-</span>
            )}
          </div>
        </div>
      </div>

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

      {/* Dynamic Metric Input Form */}
      <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs">
        <div className="border-b border-slate-100 pb-3 mb-5">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Metric Result Specifications
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Fill in the observed test results for each configured metric specification.
          </p>
        </div>

        {!testDetails.specifications || testDetails.specifications.length === 0 ? (
          <div className="rounded-lg bg-slate-50 p-6 text-center text-xs text-slate-500">
            No metric specifications configured for this test parameter.
          </div>
        ) : (
          <div className="space-y-4 max-w-3xl">
            {testDetails.specifications.map((spec) => {
              const valState = specValidation[spec.metricSpecificationId] || {}
              const isOob = valState.isOob
              const currentVal = metricValues[spec.metricSpecificationId] || ''

              return (
                <div
                  key={spec.metricSpecificationId}
                  className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border transition-all ${
                    isOob
                      ? 'border-rose-300 bg-rose-50/50 ring-1 ring-rose-200'
                      : 'border-slate-200 bg-slate-50/40 hover:bg-slate-50'
                  }`}
                >
                  {/* Metric Label & Bounds Subtext */}
                  <div className="sm:w-1/2 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-800 truncate">
                        {spec.metricName}
                      </span>
                      {isOob && (
                        <span className="inline-flex items-center rounded bg-rose-100 px-1.5 py-0.5 text-[10px] font-bold text-rose-700">
                          Out of Spec
                        </span>
                      )}
                    </div>
                    {/* Range Subtext */}
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Acceptable Range:{' '}
                      <span className="font-mono font-semibold text-slate-700">
                        {spec.lowerBound != null ? spec.lowerBound : '—'}
                      </span>
                      {' to '}
                      <span className="font-mono font-semibold text-slate-700">
                        {spec.upperBound != null ? spec.upperBound : '—'}
                      </span>
                      {spec.unit && <span className="ml-1 text-slate-400">({spec.unit})</span>}
                    </div>
                  </div>

                  {/* Input & Unit */}
                  <div className="sm:w-1/2 flex items-center gap-2">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        value={currentVal}
                        onChange={(e) => handleValueChange(spec.metricSpecificationId, e.target.value)}
                        placeholder="Enter measured value..."
                        className={`w-full rounded-lg border px-3 py-2 text-xs font-mono text-slate-900 shadow-xs transition focus:outline-hidden ${
                          isOob
                            ? 'border-rose-400 bg-white ring-1 ring-rose-400 focus:border-rose-500 focus:ring-rose-500'
                            : 'border-slate-300 bg-white focus:border-brand-500 focus:ring-1 focus:ring-brand-500'
                        }`}
                      />
                    </div>
                    {spec.unit && (
                      <span className="inline-flex items-center justify-center rounded-lg bg-slate-100 px-2.5 py-2 text-xs font-medium text-slate-600 border border-slate-200 min-w-[50px] text-center">
                        {spec.unit}
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Dual Submit Action Buttons */}
        <div className="mt-8 flex flex-wrap items-center justify-end gap-3 border-t border-slate-100 pt-5">
          <button
            type="button"
            onClick={() => navigate('/assigned-tests')}
            className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition"
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
            className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-brand-700 transition disabled:opacity-40 disabled:cursor-not-allowed"
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
            className="inline-flex items-center gap-2 rounded-xl bg-amber-600 px-5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-amber-700 transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Icon name="alertTriangle" className="h-4 w-4" />
            Submit & Raise Incident
          </button>
        </div>
      </div>

      {/* Test History Modal */}
      <TestHistoryModal
        isOpen={historyOpen}
        onClose={() => setHistoryOpen(false)}
        history={testHistory}
        loading={historyLoading}
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
      />
    </div>
  )
}
