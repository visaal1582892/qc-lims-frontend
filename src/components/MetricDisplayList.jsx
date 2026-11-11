import Icon from './Icon'

/**
 * Read-only metric specification display list for View Test Execution page.
 * Uses identical card structure as MetricInputList, displaying observed results as labels with units.
 *
 * @param {object} props
 * @param {Array} props.specifications - Configured metric specifications with recorded values
 * @param {string} [props.submissionNotes] - Submission notes entered by the analyst
 */
export default function MetricDisplayList({ specifications = [], submissionNotes }) {
  return (
    <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs">
      <div className="border-b border-slate-100 pb-3 mb-5">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
          Metric Result Specifications
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Recorded test values and acceptance limits for this execution attempt.
        </p>
      </div>

      {!specifications || specifications.length === 0 ? (
        <div className="rounded-lg bg-slate-50 p-6 text-center text-xs text-slate-500">
          No metric specifications recorded for this execution.
        </div>
      ) : (
        <div className="space-y-4 max-w-3xl">
          {specifications.map((spec) => {
            const isOob = Boolean(spec.isOutOfBound)
            const displayVal = spec.metricValue != null && spec.metricValue !== '' ? spec.metricValue : '—'

            return (
              <div
                key={spec.metricSpecificationId || spec.metricId}
                className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border transition-all ${
                  isOob
                    ? 'border-rose-300 bg-rose-50/50 ring-1 ring-rose-200'
                    : 'border-slate-200 bg-slate-50/40'
                }`}
              >
                {/* Metric Label & Bounds Subtext */}
                <div className="sm:w-1/2 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-800 truncate">
                      {spec.metricName}
                    </span>
                    {isOob && (
                      <span className="inline-flex items-center rounded bg-rose-100 px-1.5 py-0.5 text-[10px] font-bold text-rose-700">
                        Out of Spec
                      </span>
                    )}
                  </div>
                  {/* Range Subtext */}
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Acceptable Range:{' '}
                    <span className="font-mono font-semibold text-slate-700">
                      {spec.lowerBound != null ? spec.lowerBound : '—'}
                    </span>
                    {' to '}
                    <span className="font-mono font-semibold text-slate-700">
                      {spec.upperBound != null ? spec.upperBound : '—'}
                    </span>
                    {spec.unit && <span className="ml-1 text-slate-400">({spec.unit})</span>}
                  </div>
                </div>

                {/* Read-Only Result Label with Unit */}
                <div className="sm:w-1/2 flex items-center justify-start sm:justify-end gap-2">
                  <div className={`px-3.5 py-1.5 rounded-lg border flex items-center gap-2 ${
                    isOob
                      ? 'bg-rose-100/60 border-rose-300 text-rose-900'
                      : 'bg-white border-slate-200 text-slate-800'
                  }`}>
                    <span className="text-xs text-slate-400 uppercase font-semibold text-[10px]">Result:</span>
                    <span className="font-mono font-bold text-xs">
                      {displayVal}
                    </span>
                    {spec.unit && (
                      <span className="text-[11px] text-slate-500 font-medium">
                        {spec.unit}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Submission Notes / Observations */}
      {submissionNotes && (
        <div className="mt-5 border-t border-slate-100 pt-4">
          <h3 className="text-xs font-bold text-slate-700 flex items-center gap-1.5 mb-1.5">
            <Icon name="messageSquare" className="h-3.5 w-3.5 text-brand-600" />
            Analyst Submission Notes / Observations
          </h3>
          <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3 text-xs text-slate-700">
            {submissionNotes}
          </div>
        </div>
      )}
    </div>
  )
}
