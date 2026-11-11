import { useState, useRef, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  uploadEvidenceFileThunk,
  updateFileRemarks,
  removeUploadedFile,
  togglePreviousFileId,
  setLinkedFileRemark,
} from '../store/slices/testExecutionSlice'
import Icon from './Icon'
import { useToast } from './Toast'
import { downloadFileFromProxy, viewFile } from '../utils/fileDownload'

/**
 * Two-column file management component for Submit Test Execution:
 * - Left: Drag & Drop upload zone + scrollable table (File with View/Download round buttons, Remarks input, Delete)
 * - Right: Previous attempt files grouped by attempt DESC (File Name, File with View/Download, Dynamic Remarks, Attempt, Select)
 */
export default function ExecutionFileUploadSection() {
  const dispatch = useDispatch()
  const toast = useToast()
  const fileInputRef = useRef(null)
  const [dragOver, setDragOver] = useState(false)

  const {
    uploadedFiles,
    previousAttemptFiles,
    selectedPreviousFileIds,
    linkedFileRemarks,
    uploadingFile,
    loadingPreviousFiles,
  } = useSelector((state) => state.testExecution.submission)

  // 25MB file limit
  const MAX_SIZE = 25 * 1024 * 1024
  const ACCEPTED_EXTS = ['.jpg', '.jpeg', '.png', '.pdf']

  const handleFileInput = async (files) => {
    const validFiles = Array.from(files).filter((f) => {
      const lower = f.name.toLowerCase()
      if (!ACCEPTED_EXTS.some((ext) => lower.endsWith(ext))) {
        toast.error(`Unsupported file type: ${f.name} (allowed: PDF, JPEG, PNG)`)
        return false
      }
      if (f.size > MAX_SIZE) {
        toast.error(`File too large: ${f.name} (max 25MB)`)
        return false
      }
      return true
    })

    if (validFiles.length === 0) return

    for (const file of validFiles) {
      try {
        await dispatch(uploadEvidenceFileThunk(file)).unwrap()
      } catch (err) {
        toast.error(err || `Failed to upload ${file.name}`)
      }
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    if (e.dataTransfer?.files?.length > 0) {
      handleFileInput(e.dataTransfer.files)
    }
  }

  const handleDownload = (url, name) => {
    downloadFileFromProxy(url, name, toast)
  }

  // Group previous attempt files by attemptNumber descending
  const groupedPreviousFiles = useMemo(() => {
    if (!previousAttemptFiles || previousAttemptFiles.length === 0) return []

    const groups = {}
    previousAttemptFiles.forEach((f) => {
      const attempt = f.attemptNumber != null ? f.attemptNumber : 1
      if (!groups[attempt]) {
        groups[attempt] = []
      }
      groups[attempt].push(f)
    })

    // Sort attempt numbers descending
    const sortedAttempts = Object.keys(groups)
      .map(Number)
      .sort((a, b) => b - a)

    return sortedAttempts.map((attempt) => ({
      attempt,
      files: groups[attempt],
    }))
  }, [previousAttemptFiles])

  return (
    <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs">
      <div className="border-b border-slate-100 pb-3 mb-5">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
          Attachments & Evidence Files
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Upload new test documents, spectra, or observations for this attempt, or link evidence from prior attempts.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ================================================================ */}
        {/* LEFT COLUMN: Upload New Files for Current Attempt                */}
        {/* ================================================================ */}
        <div className="flex flex-col space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Icon name="upload" className="h-3.5 w-3.5 text-brand-600" />
              Upload New Evidence (Current Attempt)
            </h3>
            <span className="text-[11px] text-slate-400">PDF, PNG, JPG (max 25MB)</span>
          </div>

          {/* Drag & Drop Zone */}
          <div
            onDragOver={(e) => {
              e.preventDefault()
              setDragOver(true)
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`flex flex-col items-center justify-center p-5 rounded-xl border-2 border-dashed transition cursor-pointer text-center ${
              dragOver
                ? 'border-brand-500 bg-brand-50/60'
                : 'border-slate-300 hover:border-slate-400 bg-slate-50/50 hover:bg-slate-50'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.png,.jpg,.jpeg"
              className="hidden"
              onChange={(e) => {
                if (e.target.files) handleFileInput(e.target.files)
                e.target.value = ''
              }}
            />
            {uploadingFile ? (
              <div className="flex flex-col items-center gap-2 py-2">
                <Icon name="refreshCw" className="h-6 w-6 text-brand-600 animate-spin" />
                <span className="text-xs font-medium text-slate-600">Uploading evidence file...</span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-1.5 py-1">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-50 text-brand-600">
                  <Icon name="upload" className="h-5 w-5" />
                </div>
                <p className="text-xs font-medium text-slate-700">
                  Drag and drop files here, or <span className="text-brand-600 font-bold underline">browse</span>
                </p>
                <p className="text-[10px] text-slate-400">Supported formats: PDF, PNG, JPG, JPEG</p>
              </div>
            )}
          </div>

          {/* Uploaded Files Table */}
          <div className="flex flex-col">
            <span className="text-[11px] font-semibold text-slate-600 mb-2">
              Uploaded Files ({uploadedFiles.length})
            </span>
            <div className="max-h-72 overflow-y-auto border border-slate-200 rounded-xl bg-white shadow-xs">
              {uploadedFiles.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400 italic">
                  No new files uploaded for this attempt yet.
                </div>
              ) : (
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500 sticky top-0 border-b border-slate-200 z-10">
                    <tr>
                      <th className="px-3 py-2">File</th>
                      <th className="px-3 py-2">Remarks</th>
                      <th className="px-3 py-2 text-center w-16">Delete</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {uploadedFiles.map((file, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/60 transition">
                        {/* File Name & View/Download Buttons */}
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-2">
                            <Icon name="fileText" className="h-4 w-4 text-slate-400 shrink-0" />
                            <span className="font-medium text-slate-800 truncate max-w-[150px]" title={file.originalName}>
                              {file.originalName}
                            </span>
                            <div className="flex items-center gap-1 shrink-0 ml-auto">
                              <button
                                type="button"
                                onClick={() => viewFile(file.url)}
                                title="View file"
                                className="flex h-6 w-6 items-center justify-center rounded-full bg-teal-50 text-teal-700 ring-1 ring-teal-200/80 transition hover:bg-teal-600 hover:text-white cursor-pointer"
                              >
                                <Icon name="eye" className="h-3 w-3" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDownload(file.url, file.originalName)}
                                title="Download file"
                                className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-slate-600 ring-1 ring-slate-200 transition hover:bg-slate-700 hover:text-white cursor-pointer"
                              >
                                <Icon name="download" className="h-3 w-3" />
                              </button>
                            </div>
                          </div>
                        </td>

                        {/* Remarks Input */}
                        <td className="px-3 py-2">
                          <input
                            type="text"
                            value={file.remarks || ''}
                            onChange={(e) => dispatch(updateFileRemarks({ index: idx, remarks: e.target.value }))}
                            placeholder="Add remarks..."
                            className="w-full rounded-lg border border-slate-200 px-2 py-1 text-xs text-slate-800 focus:outline-hidden focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                          />
                        </td>

                        {/* Delete Action */}
                        <td className="px-3 py-2 text-center">
                          <button
                            type="button"
                            onClick={() => dispatch(removeUploadedFile(idx))}
                            title="Delete file"
                            className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition cursor-pointer"
                          >
                            <Icon name="trash2" className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>

        {/* ================================================================ */}
        {/* RIGHT COLUMN: Previous Attempt Files (Linkable with Dynamic Remarks) */}
        {/* ================================================================ */}
        <div className="flex flex-col space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Icon name="paperclip" className="h-3.5 w-3.5 text-brand-600" />
              Link Previous Attempt Evidence
            </h3>
            <span className="text-[11px] text-slate-400">
              {selectedPreviousFileIds.length} file(s) selected
            </span>
          </div>

          <div className="max-h-[380px] overflow-y-auto border border-slate-200 rounded-xl bg-white shadow-xs">
            {loadingPreviousFiles ? (
              <div className="p-8 flex items-center justify-center gap-2 text-xs text-slate-500">
                <Icon name="refreshCw" className="h-4 w-4 animate-spin text-brand-600" />
                Loading prior attempt files...
              </div>
            ) : groupedPreviousFiles.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 italic">
                No files uploaded for previous attempts.
              </div>
            ) : (
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500 sticky top-0 border-b border-slate-200 z-10">
                  <tr>
                    <th className="px-3 py-2">File Name</th>
                    <th className="px-3 py-2 text-center w-20">File</th>
                    <th className="px-3 py-2">Remarks</th>
                    <th className="px-3 py-2 text-center w-20">Attempt</th>
                    <th className="px-3 py-2 text-center w-14">Select</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {groupedPreviousFiles.map((group) => (
                    group.files.map((file, fileIdx) => {
                      const isSelected = selectedPreviousFileIds.includes(file.fileId)
                      const currentRemark = linkedFileRemarks[file.fileId] ?? file.remarks ?? ''

                      return (
                        <tr
                          key={file.fileId}
                          className={`transition ${
                            isSelected ? 'bg-brand-50/40' : 'hover:bg-slate-50/60'
                          }`}
                        >
                          {/* File Name */}
                          <td className="px-3 py-2">
                            <span className="font-medium text-slate-800 truncate block max-w-[140px]" title={file.originalName}>
                              {file.originalName}
                            </span>
                          </td>

                          {/* Round View & Download Buttons */}
                          <td className="px-3 py-2 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => viewFile(file.url)}
                                title="View file"
                                className="flex h-6 w-6 items-center justify-center rounded-full bg-teal-50 text-teal-700 ring-1 ring-teal-200/80 transition hover:bg-teal-600 hover:text-white cursor-pointer"
                              >
                                <Icon name="eye" className="h-3 w-3" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDownload(file.url, file.originalName)}
                                title="Download file"
                                className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-slate-600 ring-1 ring-slate-200 transition hover:bg-slate-700 hover:text-white cursor-pointer"
                              >
                                <Icon name="download" className="h-3 w-3" />
                              </button>
                            </div>
                          </td>

                          {/* Dynamic Remarks (Guardrail 4: Read-only when unchecked, editable when checked) */}
                          <td className="px-3 py-2">
                            {isSelected ? (
                              <input
                                type="text"
                                value={currentRemark}
                                onChange={(e) =>
                                  dispatch(
                                    setLinkedFileRemark({
                                      fileId: file.fileId,
                                      remarks: e.target.value,
                                    })
                                  )
                                }
                                placeholder="Enter remark for this attempt..."
                                className="w-full rounded-lg border border-brand-300 bg-white px-2 py-1 text-xs text-slate-800 shadow-xs focus:outline-hidden focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                              />
                            ) : (
                              <span
                                className="text-slate-500 text-xs truncate block max-w-[120px]"
                                title={file.remarks || ''}
                              >
                                {file.remarks || <span className="text-slate-300 italic">-</span>}
                              </span>
                            )}
                          </td>

                          {/* Attempt Badge */}
                          <td className="px-3 py-2 text-center">
                            <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700 ring-1 ring-slate-200">
                              #{file.attemptNumber || group.attempt}
                            </span>
                          </td>

                          {/* Select Checkbox */}
                          <td className="px-3 py-2 text-center">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => dispatch(togglePreviousFileId(file.fileId))}
                              className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500 cursor-pointer"
                            />
                          </td>
                        </tr>
                      )
                    })
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

