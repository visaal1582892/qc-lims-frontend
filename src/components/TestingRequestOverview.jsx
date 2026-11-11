import Icon from './Icon'
import { viewFile } from '../utils/fileDownload'

/**
 * Common testing request overview card showing:
 * - AR Number
 * - Product ID / Name
 * - Batch ID
 * - Test Parameter
 * - Assigned Analyst
 * - Status (Badge)
 * - TRF Document (Circular icon buttons: View & Download)
 *
 * @param {object} props
 * @param {object} props.details - The test/execution details object
 * @param {function} [props.onDownloadTrf] - Callback for proxy downloading TRF
 */
export default function TestingRequestOverview({ details, onDownloadTrf }) {
  if (!details) return null

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
      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${color}`}>
        {status || '-'}
      </span>
    )
  }

  const handleDownload = () => {
    if (onDownloadTrf && details.trfUrl) {
      const filename = `TRF_${details.arNumber || details.requestId || 'document'}`
      onDownloadTrf(details.trfUrl, filename)
    }
  }

  return (
    <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs">
      <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
        Testing Request Overview
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4 text-xs">
        {/* 1. AR Number */}
        <div>
          <span className="text-[11px] text-slate-400 block mb-0.5">AR Number</span>
          <span className="font-mono font-bold text-slate-800">{details.arNumber || '-'}</span>
        </div>

        {/* 2. Product ID / Name */}
        <div>
          <span className="text-[11px] text-slate-400 block mb-0.5">Product ID / Name</span>
          <span className="font-semibold text-slate-800 block truncate" title={details.productId}>
            {details.productId || '-'}
          </span>
          {details.productName && (
            <span className="block text-[11px] text-slate-500 truncate" title={details.productName}>
              {details.productName}
            </span>
          )}
        </div>

        {/* 3. Batch ID */}
        <div>
          <span className="text-[11px] text-slate-400 block mb-0.5">Batch ID</span>
          <span className="font-medium text-slate-700 font-mono">
            {details.batchId != null ? details.batchId : (details.batch != null ? details.batch : '-')}
          </span>
        </div>

        {/* 4. Test Parameter */}
        <div>
          <span className="text-[11px] text-slate-400 block mb-0.5">Test Parameter</span>
          <span className="font-bold text-brand-700 block truncate" title={details.parameterName}>
            {details.parameterName || '-'}
          </span>
        </div>

        {/* 5. Assigned Analyst */}
        <div>
          <span className="text-[11px] text-slate-400 block mb-0.5">Assigned Analyst</span>
          <span className="font-medium text-slate-700 block truncate" title={details.userFullName || details.userId}>
            {details.userFullName || details.userId || '-'}
          </span>
        </div>

        {/* 6. Status (New field) */}
        <div>
          <span className="text-[11px] text-slate-400 block mb-0.5">Status</span>
          <div className="mt-0.5">
            {getStatusBadge(details.status)}
          </div>
        </div>

        {/* 7. TRF Document (Round Icon Buttons) */}
        <div>
          <span className="text-[11px] text-slate-400 block mb-0.5">TRF Document</span>
          {details.trfUrl ? (
            <div className="flex items-center gap-1.5 mt-0.5">
              <button
                type="button"
                onClick={() => viewFile(details.trfUrl)}
                title="View TRF Document"
                className="flex h-6 w-6 items-center justify-center rounded-full bg-teal-50 text-teal-700 ring-1 ring-teal-200/80 transition hover:bg-teal-600 hover:text-white cursor-pointer"
              >
                <Icon name="eye" className="h-3 w-3" />
              </button>
              <button
                type="button"
                onClick={handleDownload}
                title="Download TRF Document"
                className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-slate-600 ring-1 ring-slate-200 transition hover:bg-slate-700 hover:text-white cursor-pointer"
              >
                <Icon name="download" className="h-3 w-3" />
              </button>
            </div>
          ) : (
            <span className="text-slate-400 font-mono">-</span>
          )}
        </div>
      </div>
    </div>
  )
}

