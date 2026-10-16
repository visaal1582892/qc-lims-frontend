import { useState, useMemo } from 'react'
import { Search, MoreVertical } from 'lucide-react'

/**
 * Enterprise data table with sticky headers, inline filters, and sticky action column.
 * Follows UI spec Section 6.2 layout rules.
 *
 * @param {Array} columns - Column definitions: { key, label, width?, filter?, render? }
 * @param {Array} data - Row data array
 * @param {boolean} loading - Loading state
 */
export function DataTable({ columns = [], data = [], loading = false }) {
  const [filters, setFilters] = useState({})

  const filteredData = useMemo(() => {
    return data.filter((row) => {
      return columns.every((col) => {
        const filterValue = filters[col.key]?.toLowerCase()
        if (!filterValue) return true
        const cellValue = String(row[col.key] ?? '').toLowerCase()
        return cellValue.includes(filterValue)
      })
    })
  }, [data, columns, filters])

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  return (
    <div className="w-full flex-1 overflow-auto rounded-xl border border-slate-200/80 bg-white shadow-sm">
      <table className="w-full min-w-full table-fixed border-separate border-spacing-0 text-xs">
        <thead className="sticky top-0 z-20 bg-slate-50">
          {/* Header row */}
          <tr>
            {columns.map((col, i) => (
              <th
                key={col.key}
                className={`text-xs font-semibold uppercase tracking-wide text-slate-500 px-4 py-3 text-left border-b border-slate-200 ${col.stickyRight ? 'sticky right-0 z-30 bg-slate-200 text-right' : ''}`}
                style={col.width ? { width: col.width } : undefined}
              >
                {col.label}
              </th>
            ))}
          </tr>
          {/* Inline filter row */}
          <tr>
            {columns.map((col) => (
              <td key={`filter-${col.key}`} className={`px-2 py-1 border-b border-slate-100 bg-white ${col.stickyRight ? 'sticky right-0 z-[1] bg-slate-100' : ''}`} style={col.width ? { width: col.width } : undefined}>
                {col.filter !== false && !col.stickyRight && (
                  <input
                    type="text"
                    placeholder="Filter..."
                    value={filters[col.key] || ''}
                    onChange={(e) => handleFilterChange(col.key, e.target.value)}
                    className="w-full rounded-md border border-slate-200 px-2 py-1 text-xs outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-100"
                  />
                )}
              </td>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={columns.length} className="text-center py-8 text-slate-400">
                <div className="flex items-center justify-center gap-2">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
                  <span>Loading...</span>
                </div>
              </td>
            </tr>
          ) : filteredData.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="text-center py-12 text-slate-400">
                <div className="flex flex-col items-center gap-1">
                  <Search className="h-8 w-8 text-slate-300" />
                  <p className="text-sm font-medium">No records found</p>
                  <p className="text-[11px]">Try adjusting your filters or create a new record</p>
                </div>
              </td>
            </tr>
          ) : (
            filteredData.map((row, rowIdx) => (
              <tr key={row.id ?? rowIdx} className="bg-white hover:bg-slate-50/80 transition-colors">
                {columns.map((col) => (
                  <td
                    key={`${row.id ?? rowIdx}-${col.key}`}
                    className={`px-4 py-2.5 text-slate-700 border-b border-slate-100 ${col.stickyRight ? 'sticky right-0 z-[1] bg-slate-50 text-right' : ''}`}
                  >
                    {col.render ? col.render(row[col.key], row) : row[col.key] ?? '-'}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
