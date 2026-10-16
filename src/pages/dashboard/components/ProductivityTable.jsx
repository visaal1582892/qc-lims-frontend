/**
 * ProductivityTable — Analyst productivity display.
 *
 * Shows a summary table of analyst test counts with pass/fail/pending breakdown.
 *
 * @param {Array}  data    — Array of { analystId, totalTests, completed, passed, failed, pending, onHold }
 * @param {boolean} loading — Loading state
 */
export function ProductivityTable({ data = [], loading = false }) {
  const columns = [
    { key: 'analystId', label: 'Analyst ID', width: 100 },
    { key: 'totalTests', label: 'Total Tests', width: 100 },
    { key: 'completed', label: 'Completed', width: 90 },
    { key: 'passed', label: 'Passed', width: 80, render: (v) => (
      <span className="text-emerald-600 font-medium">{v}</span>
    )},
    { key: 'failed', label: 'Failed', width: 80, render: (v) => (
      <span className="text-red-600 font-medium">{v}</span>
    )},
    { key: 'pending', label: 'Pending', width: 80, render: (v) => (
      <span className="text-amber-600 font-medium">{v}</span>
    )},
    { key: 'onHold', label: 'On Hold', width: 80, render: (v) => (
      <span className="text-orange-600 font-medium">{v}</span>
    )},
  ]

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-900/5">
      <h3 className="text-sm font-semibold text-slate-700 mb-4">Analyst Productivity</h3>
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
          <span className="ml-2 text-xs text-slate-400">Loading...</span>
        </div>
      ) : data.length === 0 ? (
        <p className="text-xs text-slate-400 text-center py-4">No productivity data available</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-200">
                {columns.map((col) => (
                  <th key={col.key} className="px-3 py-2 text-left font-semibold uppercase tracking-wide text-slate-500" style={{ width: col.width }}>
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((row, idx) => (
                <tr key={row.analystId ?? idx} className="border-b border-slate-100 hover:bg-slate-50/80">
                  {columns.map((col) => (
                    <td key={`${row.analystId}-${col.key}`} className="px-3 py-2.5 text-slate-700">
                      {col.render ? col.render(row[col.key]) : row[col.key] ?? '-'}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
