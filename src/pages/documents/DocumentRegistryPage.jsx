/**
 * DocumentRegistryPage — Document Management (SRS Module 11).
 *
 * View and search uploaded documents (ROA / COA) by AR number.
 * Provides upload buttons for ROA and COA linked to AR records.
 */
import { useState, useCallback, useEffect } from 'react'
import { FileText, RefreshCw, Search, Upload, Download } from 'lucide-react'
import { PageHeader } from '../../components/layout/PageHeader'
import { DataTable } from '../../components/table/DataTable'
import { listDocuments, uploadRoa, uploadCoa, downloadDocument } from '../../api/subcontractingApi'

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

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      // Fetch all documents (no AR filter at top level — backend may need to support listing all)
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

  const handleRoaUpload = async () => {
    const arNumber = prompt('Enter AR Number for ROA upload:')
    if (!arNumber) return
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.pdf'
    input.onchange = async (e) => {
      const file = e.target.files[0]
      if (!file) return
      try {
        await uploadRoa('', file) // API expects executionId as param, arNumber as param
        showToast(`ROA "${file.name}" uploaded for AR ${arNumber}`)
        fetchData()
      } catch (err) {
        showToast(`Upload failed: ${err.message || 'Unknown error'}`)
      }
    }
    input.click()
  }

  const handleCoaUpload = async () => {
    const arNumber = prompt('Enter AR Number for COA upload:')
    if (!arNumber) return
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.pdf'
    input.onchange = async (e) => {
      const file = e.target.files[0]
      if (!file) return
      try {
        await uploadCoa(arNumber, file)
        showToast(`COA "${file.name}" uploaded for AR ${arNumber}`)
        fetchData()
      } catch (err) {
        showToast(`Upload failed: ${err.message || 'Unknown error'}`)
      }
    }
    input.click()
  }

  const handleDownload = async (fileId, fileName) => {
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
      render: (_val, row) => (
        <button
          className="inline-flex items-center gap-1 rounded-md bg-blue-600 px-2 py-1 text-[10px] font-medium text-white hover:bg-blue-700"
          onClick={() => handleDownload(row.id, row.fileName)}
          title={`Download ${row.fileName}`}
        >
          <Download className="h-3 w-3" />
        </button>
      ),
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
            <button
              onClick={handleRoaUpload}
              className="inline-flex items-center gap-1 rounded-lg bg-primary-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-primary-700 transition-colors"
            >
              <Upload className="h-4 w-4" /> Upload ROA
            </button>
            <button
              onClick={handleCoaUpload}
              className="inline-flex items-center gap-1 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 transition-colors"
            >
              <Upload className="h-4 w-4" /> Upload COA
            </button>
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

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-4 right-4 z-50 rounded-lg bg-green-600 px-4 py-2 text-sm text-white shadow-lg animate-fade-in">
          {toast.message}
        </div>
      )}
    </div>
  )
}
