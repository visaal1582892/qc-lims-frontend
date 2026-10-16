import { Search } from 'lucide-react'

/**
 * TrackingFilters — Multi-dimensional search controls.
 *
 * Provides filter inputs for manufacturer, batch, date range, analyst,
 * parameter, and status — used by MultiDimensionalTrackingPage.
 *
 * @param {Object}   filters       — Current filter state
 * @param {function} onChange      — (key, value) => void
 * @param {function} onSearch      — () => void
 * @param {function} onReset       — () => void
 */
export function TrackingFilters({ filters, onChange, onSearch, onReset }) {
  const executionStatuses = [
    { value: '', label: 'All Statuses' },
    { value: 'Allocated', label: 'Allocated' },
    { value: 'Testing', label: 'Testing' },
    { value: 'Hold', label: 'Hold' },
    { value: 'Under_Review', label: 'Under Review' },
    { value: 'Released', label: 'Released' },
    { value: 'Rework_Requested', label: 'Rework Requested' },
    { value: 'Cancelled_Not_Performed', label: 'Cancelled' },
  ]

  const arStatuses = [
    { value: '', label: 'All AR Statuses' },
    { value: 'REGISTERED', label: 'Registered' },
    { value: 'IN_PROGRESS', label: 'In Progress' },
    { value: 'ALL_TESTS_COMPLETE', label: 'All Tests Complete' },
    { value: 'COMPLETED', label: 'Completed' },
    { value: 'CANCELLED', label: 'Cancelled' },
    { value: 'FOR_INFORMATION', label: 'For Information' },
    { value: 'REJECTED', label: 'Rejected' },
  ]

  return (
    <div className="flex flex-wrap gap-3 p-4 rounded-xl bg-slate-50 ring-1 ring-slate-200">
      <div className="flex flex-col gap-1">
        <label className="text-[10px] font-semibold uppercase text-slate-500">Manufacturer</label>
        <input
          type="number"
          placeholder="ID"
          value={filters.manufacturerId ?? ''}
          onChange={(e) => onChange('manufacturerId', e.target.value || null)}
          className="rounded-md border border-slate-200 px-2 py-1 text-xs outline-none focus:border-primary-500 w-24"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-[10px] font-semibold uppercase text-slate-500">Batch No</label>
        <input
          type="text"
          placeholder="Filter..."
          value={filters.batchNumber ?? ''}
          onChange={(e) => onChange('batchNumber', e.target.value || null)}
          className="rounded-md border border-slate-200 px-2 py-1 text-xs outline-none focus:border-primary-500 w-32"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-[10px] font-semibold uppercase text-slate-500">From</label>
        <input
          type="date"
          value={filters.dateFrom ?? ''}
          onChange={(e) => onChange('dateFrom', e.target.value || null)}
          className="rounded-md border border-slate-200 px-2 py-1 text-xs outline-none focus:border-primary-500 w-32"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-[10px] font-semibold uppercase text-slate-500">To</label>
        <input
          type="date"
          value={filters.dateTo ?? ''}
          onChange={(e) => onChange('dateTo', e.target.value || null)}
          className="rounded-md border border-slate-200 px-2 py-1 text-xs outline-none focus:border-primary-500 w-32"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-[10px] font-semibold uppercase text-slate-500">Analyst</label>
        <input
          type="number"
          placeholder="ID"
          value={filters.analystId ?? ''}
          onChange={(e) => onChange('analystId', e.target.value || null)}
          className="rounded-md border border-slate-200 px-2 py-1 text-xs outline-none focus:border-primary-500 w-24"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-[10px] font-semibold uppercase text-slate-500">Parameter</label>
        <input
          type="number"
          placeholder="ID"
          value={filters.parameterId ?? ''}
          onChange={(e) => onChange('parameterId', e.target.value || null)}
          className="rounded-md border border-slate-200 px-2 py-1 text-xs outline-none focus:border-primary-500 w-24"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-[10px] font-semibold uppercase text-slate-500">Exec Status</label>
        <select
          value={filters.executionStatus ?? ''}
          onChange={(e) => onChange('executionStatus', e.target.value || null)}
          className="rounded-md border border-slate-200 px-2 py-1 text-xs outline-none focus:border-primary-500 w-36"
        >
          {executionStatuses.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-[10px] font-semibold uppercase text-slate-500">AR Status</label>
        <select
          value={filters.arStatus ?? ''}
          onChange={(e) => onChange('arStatus', e.target.value || null)}
          className="rounded-md border border-slate-200 px-2 py-1 text-xs outline-none focus:border-primary-500 w-36"
        >
          {arStatuses.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
      </div>
      <div className="flex items-end gap-2">
        <button
          onClick={onSearch}
          className="flex items-center gap-1.5 rounded-md bg-primary-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-primary-600 transition-colors"
        >
          <Search className="h-3 w-3" />
          Search
        </button>
        <button
          onClick={onReset}
          className="flex items-center gap-1.5 rounded-md border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
        >
          Reset
        </button>
      </div>
    </div>
  )
}
