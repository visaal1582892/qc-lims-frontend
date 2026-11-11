/**
 * Dynamic metric specification input list for Submit Test Execution page.
 * Provides real-time out-of-specification boundary detection and validation.
 *
 * @param {object} props
 * @param {Array} props.specifications - Configured metric specifications
 * @param {object} props.metricValues - Map of specId -> entered value
 * @param {object} props.specValidation - Map of specId -> { isFilled, isOob, isText }
 * @param {function} props.onValueChange - Callback when a value changes: (specId, val)
 */
export default function MetricInputList({
  specifications = [],
  metricValues = {},
  specValidation = {},
  onValueChange,
}) {
  return (
    <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs">
      <div className="border-b border-slate-100 pb-3 mb-5">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
          Metric Result Specifications
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Fill in the observed test results for each configured metric specification.
        </p>
      </div>

      {!specifications || specifications.length === 0 ? (
        <div className="rounded-lg bg-slate-50 p-6 text-center text-xs text-slate-500">
          No metric specifications configured for this test parameter.
        </div>
      ) : (
        <div className="space-y-4 max-w-3xl">
          {specifications.map((spec) => {
            const valState = specValidation[spec.metricSpecificationId] || {}
            const isOob = valState.isOob
            const currentVal = metricValues[spec.metricSpecificationId] || ''

            return (
              <div
                key={spec.metricSpecificationId}
                className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border transition-all ${
                  isOob
                    ? 'border-rose-300 bg-rose-50/50 ring-1 ring-rose-200'
                    : 'border-slate-200 bg-slate-50/40 hover:bg-slate-50'
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

                {/* Input & Unit */}
                <div className="sm:w-1/2 flex items-center gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={currentVal}
                      onChange={(e) => onValueChange(spec.metricSpecificationId, e.target.value)}
                      placeholder="Enter measured value..."
                      className={`w-full rounded-lg border px-3 py-2 text-xs font-mono text-slate-900 shadow-xs transition focus:outline-hidden ${
                        isOob
                          ? 'border-rose-400 bg-white ring-1 ring-rose-400 focus:border-rose-500 focus:ring-rose-500'
                          : 'border-slate-300 bg-white focus:border-brand-500 focus:ring-1 focus:ring-brand-500'
                      }`}
                    />
                  </div>
                  {spec.unit && (
                    <span className="inline-flex items-center justify-center rounded-lg bg-slate-100 px-2.5 py-2 text-xs font-medium text-slate-600 border border-slate-200 min-w-[50px] text-center">
                      {spec.unit}
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

