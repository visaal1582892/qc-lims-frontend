import Icon from './Icon'
import { downloadFileFromProxy, viewFile } from '../utils/fileDownload'
import { useToast } from './Toast'

/**
 * Scrollable component for View Test Execution page displaying all attached evidence files.
 * Columns:
 * 1. File Name (from original_name)
 * 2. File (Round View & Download buttons)
 * 3. Remarks
 *
 * @param {object} props
 * @param {Array} props.files - List of attached files
 */
export default function ViewExecutionFilesSection({ files = [] }) {
  const toast = useToast()

  const handleDownload = (url, name) => {
    downloadFileFromProxy(url, name, toast)
  }

  return (
    <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
        <div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Attached Evidence Files
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Documents and chromatograms uploaded for this execution attempt.
          </p>
        </div>
        <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-700">
          {files.length} file{files.length === 1 ? '' : 's'}
        </span>
      </div>

      <div className="max-h-72 overflow-y-auto border border-slate-200 rounded-xl bg-white shadow-xs">
        {!files || files.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400 italic">
            No evidence files attached to this test execution.
          </div>
        ) : (
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500 sticky top-0 border-b border-slate-200 z-10">
              <tr>
                <th className="px-4 py-2.5">File Name</th>
                <th className="px-4 py-2.5 text-center w-24">File</th>
                <th className="px-4 py-2.5">Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {files.map((file, idx) => (
                <tr key={file.fileId || idx} className="hover:bg-slate-50/60 transition">
                  {/* File Name */}
                  <td className="px-4 py-2.5 font-medium text-slate-800">
                    <div className="flex items-center gap-2">
                      <Icon name="fileText" className="h-4 w-4 text-slate-400 shrink-0" />
                      <span className="truncate max-w-sm" title={file.originalName}>
                        {file.originalName || 'Untitled Document'}
                      </span>
                    </div>
                  </td>

                  {/* Circular Action Buttons: View & Download */}
                  <td className="px-4 py-2.5 text-center">
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

                  {/* Remarks */}
                  <td className="px-4 py-2.5 text-slate-600">
                    {file.remarks ? (
                      <span className="text-slate-700">{file.remarks}</span>
                    ) : (
                      <span className="text-slate-400 italic">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

