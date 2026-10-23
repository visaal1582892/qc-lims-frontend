import { useState, useRef, useEffect } from 'react'
import { X, Upload, Download, AlertCircle, CheckCircle2, FileSpreadsheet, Info } from 'lucide-react'

/**
 * Generic Excel bulk upload modal — download template, drag & drop, process, errors.
 * Mirrors marketing-automation frontend UserExcelUploadModal.
 */
export default function BulkUploadModal({
  open,
  onClose,
  onDownloadTemplate,
  onUpload,
  title = 'Upload Excel',
  description = 'Download the template, fill in your data, and upload it.',
  fileName = 'errors.xlsx',
}) {
  const fileInputRef = useRef(null)
  const [selectedFile, setSelectedFile] = useState(null)
  const [isDragging, setIsDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState(null)

  useEffect(() => {
    if (!open) {
      setSelectedFile(null)
      setUploading(false)
      setResult(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }, [open])

  if (!open) return null

  const validateAndSetFile = (file) => {
    const name = file.name.toLowerCase()
    if (!name.endsWith('.xlsx') && !name.endsWith('.xls')) {
      setResult({ error: 'Invalid file type. Please select an Excel workbook (.xlsx or .xls).' })
      return
    }
    setSelectedFile(file)
    setResult(null)
  }

  const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true) }
  const handleDragLeave = (e) => { e.preventDefault(); setIsDragging(false) }
  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) validateAndSetFile(file)
  }

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (file) validateAndSetFile(file)
  }

  const handleUpload = async () => {
    if (!selectedFile || uploading) return
    setUploading(true)
    setResult(null)
    try {
      const data = await onUpload(selectedFile)
      if (data.success) {
        setResult({ success: true, message: data.message })
      } else {
        setResult({
          success: false,
          message: data.message,
          errorCount: Object.keys(data.errors || {}).length,
        })
        // If the response is the error file blob, handle it
        if (data.errorFileBase64) {
          downloadBase64(data.errorFileBase64, fileName)
        }
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.errorMessage || 'Upload failed'
      setResult({ error: msg })
      // If the error response is a blob (error file), download it
      if (err.response?.data instanceof Blob) {
        const url = URL.createObjectURL(err.response.data)
        const a = document.createElement('a')
        a.href = url; a.download = fileName
        document.body.appendChild(a); a.click(); document.body.removeChild(a)
        URL.revokeObjectURL(url)
        setResult({ success: false, message: 'Validation errors found. Error file downloaded.', errorCount: 1 })
      }
    } finally {
      setUploading(false)
    }
  }

  const handleClose = () => {
    if (uploading) return
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={handleClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-brand-50 flex items-center justify-center">
              <FileSpreadsheet className="h-5 w-5 text-brand-600" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900">{title}</h3>
              <p className="text-xs text-slate-400">{description}</p>
            </div>
          </div>
          <button onClick={handleClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          {/* Drop zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors
              ${isDragging ? 'border-brand-400 bg-brand-50' : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'}
            `}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
              className="hidden"
            />
            {selectedFile ? (
              <div className="flex flex-col items-center gap-2">
                <FileSpreadsheet className="h-8 w-8 text-emerald-500" />
                <p className="text-sm font-medium text-slate-700 truncate max-w-[250px]">{selectedFile.name}</p>
                <p className="text-xs text-slate-400">{formatSize(selectedFile.size)}</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <Upload className="h-8 w-8 text-slate-300" />
                <p className="text-sm text-slate-500">
                  <span className="font-medium text-brand-600">Click to upload</span> or drag and drop
                </p>
                <p className="text-xs text-slate-400">.xlsx or .xls</p>
              </div>
            )}
          </div>

          {/* Result messages */}
          {result?.success && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-emerald-50 border border-emerald-200">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-emerald-800">Upload Successful</p>
                <p className="text-xs text-emerald-600">{result.message}</p>
              </div>
            </div>
          )}

          {result?.error && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-200">
              <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{result.error}</p>
            </div>
          )}

          {result?.success === false && !result?.error && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200">
              <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-800">Validation Errors</p>
                <p className="text-xs text-amber-600">{result.message}</p>
                {result.errorCount && <p className="text-xs text-amber-500">{result.errorCount} row(s) with errors</p>}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleUpload}
              disabled={!selectedFile || uploading}
              className="flex items-center gap-2 px-4 py-2.5 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {uploading ? (
                <>
                  <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  Upload
                </>
              )}
            </button>
            <button
              onClick={() => onDownloadTemplate()}
              className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors"
            >
              <Download className="h-4 w-4" />
              Download Template
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function formatSize(bytes) {
  if (!bytes || bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`
}

function downloadBase64(base64, filename = 'errors.xlsx') {
  try {
    const byteCharacters = atob(base64)
    const byteNumbers = new Array(byteCharacters.length)
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i)
    }
    const byteArray = new Uint8Array(byteNumbers)
    const blob = new Blob([byteArray], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  } catch (err) {
    console.error('Failed to download error file:', err)
  }
}
