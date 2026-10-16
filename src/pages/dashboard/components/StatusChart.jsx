/**
 * StatusChart — Visual status distribution bar chart.
 *
 * Displays a horizontal bar for each status group with count and percentage.
 * Used by QCDashboardPage to show AR status distribution.
 *
 * @param {Array}  data  — Array of { statusName, count, color }
 */
export function StatusChart({ data = [] }) {
  const totalCount = data.reduce((sum, d) => sum + d.count, 0) || 1

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-900/5">
      <h3 className="text-sm font-semibold text-slate-700 mb-4">Status Distribution</h3>
      {data.length === 0 ? (
        <p className="text-xs text-slate-400 text-center py-4">No data available</p>
      ) : (
        <div className="space-y-3">
          {data.map((item) => {
            const pct = ((item.count / totalCount) * 100).toFixed(1)
            return (
              <div key={item.statusName}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-slate-600">{item.statusName}</span>
                  <span className="text-xs text-slate-500">
                    {item.count} ({pct}%)
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${(item.count / totalCount) * 100}%`,
                      backgroundColor: item.color || '#6366f1',
                    }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
