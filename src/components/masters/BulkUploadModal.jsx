import { useState, useRef, useEffect } from 'react'
import { X, Upload, FileSpreadsheet } from 'lucide-react'
import { useToast } from '../Toast'

/**
 * Generic Excel bulk upload modal — download template, drag & drop, process.
 * On success: toast success message, auto-close modal, refresh data.
 * On validation errors: toast warning, auto-download error file, auto-close modal.
 * No inline messages in the modal — all feedback via toast alerts.
 * Matches marketing-automation UserExcelUploadModal UX pattern.
 */
export default function BulkUploadModal({
  open,
  onClose,
  onUpload,
  title = 'Upload Excel',
  description = 'Download the template, fill in your data, and upload.',
  fileName = 'errors.xlsx',
  onSuccess,
}) {
  const toast = useToast()
  const fileInputRef = useRef(null)
  const [selectedFile, setSelectedFile] = useState(null)
  const [isDragging, setIsDragging] = useState(false)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    if (!open) {
      setSelectedFile(null)
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }, [open])

  if (!open) return null

  const validateAndSetFile = (file) => {
    const name = file.name.toLowerCase()
    if (!name.endsWith('.xlsx') && !name.endsWith('.xls')) {
      toast.error('Invalid file type. Please select an Excel workbook (.xlsx or .xls).')
      return
    }
    setSelectedFile(file)
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

  const handleClose = () => {
    if (uploading) return
    onClose()
  }

  const handleUpload = async () => {
    if (!selectedFile || uploading) return
    setUploading(true)
    try {
      const data = await onUpload(selectedFile)

      if (data?.success) {
        toast.success(data.message)
        onSuccess?.()
        onClose()
      } else {
        const errorCount = data?.errorRows ? Object.keys(data.errorRows).length : 0
        toast.warning(
          `${errorCount} row(s) failed validation — error file downloaded.`,
          5000
        )
        if (data?.errorFileBase64) {
          downloadBase64(data.errorFileBase64, fileName)
        }
        onSuccess?.()
        onClose()
      }
    } catch (err) {
      const serverData = err.response?.data || err.data || err
      const msg = serverData?.message || serverData?.errorMessage || 'Upload failed'
      toast.error(msg)
      onSuccess?.()
      onClose()
    } finally {
      setUploading(false)
    }
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

          {/* Upload button */}
          <div className="flex items-center justify-end">
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
