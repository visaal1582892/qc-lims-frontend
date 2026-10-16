import { FormInput } from '../../../components/form/FormInput'
import { FormSelect } from '../../../components/form/FormSelect'

/**
 * Filter bar component for Test Parameters list page.
 *
 * Filters by product_id, parameter name search, and standard reference.
 * Tier 2 sub-component (colocated per architecture rule).
 */
export function TestParameterFilters({ filters, onFilterChange, onReset }) {
  const standardRefs = [
    { value: 'IP', label: 'IP' },
    { value: 'BP', label: 'BP' },
    { value: 'USP', label: 'USP' },
    { value: 'EP', label: 'EP' },
    { value: 'JP', label: 'JP' },
    { value: 'IS', label: 'IS' },
    { value: 'MOA', label: 'MOA' },
    { value: 'STP', label: 'STP' },
  ]

  const hasActiveFilters = filters.productId || filters.search || filters.standardReference

  return (
    <div className="flex flex-wrap items-end gap-3 mb-4">
      <div style={{ minWidth: 140 }}>
        <input
          type="number"
          placeholder="Product ID"
          value={filters.productId || ''}
          onChange={(e) => onFilterChange('productId', e.target.value)}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-800 placeholder-slate-400 shadow-sm outline-none transition focus:ring-2 focus:border-primary-500 focus:ring-primary-100"
        />
        <p className="text-[11px] text-slate-400 mt-0.5">Filter by product</p>
      </div>

      <div style={{ minWidth: 200 }}>
        <input
          type="text"
          placeholder="Search parameter name..."
          value={filters.search || ''}
          onChange={(e) => onFilterChange('search', e.target.value)}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-800 placeholder-slate-400 shadow-sm outline-none transition focus:ring-2 focus:border-primary-500 focus:ring-primary-100"
        />
        <p className="text-[11px] text-slate-400 mt-0.5">Search by name</p>
      </div>

      <div style={{ minWidth: 130 }}>
        <select
          value={filters.standardReference || ''}
          onChange={(e) => onFilterChange('standardReference', e.target.value)}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-800 shadow-sm outline-none transition appearance-none focus:ring-2 focus:border-primary-500 focus:ring-primary-100"
        >
          <option value="">All Standards</option>
          {standardRefs.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <p className="text-[11px] text-slate-400 mt-0.5">Standard reference</p>
      </div>

      {hasActiveFilters && (
        <button
          onClick={onReset}
          className="px-3 py-2 text-xs font-medium text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
        >
          Reset
        </button>
      )}
    </div>
  )
}
