import Icon from './Icon'

/**
 * Shared header bar for Submit Test Execution and View Test Execution pages.
 *
 * @param {object} props
 * @param {string} props.title - Page title (e.g. "Submit Test Execution" or "View Test Execution")
 * @param {number|string} props.attemptNumber - The attempt number
 * @param {string} props.parameterName - Test parameter name
 * @param {string} [props.arNumber] - AR Number
 * @param {React.ReactNode} [props.statusBadge] - Optional status badge element (used in View Test)
 * @param {React.ReactNode} [props.actions] - Optional action buttons (e.g. Approve & Rework buttons)
 * @param {function} props.onBack - Back navigation click handler
 * @param {function} [props.onOpenHistory] - Handler to open Test History modal
 */
export default function TestExecutionHeader({
  title = 'Test Execution',
  attemptNumber,
  parameterName,
  arNumber,
  statusBadge,
  actions,
  onBack,
  onOpenHistory,
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200/80 bg-white p-4 sm:px-6 rounded-xl shadow-xs">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          title="Back to Assigned Tests"
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 transition cursor-pointer"
        >
          <Icon name="chevronLeft" className="h-4 w-4" />
        </button>
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-base font-bold text-slate-900 tracking-tight">
              {title}
            </h1>
            {attemptNumber != null && (
              <span className="inline-flex items-center rounded-md bg-rose-50 px-2 py-0.5 text-xs font-bold text-rose-700 ring-1 ring-rose-200/80">
                Attempt #{attemptNumber}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            <span className="font-medium text-slate-700">{parameterName || 'Test Parameter'}</span>
            {' • AR: '}
            <span className="font-mono font-semibold text-slate-800">
              {arNumber || 'Pending'}
            </span>
          </p>
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-3">
        {statusBadge}
        {actions}
        {onOpenHistory && (
          <button
            type="button"
            onClick={onOpenHistory}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition cursor-pointer"
          >
            <Icon name="clock" className="h-4 w-4 text-brand-600" />
            Test History
          </button>
        )}
      </div>
    </div>
  )
}
