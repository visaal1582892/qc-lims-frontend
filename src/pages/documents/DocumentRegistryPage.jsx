/**
 * DocumentRegistryPage — Document Management (SRS Module 11).
 *
 * View and search uploaded documents (ROA / COA) by AR number.
 * Provides upload buttons for ROA and COA linked to AR records.
 */
import { useState, useCallback, useEffect } from 'react'
import { FileText, RefreshCw, Search, Upload, Download, X } from 'lucide-react'
import { PageHeader } from '../../components/layout/PageHeader'
import { DataTable } from '../../components/table/DataTable'
import { listDocuments, uploadRoa, uploadCoa, downloadDocument } from '../../api/subcontractingApi'
import { useAuthRights } from '../../auth/useAuthRights'
import { Rights } from '../../constants/rights'

const typeColor = (type) => {
  switch (type) {
    case 'ROA': return 'info'
    case 'COA': return 'success'
    default: return 'default'
  }
}

const colorMap = {
  info: 'bg-blue-100 text-blue-800',
  success: 'bg-green-100 text-green-800',
  default: 'bg-gray-100 text-gray-800',
}

function TypeBadge({ type }) {
  const variant = typeColor(type)
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${colorMap[variant] || colorMap.default}`}>
      {type || '-'}
    </span>
  )
}

export function DocumentRegistryPage() {
  const [documents, setDocuments] = useState([])
  const [filteredDocuments, setFilteredDocuments] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [toast, setToast] = useState(null)
  const [uploadType, setUploadType] = useState(null) // 'ROA' or 'COA'
  const { hasRight } = useAuthRights()

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await listDocuments().catch(() => ({ data: [] }))
      const data = (res.data || []).map((item) => item.data ?? item) ?? []
      setDocuments(data)
      setFilteredDocuments(data)
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
    let result = documents
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      result = result.filter(
        (d) =>
          (d.arNumber || '').toLowerCase().includes(q) ||
          (d.fileName || '').toLowerCase().includes(q) ||
          (d.documentType || '').toLowerCase().includes(q)
      )
    }
    setFilteredDocuments(result)
  }, [documents, searchQuery])

  const showToast = (message) => {
    setToast({ message, visible: true })
    setTimeout(() => setToast(null), 3000)
  }

  const handleDownload = async (fileId, fileName) => {
    if (!hasRight(Rights.ROLE_DOCUMENT_VIEW)) return
    try {
      const blob = await downloadDocument(fileId)
      const url = window.URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }))
      const link = document.createElement('a')
      link.href = url
      link.download = fileName || 'document.pdf'
      link.click()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      showToast(`Download failed: ${err.message || 'Unknown error'}`)
    }
  }

  const columns = [
    { key: 'documentType', label: 'Type', render: (val) => <TypeBadge type={val} /> },
    { key: 'arNumber', label: 'AR Number' },
    { key: 'fileName', label: 'File Name' },
    {
      key: 'fileSizeBytes',
      label: 'Size',
      render: (val) => {
        if (!val) return '-'
        if (val < 1024) return `${val} B`
        if (val < 1024 * 1024) return `${(val / 1024).toFixed(1)} KB`
        return `${(val / (1024 * 1024)).toFixed(1)} MB`
      },
    },
    {
      key: 'uploadedAt',
      label: 'Uploaded',
      render: (val) => (val ? new Date(val).toLocaleString() : '-'),
    },
    {
      key: 'actions',
      label: 'Actions',
      filter: false,
      stickyRight: true,
      width: 80,
      render: (_val, row) => hasRight(Rights.ROLE_DOCUMENT_VIEW) ? (
        <button
          className="inline-flex items-center gap-1 rounded-md bg-blue-600 px-2 py-1 text-[10px] font-medium text-white hover:bg-blue-700"
          onClick={() => handleDownload(row.id, row.fileName)}
          title={`Download ${row.fileName}`}
        >
          <Download className="h-3 w-3" />
        </button>
      ) : null,
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Document Registry"
        description="Manage ROA and COA documents"
        icon={FileText}
        action={
          <div className="flex gap-2">
            {hasRight(Rights.ROLE_DOCUMENT_UPLOAD) && (
              <>
                <button
                  onClick={() => setUploadType('ROA')}
                  className="inline-flex items-center gap-1 rounded-lg bg-primary-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-primary-700 transition-colors"
                >
                  <Upload className="h-4 w-4" /> Upload ROA
                </button>
                <button
                  onClick={() => setUploadType('COA')}
                  className="inline-flex items-center gap-1 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 transition-colors"
                >
                  <Upload className="h-4 w-4" /> Upload COA
                </button>
              </>
            )}
            <button onClick={fetchData} className="inline-flex items-center rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs hover:bg-slate-50 transition-colors" title="Refresh">
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        }
      />

      {/* Search */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by AR number, file name, or type..."
            className="w-full rounded-md border border-slate-200 px-2 py-2 pl-9 text-xs outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-100"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <span className="text-xs text-slate-500">
          {filteredDocuments.length} document{filteredDocuments.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={filteredDocuments}
        loading={loading}
      />

      {/* Upload Modal (replaces prompt + dynamic input) */}
      {uploadType && (
        <DocumentUploadModal
          type={uploadType}
          onClose={() => setUploadType(null)}
          onSuccess={() => {
            setUploadType(null)
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

/**
 * DocumentUploadModal — Replaces native prompt() + dynamic <input type="file">.
 * Collects AR Number / Execution ID and file via proper form controls.
 */
function DocumentUploadModal({ type, onClose, onSuccess, onToast }) {
  const [arNumber, setArNumber] = useState('')
  const [executionId, setExecutionId] = useState('')
  const [file, setFile] = useState(null)
  const [fileDragOver, setFileDragOver] = useState(false)
  const [uploading, setUploading] = useState(false)

  const label = type === 'ROA' ? 'Record of Analysis (ROA)' : 'Certificate of Analysis (COA)'

  const handleSubmit = async () => {
    if (!file) {
      onToast('Please select a PDF file')
      return
    }
    if (type === 'ROA' && !executionId) {
      onToast('Execution ID is required for ROA upload')
      return
    }
    if (type === 'COA' && !arNumber) {
      onToast('AR Number is required for COA upload')
      return
    }
    setUploading(true)
    try {
      if (type === 'ROA') {
        await uploadRoa(parseInt(executionId, 10), file)
        onToast(`ROA "${file.name}" uploaded successfully`)
      } else {
        await uploadCoa(arNumber, file)
        onToast(`COA "${file.name}" uploaded successfully`)
      }
      onSuccess()
    } catch (err) {
      onToast(`Upload failed: ${err.message || 'Unknown error'}`)
    } finally {
      setUploading(false)
    }
  }

  const handleFileSelect = (e) => {
    const selected = e.target.files?.[0]
    if (selected && selected.type !== 'application/pdf' && !selected.name.toLowerCase().endsWith('.pdf')) {
      onToast('Only PDF files are allowed')
      return
    }
    if (selected && selected.size > 25 * 1024 * 1024) {
      onToast('File size exceeds 25 MB limit')
      return
    }
    setFile(selected)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setFileDragOver(false)
    const dropped = e.dataTransfer.files?.[0]
    if (dropped && dropped.type !== 'application/pdf' && !dropped.name.toLowerCase().endsWith('.pdf')) {
      onToast('Only PDF files are allowed')
      return
    }
    if (dropped && dropped.size > 25 * 1024 * 1024) {
      onToast('File size exceeds 25 MB limit')
      return
    }
    setFile(dropped)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-900">Upload {label}</h3>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* ROA requires executionId; COA requires arNumber */}
        {type === 'ROA' ? (
          <div className="mb-4">
            <label className="mb-1 block text-xs font-medium text-slate-600">Execution ID *</label>
            <input
              type="number"
              className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-primary-500"
              value={executionId}
              onChange={(e) => setExecutionId(e.target.value)}
              placeholder="e.g. 123"
              autoFocus
            />
          </div>
        ) : (
          <div className="mb-4">
            <label className="mb-1 block text-xs font-medium text-slate-600">AR Number *</label>
            <input
              type="text"
              className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-primary-500"
              value={arNumber}
              onChange={(e) => setArNumber(e.target.value)}
              placeholder="e.g. AR-2026-001"
              autoFocus
            />
          </div>
        )}

        {/* Drop zone */}
        <div
          className={`relative mb-4 rounded-lg border-2 border-dashed p-6 text-center transition-colors ${
            fileDragOver ? 'border-primary-400 bg-primary-50' : 'border-slate-200 hover:border-slate-300'
          }`}
          onDragOver={(e) => { e.preventDefault(); setFileDragOver(true) }}
          onDragLeave={() => setFileDragOver(false)}
          onDrop={handleDrop}
        >
          <input
            type="file"
            accept=".pdf,application/pdf"
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            onChange={handleFileSelect}
          />
          {file ? (
            <div className="text-sm">
              <p className="font-medium text-slate-900">{file.name}</p>
              <p className="text-xs text-slate-500">{(file.size / 1024).toFixed(1)} KB</p>
            </div>
          ) : (
            <div className="text-sm text-slate-500">
              <p>Drag and drop a PDF file here, or click to browse</p>
              <p className="text-xs mt-1">Max file size: 25 MB</p>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} disabled={uploading} className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50">
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={uploading} className="rounded-lg bg-primary-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-primary-700 disabled:opacity-50">
            {uploading ? 'Uploading...' : 'Upload'}
          </button>
        </div>
      </div>
    </div>
  )
}
