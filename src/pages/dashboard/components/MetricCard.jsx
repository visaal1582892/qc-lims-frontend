/**
 * MetricCard — KPI card component for dashboard metrics.
 *
 * Displays a single metric with a color-coded icon badge and large value.
 * Used by QCDashboardPage for all KPI sections.
 *
 * @param {string}  label     — Display label (e.g. "Pending Feasibility")
 * @param {number}  value     — Numeric value
 * @param {string}  color     — Color key: 'amber'|'green'|'red'|'blue'|'purple'|'orange'
 */
export function MetricCard({ label, value = 0, color = 'blue' }) {
  const colorMap = {
    amber: 'from-amber-400 to-amber-600',
    green: 'from-emerald-400 to-emerald-600',
    red: 'from-red-400 to-red-600',
    blue: 'from-blue-400 to-blue-600',
    purple: 'from-violet-400 to-violet-600',
    orange: 'from-orange-400 to-orange-600',
  }

  return (
    <div className="group flex flex-col overflow-hidden rounded-2xl bg-white px-4 py-3.5 shadow-sm ring-1 ring-slate-900/5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:ring-slate-900/8">
      <div className="flex items-start justify-between">
        <div className={`inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br ${colorMap[color] || 'from-slate-400 to-slate-600'} text-white shadow-sm`}>
          <span className="text-sm font-bold">{value}</span>
        </div>
      </div>
      <div className="mt-2">
        <div className="text-3xl font-bold tracking-tight text-slate-900 leading-none">
          {value}
        </div>
        <div className="mt-1 text-xs font-medium text-slate-400">{label}</div>
      </div>
    </div>
  )
}
