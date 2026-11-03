import { useState, useRef } from 'react'
import { assignedTestsApi } from '../api/assignedTests'
import Icon from './Icon'
import { useToast } from './Toast'

/**
 * TestFileUpload — handles file uploads for test execution with:
 * - Drag & drop + click-to-browse
 * - Immediate upload to image server (url returned, held in frontend state)
 * - Remarks for each file
 * - Deep copy from previous attempts (selected file IDs)
 * - 25MB limit, PDF/JPEG/PNG only
 */
export default function TestFileUpload({
  detailId,
  onFilesChange,
  previousAttemptFiles,
  selectedPreviousFileIds,
  onPreviousSelectionChange,
  loading,
}) {
  const toast = useToast()
  const inputRef = useRef(null)

  const [files, setFiles] = useState([])
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)

  // 25MB limit
  const MAX_SIZE = 25 * 1024 * 1024
  const ACCEPTED = ['image/jpeg', 'image/png', 'application/pdf']
  const ACCEPTED_EXTS = ['.jpg', '.jpeg', '.png', '.pdf']

  // Notify parent whenever files change
  useState(() => {
    if (onFilesChange) onFilesChange([])
  })

  const updateFiles = (updater) => {
    const newFiles = typeof updater === 'function' ? updater(files) : updater
    setFiles(newFiles)
    if (onFilesChange) onFilesChange(newFiles)
  }

  const handleFileInput = async (fileList) => {
    const validFiles = Array.from(fileList).filter((f) => {
      if (!ACCEPTED.includes(f.type) && !ACCEPTED_EXTS.some((e) => f.name.toLowerCase().endsWith(e))) {
        toast.error(`Unsupported file type: ${f.name}`)
        return false
      }
      if (f.size > MAX_SIZE) {
        toast.error(`File too large: ${f.name} (max 25MB)`)
        return false
      }
      return true
    })

    if (validFiles.length === 0) return
    await uploadFiles(validFiles)
  }

  const uploadFiles = async (validFiles) => {
    setUploading(true)
    const newEntries = []

    for (const file of validFiles) {
      try {
        const result = await assignedTestsApi.uploadFile(file)
        const url = result.data?.url || result.url || ''
        newEntries.push({
          url,
          originalName: file.name,
          remarks: '',
        })
      } catch (err) {
        toast.error(`Failed to upload: ${file.name}`)
      }
    }

    if (newEntries.length > 0) {
      updateFiles((prev) => [...prev, ...newEntries])
    }
    setUploading(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    handleFileInput(e.dataTransfer.files)
  }

  const updateRemark = (index, value) => {
    updateFiles((prev) => {
      const updated = [...prev]
      updated[index] = { ...updated[index], remarks: value }
      return updated
    })
  }

  const removeFile = (index) => {
    updateFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const togglePreviousFile = (fileId) => {
    onPreviousSelectionChange((prev) =>
      prev.includes(fileId) ? prev.filter((id) => id !== fileId) : [...prev, fileId]
    )
  }

  const getFileIcon = (name) => {
    if (name.toLowerCase().endsWith('.pdf')) return 'fileText'
    return 'image'
  }

  if (loading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-2 text-slate-500">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600" />
          <span className="text-sm">Loading...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/70">
        <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
          <Icon name="paperclip" className="h-4 w-4" />
          Attachments & Evidence
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Upload files (PDF, JPEG, PNG up to 25MB) and optionally link files from previous attempts
        </p>
      </div>

      <div className="p-4 space-y-5">
        {/* Drag & Drop Zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center cursor-pointer transition-all ${
            dragOver
              ? 'border-brand-400 bg-brand-50'
              : 'border-slate-300 hover:border-slate-400 hover:bg-slate-50'
          }`}
        >
          <input
            ref={inputRef}
            type="file"
            multiple
            accept=".jpg,.jpeg,.png,.pdf"
            className="hidden"
            onChange={(e) => handleFileInput(e.target.files)}
          />
          {uploading ? (
            <>
              <div className="h-8 w-8 animate-spin rounded-full border-3 border-slate-300 border-t-brand-600" />
              <p className="mt-2 text-sm font-medium text-slate-600">Uploading files...</p>
            </>
          ) : (
            <>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
                <Icon name="upload" className="h-6 w-6" />
              </div>
              <p className="mt-2 text-sm font-medium text-slate-700">
                Drag & drop files here, or <span className="text-brand-600">browse</span>
              </p>
              <p className="text-xs text-slate-500 mt-1">PDF, JPEG, PNG (max 25MB each)</p>
            </>
          )}
        </div>

        {/* Uploaded Files List */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Uploaded Files
          </h3>
          {files.length === 0 && (
            <p className="text-xs text-slate-400 italic">No files uploaded yet</p>
          )}
          {files.map((file, idx) => (
            <div
              key={idx}
              className="flex items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3"
            >
              <Icon name={getFileIcon(file.originalName)} className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-700 truncate">{file.originalName}</p>
                <input
                  type="text"
                  value={file.remarks || ''}
                  onChange={(e) => updateRemark(idx, e.target.value)}
                  placeholder="Add remarks (optional)"
                  className="mt-1 w-full rounded-md border border-slate-200 px-2 py-1 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400"
                />
              </div>
              <button
                type="button"
                onClick={() => removeFile(idx)}
                className="h-7 w-7 flex items-center justify-center rounded text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition"
                title="Remove file"
              >
                <Icon name="x" className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>

        {/* Previous Attempt Files (Deep Copy) */}
        {previousAttemptFiles && previousAttemptFiles.length > 0 && (
          <div className="space-y-2 border-t border-slate-100 pt-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Link Files from Previous Attempts
            </h3>
            <p className="text-xs text-slate-500">
              Select files to include as copies from previous attempts
            </p>
            <div className="space-y-1.5">
              {previousAttemptFiles.map((file) => {
                const selected = selectedPreviousFileIds?.includes(file.fileId) ?? false
                return (
                  <label
                    key={file.fileId}
                    className={`flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition ${
                      selected
                        ? 'border-brand-300 bg-brand-50'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={() => togglePreviousFile(file.fileId)}
                      className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                    />
                    <Icon name={getFileIcon(file.originalName)} className="h-4 w-4 text-slate-400 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-700 truncate">{file.originalName}</p>
                      {file.remarks && <p className="text-xs text-slate-500">{file.remarks}</p>}
                    </div>
                    <a
                      href={file.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="h-7 w-7 flex items-center justify-center rounded text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
                      title="Preview"
                    >
                      <Icon name="externalLink" className="h-4 w-4" />
                    </a>
                  </label>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
