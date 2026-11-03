import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { assignedTestsApi } from '../api/assignedTests'
import { useToast } from '../components/Toast'
import Icon from '../components/Icon'
import TestHistoryModal from '../components/TestHistoryModal'

export default function ViewTestExecutionPage() {
  const { detailId } = useParams()
  const navigate = useNavigate()
  const toast = useToast()

  const [detail, setDetail] = useState(null)
  const [loading, setLoading] = useState(true)
  const [files, setFiles] = useState([])
  const [historyModalOpen, setHistoryModalOpen] = useState(false)

  useEffect(() => {
    loadDetail()
    loadFiles()
  }, [detailId])

  const loadDetail = async () => {
    try {
      const res = await assignedTestsApi.getViewTestDetail(detailId)
      setDetail(res.data)
    } catch {
      toast.error('Failed to load test details')
    } finally {
      setLoading(false)
    }
  }

  const loadFiles = async () => {
    try {
      const res = await assignedTestsApi.getFilesForDetail(detailId)
      setFiles(res.data || [])
    } catch {
      // Files may not exist yet
    }
  }

  const handleBack = () => {
    navigate('/assigned-tests')
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
      TRANSFERRED: 'bg-violet-50 text-violet-700 ring-violet-600/20',
    }
    const color = map[status] || 'bg-slate-50 text-slate-700 ring-slate-600/20'
    return (
      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${color}`}>
        {status}
      </span>
    )
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex items-center gap-3 text-slate-500">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600" />
          <span className="text-sm font-medium">Loading test details...</span>
        </div>
      </div>
    )
  }

  if (!detail) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 text-slate-500">
        <Icon name="alertCircle" className="h-10 w-10 text-slate-300" />
        <p className="text-sm font-medium">Test details not found</p>
        <button
          type="button"
          onClick={handleBack}
          className="text-sm font-medium text-brand-600 hover:text-brand-700"
        >
          Back to Assigned Tests
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col min-h-0 overflow-auto">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-white">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={handleBack}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition"
            title="Back to Assigned Tests"
          >
            <Icon name="arrowLeft" className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-slate-900">View Test — {detail.parameterName}</h1>
            <p className="text-sm text-slate-500">
              {detail.arNumber} • {detail.productId} • Batch: {detail.batchId || 'N/A'} • Attempt #{detail.attemptNumber}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {getStatusBadge(detail.status)}
          <button
            type="button"
            onClick={() => setHistoryModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 rounded-lg ring-1 ring-blue-200 hover:bg-blue-100 transition"
          >
            <Icon name="clock" className="h-3.5 w-3.5" />
            History
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-6 space-y-6">
        {/* Information Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <InfoCard label="AR Number" value={detail.arNumber} />
          <InfoCard label="Product" value={detail.productId} />
          <InfoCard label="Batch" value={detail.batchId || 'N/A'} />
          <InfoCard label="Analyst" value={detail.userId} />
        </div>

        {/* Specifications */}
        {detail.specifications && detail.specifications.length > 0 && (
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/70">
              <h2 className="text-sm font-bold text-slate-800">Specifications</h2>
            </div>
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="px-4 py-2 font-semibold text-slate-600">Metric</th>
                  <th className="px-4 py-2 font-semibold text-slate-600">Unit</th>
                  <th className="px-4 py-2 font-semibold text-slate-600">Lower Bound</th>
                  <th className="px-4 py-2 font-semibold text-slate-600">Upper Bound</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {detail.specifications.map((spec) => (
                  <tr key={spec.metricSpecificationId} className="text-slate-700">
                    <td className="px-4 py-2 font-medium">{spec.metricName}</td>
                    <td className="px-4 py-2 text-slate-500">{spec.unit || '-'}</td>
                    <td className="px-4 py-2 font-mono">{spec.lowerBound ?? '-'}</td>
                    <td className="px-4 py-2 font-mono">{spec.upperBound ?? '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Uploaded Files */}
        {files.length > 0 && (
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/70">
              <h2 className="text-sm font-bold text-slate-800">Uploaded Files ({files.length})</h2>
            </div>
            <div className="divide-y divide-slate-100">
              {files.map((file) => (
                <div key={file.fileId} className="px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Icon name="fileText" className="h-4 w-4 text-slate-400" />
                    <div>
                      <p className="text-sm font-medium text-slate-700">{file.originalName}</p>
                      {file.remarks && <p className="text-xs text-slate-500">{file.remarks}</p>}
                    </div>
                  </div>
                  <a
                    href={file.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition"
                    title="Open file"
                  >
                    <Icon name="externalLink" className="h-4 w-4" />
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* History Modal */}
      <TestHistoryModal
        isOpen={historyModalOpen}
        onClose={() => setHistoryModalOpen(false)}
        detailId={detailId}
      />
    </div>
  )
}

function InfoCard({ label, value }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">{label}</p>
      <p className="text-sm font-semibold text-slate-800">{value || '-'}</p>
    </div>
  )
}
